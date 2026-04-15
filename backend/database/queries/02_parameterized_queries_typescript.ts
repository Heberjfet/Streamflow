/**
 * StreamFlow - Queries Parametrizadas en TypeScript
 * Versión: 1.0.0
 * Descripción: Queries comunes para uso en la aplicación
 */

import { sql } from '../db/database.ts';

export interface VideoResult {
  id: string;
  title: string;
  description: string | null;
  hls_path: string;
  poster_path: string | null;
  duration: number | null;
  file_size: number | null;
  is_processed: boolean;
  is_published: boolean;
  view_count: number;
  created_at: Date;
  category_name: string | null;
  category_slug: string | null;
  uploader_name: string | null;
  uploader_avatar: string | null;
}

export interface VideoDetail extends VideoResult {
  status: string;
  updated_at: Date;
  category_id: string | null;
  uploader_id: string | null;
}

export interface DashboardStats {
  total_videos: number;
  published_videos: number;
  processing_videos: number;
  total_users: number;
  active_users: number;
  total_views: bigint;
  categories_count: number;
}

export async function getVideos(
  categorySlug?: string,
  status: string = 'published',
  limit: number = 50,
  offset: number = 0
): Promise<VideoResult[]> {
  const videos = await sql`
    SELECT
      v.id, v.title, v.description, v.hls_path, v.poster_path,
      v.duration, v.file_size, v.is_processed, v.is_published,
      v.view_count, v.created_at,
      c.name as category_name, c.slug as category_slug,
      u.name as uploader_name, u.avatar_url as uploader_avatar
    FROM videos v
    LEFT JOIN categories c ON c.id = v.category_id
    LEFT JOIN users u ON u.id = v.uploader_id
    WHERE ${categorySlug ? sql`c.slug = ${categorySlug}` : sql`TRUE`}
      AND ${status ? sql`v.status = ${status}` : sql`TRUE`}
      AND v.is_published = TRUE
    ORDER BY v.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  return videos as VideoResult[];
}

export async function getVideoById(videoId: string): Promise<VideoDetail | null> {
  const [video] = await sql`
    SELECT
      v.id, v.title, v.description, v.hls_path, v.poster_path,
      v.duration, v.file_size, v.status, v.is_processed, v.is_published,
      v.view_count, v.created_at, v.updated_at,
      c.id as category_id, c.name as category_name, c.slug as category_slug,
      u.id as uploader_id, u.name as uploader_name, u.avatar_url as uploader_avatar
    FROM videos v
    LEFT JOIN categories c ON c.id = v.category_id
    LEFT JOIN users u ON u.id = v.uploader_id
    WHERE v.id = ${videoId}
  `;
  return video || null;
}

export async function searchVideos(query: string, limit: number = 20) {
  const videos = await sql`
    SELECT
      v.id, v.title, v.description, v.poster_path,
      v.duration, c.name as category_name, v.view_count
    FROM videos v
    LEFT JOIN categories c ON c.id = v.category_id
    WHERE v.is_published = TRUE
      AND (v.title ILIKE ${'%' + query + '%'}
           OR v.description ILIKE ${'%' + query + '%'})
    ORDER BY v.view_count DESC
    LIMIT ${limit}
  `;
  return videos;
}

export async function getRelatedVideos(videoId: string, limit: number = 5) {
  const [video] = await sql`SELECT category_id FROM videos WHERE id = ${videoId}`;

  if (!video) return [];

  const videos = await sql`
    SELECT
      v.id, v.title, v.poster_path, v.duration, v.view_count
    FROM videos v
    WHERE v.id != ${videoId}
      AND v.is_published = TRUE
      AND v.category_id = ${video.category_id}
    ORDER BY v.view_count DESC
    LIMIT ${limit}
  `;
  return videos;
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const [stats] = await sql`
    SELECT
      COUNT(*)::INTEGER as total_videos,
      COUNT(*) FILTER (WHERE v.is_published = TRUE)::INTEGER as published_videos,
      COUNT(*) FILTER (WHERE v.status = 'processing')::INTEGER as processing_videos,
      (SELECT COUNT(*) FROM users WHERE is_active = TRUE)::INTEGER as total_users,
      (SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '7 days')::INTEGER as active_users,
      COALESCE(SUM(v.view_count), 0)::BIGINT as total_views,
      (SELECT COUNT(*) FROM categories WHERE is_active = TRUE)::INTEGER as categories_count
    FROM videos v
  `;
  return stats as DashboardStats | null;
}

export async function getVideosByCategory(categorySlug: string, limit: number = 50) {
  const videos = await sql`
    SELECT
      v.id, v.title, v.poster_path, v.duration, v.view_count, v.created_at
    FROM videos v
    JOIN categories c ON c.id = v.category_id
    WHERE c.slug = ${categorySlug}
      AND v.is_published = TRUE
    ORDER BY v.created_at DESC
    LIMIT ${limit}
  `;
  return videos;
}

export async function registerVideoView(videoId: string): Promise<void> {
  await sql`UPDATE videos SET view_count = view_count + 1 WHERE id = ${videoId}`;
}

export async function getUserActivity(userId: string, limit: number = 50) {
  const logs = await sql`
    SELECT
      a.id, a.table_name, a.action, a.record_id, a.old_data, a.new_data, a.created_at
    FROM audit_log a
    WHERE a.user_id = ${userId}
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `;
  return logs;
}

export async function getAuditLog(params: {
  tableName?: string;
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const { tableName, action, userId, startDate, endDate, limit = 100 } = params;

  let query = sql`SELECT * FROM audit_log WHERE TRUE`;

  if (tableName) query = sql`${query} AND table_name = ${tableName}`;
  if (action) query = sql`${query} AND action = ${action}`;
  if (userId) query = sql`${query} AND user_id = ${userId}`;
  if (startDate) query = sql`${query} AND created_at >= ${startDate}`;
  if (endDate) query = sql`${query} AND created_at <= ${endDate}`;

  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;

  return query;
}

export async function checkUserPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const [result] = await sql`
    SELECT fn_check_user_permission(${userId}, ${resource}, ${action}) as has_permission
  `;
  return result?.has_permission ?? false;
}

export async function recordLoginAttempt(
  email: string | null,
  ipAddress: string,
  success: boolean,
  failureReason?: string
): Promise<void> {
  await sql`
    INSERT INTO login_attempts (email, ip_address, success, failure_reason)
    VALUES (${email}, ${ipAddress}::INET, ${success}, ${failureReason})
  `;
}

export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const [result] = await sql`SELECT fn_cleanup_old_audit_logs(${daysToKeep}) as deleted_count`;
  return result?.deleted_count ?? 0;
}
