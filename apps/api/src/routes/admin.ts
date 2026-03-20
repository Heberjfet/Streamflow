import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getSecurityFlags, getFlag, setFlag, FLAG_DESCRIPTIONS, SECURITY_FLAGS, type SecurityFlag } from "../../../packages/shared/flags.ts";

export async function adminRouter(fastify: FastifyInstance) {
  // All admin routes require admin role
  fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role?: string } | undefined;
    if (!user || user.role !== "admin") {
      return reply.status(403).send({ success: false, error: "Admin access required" });
    }
  });

  // ==================== GET ALL FLAGS ====================
  fastify.get("/flags", async (request, reply) => {
    const flags = await getSecurityFlags();
    
    const flagsWithDescription = Object.entries(flags).map(([name, isEnabled]) => ({
      name,
      is_enabled: isEnabled,
      description: FLAG_DESCRIPTIONS[name as SecurityFlag] || "No description",
    }));

    return { success: true, data: flagsWithDescription };
  });

  // ==================== UPDATE FLAG ====================
  fastify.put<{ Params: { name: string }; Body: { is_enabled: boolean } }>(
    "/flags/:name",
    async (request, reply) => {
      const { name } = request.params;
      const { is_enabled } = request.body;

      try {
        await setFlag(name, is_enabled);
        return {
          success: true,
          data: { name, is_enabled },
          message: `Flag ${name} ${is_enabled ? "enabled" : "disabled"}`,
        };
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // ==================== GET INCIDENTS ====================
  fastify.get<{
    Querystring: { status?: string; severity?: string; limit?: string; offset?: string }
  }>("/incidents", async (request, reply) => {
    const { status, severity, limit = "50", offset = "0" } = request.query;

    // TODO: Query from database
    const incidents = [
      {
        id: "1",
        type: "login_failed",
        severity: "low",
        status: "open",
        description: "Failed login attempt",
        ip_address: "192.168.1.1",
        created_at: new Date().toISOString(),
      },
    ];

    return { success: true, data: incidents };
  });

  // ==================== GET SINGLE INCIDENT ====================
  fastify.get<{ Params: { id: string } }>("/incidents/:id", async (request, reply) => {
    const { id } = request.params;

    return {
      success: true,
      data: {
        id,
        type: "login_failed",
        severity: "low",
        status: "open",
        description: "Failed login attempt",
        ip_address: "192.168.1.1",
        created_at: new Date().toISOString(),
      },
    };
  });

  // ==================== UPDATE INCIDENT ====================
  fastify.patch<{
    Params: { id: string };
    Body: { status: string; notes?: string }
  }>("/incidents/:id", async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;

    return {
      success: true,
      data: {
        id,
        status,
        updated_at: new Date().toISOString(),
      },
    };
  });

  // ==================== GET INCIDENT STATS ====================
  fastify.get("/incidents/stats", async (request, reply) => {
    return {
      success: true,
      data: {
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        by_severity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
      },
    };
  });

  // ==================== GET SECURITY LOGS ====================
  fastify.get("/security/logs", async (request, reply) => {
    return { success: true, data: [] };
  });

  // ==================== GET SECURITY STATS ====================
  fastify.get("/security/stats", async (request, reply) => {
    return {
      success: true,
      data: {
        total_logins: 0,
        failed_logins: 0,
        blocked_accounts: 0,
        active_sessions: 0,
      },
    };
  });
}
