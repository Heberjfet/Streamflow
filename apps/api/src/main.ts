import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import { rootRouter } from "./routes/root.ts";
import { authRouter } from "./routes/auth.ts";
import { videosRouter } from "./routes/videos.ts";
import { adminRouter } from "./routes/admin.ts";
import { securityMiddleware } from "./middleware/security.ts";
import { incidentMiddleware } from "./middleware/incidents/index.ts";
import { getSecurityFlags } from "./flags.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8000");

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  },
});

async function start() {
  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie, {
    secret: Deno.env.get("COOKIE_SECRET") || "supersecretkey",
  });

  await app.register(jwt, {
    secret: Deno.env.get("JWT_SECRET") || "fallback-secret-change-me",
  });

  // Rate limiting - controlled by flag
  const flags = await getSecurityFlags();
  if (flags.AUTH_RATE_LIMIT) {
    await app.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
      errorResponseBuilder: (req, context) => ({
        statusCode: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded. Retry in ${Math.ceil(context.ttl / 1000)} seconds.`,
      }),
    });
  }

  // Register middleware
  await app.register(securityMiddleware);
  await app.register(incidentMiddleware);

  // Static files for HLS streams
  await app.register(staticFiles, {
    root: "/data/streams",
    prefix: "/streams/",
  });

  // Register routes
  await app.register(rootRouter, { prefix: "/api/v1" });
  await app.register(authRouter, { prefix: "/api/v1/auth" });
  await app.register(videosRouter, { prefix: "/api/v1/videos" });
  await app.register(adminRouter, { prefix: "/api/v1/admin" });

  // Health check
  app.get("/health", async () => ({ status: "ok" }));

  // Start server
  try {
    await app.listen({ port: PORT, hostname: "0.0.0.0" });
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  } catch (err) {
    app.log.error(err);
    Deno.exit(1);
  }
}

start();
