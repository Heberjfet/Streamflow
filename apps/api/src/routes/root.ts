import { FastifyInstance } from "fastify";

export async function rootRouter(fastify: FastifyInstance) {
  fastify.get("/", async () => {
    return {
      name: "StreamFlow API",
      version: "1.0.0",
      description: "Video streaming platform with AI generation",
      endpoints: {
        auth: "/api/v1/auth",
        videos: "/api/v1/videos",
        admin: "/api/v1/admin",
        health: "/health",
      },
    };
  });
}
