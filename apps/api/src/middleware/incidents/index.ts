import { FastifyInstance, FastifyRequest } from "fastify";
import { securityFlags, INCIDENT_TYPES } from "../../../packages/shared/flags.ts";

interface IncidentPayload {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

async function logIncident(fastify: FastifyInstance, payload: IncidentPayload) {
  if (!securityFlags.INCIDENTS_LOGGING) return;

  console.log(`[INCIDENT] ${payload.severity.toUpperCase()}: ${payload.type} - ${payload.description}`);
  
  // Here you would save to database
  // await fastify.db.incidents.create(payload);
}

export async function incidentMiddleware(fastify: FastifyInstance) {
  // Listen for incident events
  fastify.addHook("onReady", async () => {
    fastify.server?.on("incident", async (payload: IncidentPayload) => {
      await logIncident(fastify, payload);
    });
  });

  // Failed login detection
  fastify.addHook("preHandler", async (request, reply) => {
    if (!securityFlags.INCIDENTS_AUTO_DETECT) return;
    if (!request.url.includes("/auth/login")) return;

    // This runs BEFORE the login attempt, we'll check after in the response
  });

  // After login response - check for failed attempts
  fastify.addHook("onSend", async (request, reply) => {
    if (!securityFlags.INCIDENTS_AUTO_DETECT) return;
    if (!request.url.includes("/auth/login")) return;

    // If response is 401, login failed
    if (reply.statusCode === 401) {
      await logIncident(fastify, {
        type: INCIDENT_TYPES.LOGIN_FAILED,
        severity: "low",
        description: "Failed login attempt",
        ip_address: request.ip,
        user_agent: request.headers["user-agent"],
        metadata: { email: (request.body as { email?: string })?.email },
      });

      // Check if account lockout is enabled
      if (securityFlags.AUTH_ACCOUNT_LOCKOUT) {
        // Here you would check failed attempt count and lock account
        console.log("[SECURITY] Account lockout check triggered");
      }
    }

    // If response is 200, successful login
    if (reply.statusCode === 200) {
      await logIncident(fastify, {
        type: INCIDENT_TYPES.LOGIN_SUCCESS,
        severity: "low",
        description: "Successful login",
        ip_address: request.ip,
        user_agent: request.headers["user-agent"],
      });
    }
  });

  // Time-based access control (8am - 10pm)
  fastify.addHook("preHandler", async (request, reply) => {
    if (!securityFlags.INCIDENTS_AUTO_DETECT) return;

    // Skip for public endpoints
    const publicPaths = ["/api/v1/auth/login", "/api/v1/auth/register", "/health"];
    if (publicPaths.some((path) => request.url.startsWith(path))) return;

    const hour = new Date().getHours();
    if (hour < 8 || hour > 22) {
      await logIncident(fastify, {
        type: "access_out_of_hours",
        severity: "medium",
        description: `Access attempt outside allowed hours (${hour}:00)`,
        ip_address: request.ip,
        user_agent: request.headers["user-agent"],
      });
    }
  });
}
