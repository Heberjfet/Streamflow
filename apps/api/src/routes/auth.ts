import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getFlag } from "../../../packages/shared/flags.ts";

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  password: string;
  username: string;
}

export async function authRouter(fastify: FastifyInstance) {
  // ==================== REGISTER ====================
  fastify.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
    const { email, password, username } = request.body;

    // TODO: Validate with schema, hash password, save to DB
    const user = {
      id: crypto.randomUUID(),
      email,
      username,
      role: "user",
      is_2fa_enabled: false,
      created_at: new Date(),
    };

    // Generate JWT
    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: "4h" }
    );

    const refreshToken = fastify.jwt.sign(
      { id: user.id },
      { expiresIn: "7d" }
    );

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  });

  // ==================== LOGIN ====================
  fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
    const { email, password } = request.body;

    // TODO: Validate credentials against DB
    // Check if account is locked

    const isLockoutEnabled = await getFlag("AUTH_ACCOUNT_LOCKOUT");
    if (isLockoutEnabled) {
      // Check failed attempt count
      // If >= 5, reject with account locked error
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      username: "demo",
      role: "user" as const,
    };

    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: "4h" }
    );

    const refreshToken = fastify.jwt.sign(
      { id: user.id },
      { expiresIn: "7d" }
    );

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  });

  // ==================== LOGOUT ====================
  fastify.post("/logout", async (request, reply) => {
    // TODO: Invalidate session/token
    return { success: true, message: "Logged out successfully" };
  });

  // ==================== REFRESH TOKEN ====================
  fastify.post<{ Body: { refresh_token: string } }>(
    "/refresh",
    async (request, reply) => {
      const { refresh_token } = request.body;

      try {
        const decoded = fastify.jwt.verify(refresh_token);
        const newToken = fastify.jwt.sign(
          { id: decoded.id },
          { expiresIn: "4h" }
        );

        return { success: true, data: { token: newToken } };
      } catch {
        return reply.status(401).send({
          success: false,
          error: "Invalid refresh token",
        });
      }
    }
  );

  // ==================== GET CURRENT USER ====================
  fastify.get(
    "/me",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as { id: string; email: string; role: string };
      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    }
  );

  // ==================== 2FA SETUP ====================
  fastify.post("/2fa/setup", { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const is2FAEnabled = await getFlag("AUTH_2FA");
    if (!is2FAEnabled) {
      return reply.status(403).send({
        success: false,
        error: "2FA is not enabled",
      });
    }

    // TODO: Generate TOTP secret, return QR code
    const secret = "JBSWY3DPEHPK3PXP"; // Demo secret
    const otpauthUrl = `otpauth://totp/StreamFlow:${request.user.email}?secret=${secret}&issuer=StreamFlow`;

    return {
      success: true,
      data: {
        secret,
        otpauthUrl,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`,
      },
    };
  });

  // ==================== 2FA VERIFY ====================
  fastify.post<{ Body: { code: string } }>(
    "/2fa/verify",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { code } = request.body;

      // TODO: Verify TOTP code with otplib
      // const isValid = authenticator.verify({ token: code, secret });

      if (code === "000000") {
        // Demo - any 6 zeros passes
        return {
          success: true,
          data: { verified: true },
        };
      }

      return reply.status(401).send({
        success: false,
        error: "Invalid 2FA code",
      });
    }
  );

  // ==================== GOOGLE OAUTH ====================
  fastify.get("/oauth/google", async (request, reply) => {
    const isOAuthEnabled = await getFlag("AUTH_OAUTH_GOOGLE");
    if (!isOAuthEnabled) {
      return reply.status(403).send({
        success: false,
        error: "Google OAuth is not enabled",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = "http://localhost:8000/api/v1/auth/oauth/google/callback";
    const scope = encodeURIComponent("email profile");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

    return reply.redirect(authUrl);
  });

  fastify.get("/oauth/google/callback", async (request, reply) => {
    const { code } = request.query as { code?: string };

    if (!code) {
      return reply.status(400).send({
        success: false,
        error: "Missing authorization code",
      });
    }

    // TODO: Exchange code for tokens, get user info, create session
    return {
      success: true,
      data: {
        token: "demo-oauth-token",
        user: {
          id: crypto.randomUUID(),
          email: "user@gmail.com",
          username: "google-user",
        },
      },
    };
  });
}
