import { FastifyInstance } from "fastify";
import { securityFlags } from "../../packages/shared/flags.ts";

export async function securityMiddleware(fastify: FastifyInstance) {
  // XSS Protection Middleware - controlled by flag
  fastify.addHook("preHandler", async (request, reply) => {
    if (securityFlags.PROTECTION_XSS) {
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
      ];

      const body = request.body as Record<string, unknown>;
      const params = { ...request.query, ...request.params };

      const checkForXSS = (data: Record<string, unknown>, path: string) => {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === "string") {
            for (const pattern of xssPatterns) {
              if (pattern.test(value)) {
                return { key, value, pattern: pattern.source };
              }
            }
          }
        }
        return null;
      };

      if (body && Object.keys(body).length > 0) {
        const xssFound = checkForXSS(body, "body");
        if (xssFound) {
          // Log incident if flag is enabled
          if (securityFlags.INCIDENTS_AUTO_DETECT) {
            await request.server.emit("incident", {
              type: "xss_attempt",
              severity: "high",
              description: `XSS attempt detected in body: ${xssFound.key}`,
              ip_address: request.ip,
              user_agent: request.headers["user-agent"],
              metadata: { key: xssFound.key, pattern: xssFound.pattern },
            });
          }
          return reply.status(400).send({
            success: false,
            error: "Invalid input detected",
          });
        }
      }
    }
  });

  // SQL Injection Protection Middleware - controlled by flag
  fastify.addHook("preHandler", async (request, reply) => {
    if (securityFlags.PROTECTION_SQLI) {
      const sqliPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
        /(--|;|\/\*|\*\/|@@|@)/,
        /(\bOR\b\s+\d+\s*=\s*\d+)/i,
        /(\bAND\b\s+\d+\s*=\s*\d+)/i,
      ];

      const body = request.body as Record<string, unknown>;
      const checkForSQLi = (data: Record<string, unknown>): boolean => {
        for (const value of Object.values(data)) {
          if (typeof value === "string") {
            for (const pattern of sqliPatterns) {
              if (pattern.test(value)) {
                return true;
              }
            }
          }
        }
        return false;
      };

      if (body && Object.keys(body).length > 0) {
        if (checkForSQLi(body)) {
          if (securityFlags.INCIDENTS_AUTO_DETECT) {
            await request.server.emit("incident", {
              type: "sqli_attempt",
              severity: "critical",
              description: "SQL injection attempt detected",
              ip_address: request.ip,
              user_agent: request.headers["user-agent"],
              metadata: { body: Object.keys(body) },
            });
          }
          return reply.status(400).send({
            success: false,
            error: "Invalid input detected",
          });
        }
      }
    }
  });

  // Request logging for audit - controlled by flag
  fastify.addHook("onRequest", async (request) => {
    if (securityFlags.AUDIT_FULL) {
      console.log(`[AUDIT] ${request.method} ${request.url} - ${request.ip}`);
    }
  });
}
