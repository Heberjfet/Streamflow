import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getFlag } from "../../../packages/shared/flags.ts";

interface VideoParams {
  id: string;
}

interface CreateVideoBody {
  title: string;
  description?: string;
}

interface UpdateVideoBody {
  title?: string;
  description?: string;
}

export async function videosRouter(fastify: FastifyInstance) {
  // ==================== LIST VIDEOS ====================
  fastify.get("/", async (request, reply) => {
    // TODO: Query from DB with pagination
    return {
      success: true,
      data: {
        videos: [],
        total: 0,
        page: 1,
        pageSize: 20,
      },
    };
  });

  // ==================== GET VIDEO ====================
  fastify.get<{ Params: VideoParams }>("/:id", async (request, reply) => {
    const { id } = request.params;

    // TODO: Get from DB
    const video = {
      id,
      title: "Demo Video",
      description: "A demo video",
      status: "ready",
      hls_path: `/streams/${id}/playlist.m3u8`,
      thumbnail_url: "https://picsum.photos/640/360",
      duration: 120,
      view_count: 0,
      created_at: new Date().toISOString(),
    };

    // Increment view count
    // await fastify.db.videos.update(id, { view_count: video.view_count + 1 });

    return { success: true, data: video };
  });

  // ==================== CREATE VIDEO ====================
  fastify.post<{ Body: CreateVideoBody }>(
    "/",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { title, description } = request.body;
      const user = request.user as { id: string };

      // IDOR protection - check if user has permission
      const isIDOREnabled = await getFlag("PROTECTION_IDOR");
      if (isIDOREnabled) {
        // TODO: Verify ownership before creation
      }

      // TODO: Upload to MinIO, create DB record
      const video = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title,
        description: description || null,
        status: "uploading",
        created_at: new Date().toISOString(),
      };

      // Emit job to RabbitMQ for processing
      // await fastify.mq.publish("video.process", { videoId: video.id });

      return reply.status(201).send({
        success: true,
        data: video,
      });
    }
  );

  // ==================== UPDATE VIDEO ====================
  fastify.put<{ Params: VideoParams; Body: UpdateVideoBody }>(
    "/:id",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { title, description } = request.body;
      const user = request.user as { id: string };

      // IDOR protection - verify ownership
      const isIDOREnabled = await getFlag("PROTECTION_IDOR");
      if (isIDOREnabled) {
        // TODO: Get video from DB, check if user_id === user.id
        // const video = await fastify.db.videos.get(id);
        // if (video.user_id !== user.id) {
        //   return reply.status(403).send({ success: false, error: "Access denied" });
        // }
      }

      // TODO: Update in DB
      return {
        success: true,
        data: {
          id,
          title,
          description,
          updated_at: new Date().toISOString(),
        },
      };
    }
  );

  // ==================== DELETE VIDEO ====================
  fastify.delete<{ Params: VideoParams }>(
    "/:id",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user as { id: string; role?: string };

      // Admin can delete any video, users only their own
      if (user.role !== "admin") {
        const isIDOREnabled = await getFlag("PROTECTION_IDOR");
        if (isIDOREnabled) {
          // TODO: Verify ownership
        }
      }

      // TODO: Delete from DB and MinIO
      return { success: true, message: "Video deleted" };
    }
  );

  // ==================== UPLOAD VIDEO (Multipart) ====================
  fastify.post<{ Params: VideoParams }>(
    "/:id/upload",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params;

      // TODO: Handle multipart upload to MinIO
      // const data = await request.file();
      // await fastify.minio.putObject(data);

      return {
        success: true,
        data: {
          id,
          status: "uploading",
          message: "Upload started",
        },
      };
    }
  );

  // ==================== GET HLS PLAYLIST ====================
  fastify.get<{ Params: VideoParams }>("/:id/playlist.m3u8", async (request, reply) => {
    const { id } = request.params;

    // TODO: Check video exists and is ready
    // TODO: Serve HLS playlist from MinIO or local storage

    const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1920x1080
1080p.m3u8`;

    return reply
      .header("Content-Type", "application/vnd.apple.mpegurl")
      .header("Cache-Control", "public, max-age=31536000")
      .send(playlist);
  });
}
