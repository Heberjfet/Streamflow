import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(100),
  role: z.enum(["user", "admin"]),
  is_2fa_enabled: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export const VideoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().nullable(),
  original_url: z.string().nullable(),
  hls_path: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  duration: z.number().nullable(),
  resolution: z.string().nullable(),
  status: z.enum(["uploading", "processing", "ready", "failed"]),
  view_count: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export const IncidentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  type: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  description: z.string(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  resolved_at: z.string().datetime().nullable(),
  resolved_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  action: z.string(),
  entity_type: z.string().nullable(),
  entity_id: z.string().uuid().nullable(),
  old_values: z.record(z.unknown()).nullable(),
  new_values: z.record(z.unknown()).nullable(),
  ip_address: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type Incident = z.infer<typeof IncidentSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
