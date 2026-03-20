import { z } from "zod";

// ==================== SECURITY FLAGS ====================
export const SECURITY_FLAGS = {
  // Auth flags
  AUTH_RATE_LIMIT: "AUTH_RATE_LIMIT",
  AUTH_ACCOUNT_LOCKOUT: "AUTH_ACCOUNT_LOCKOUT",
  AUTH_2FA: "AUTH_2FA",
  AUTH_OAUTH_GOOGLE: "AUTH_OAUTH_GOOGLE",
  AUTH_CAPTCHA: "AUTH_CAPTCHA",

  // Protection flags
  PROTECTION_CSRF: "PROTECTION_CSRF",
  PROTECTION_XSS: "PROTECTION_XSS",
  PROTECTION_SQLI: "PROTECTION_SQLI",
  PROTECTION_IDOR: "PROTECTION_IDOR",

  // Incident flags
  INCIDENTS_LOGGING: "INCIDENTS_LOGGING",
  INCIDENTS_AUTO_DETECT: "INCIDENTS_AUTO_DETECT",
  INCIDENTS_ALERTS: "INCIDENTS_ALERTS",

  // Audit flags
  AUDIT_LOG_CHANGES: "AUDIT_LOG_CHANGES",
  AUDIT_FULL: "AUDIT_FULL",
} as const;

export type SecurityFlag = (typeof SECURITY_FLAGS)[keyof typeof SECURITY_FLAGS];

export const FLAG_DESCRIPTIONS: Record<SecurityFlag, string> = {
  AUTH_RATE_LIMIT: "Limita requests por IP (100/min)",
  AUTH_ACCOUNT_LOCKOUT: "Bloquea cuenta tras 5 intentos fallidos",
  AUTH_2FA: "Autenticación de dos factores con TOTP",
  AUTH_OAUTH_GOOGLE: "Login con Google OAuth 2.0",
  AUTH_CAPTCHA: "reCAPTCHA v3 invisible",
  PROTECTION_CSRF: "Tokens CSRF en formularios",
  PROTECTION_XSS: "Sanitización de inputs contra XSS",
  PROTECTION_SQLI: "Protección contra inyección SQL",
  PROTECTION_IDOR: "Verificación de ownership de recursos",
  INCIDENTS_LOGGING: "Registro de eventos de seguridad",
  INCIDENTS_AUTO_DETECT: "Detección automática de incidentes",
  INCIDENTS_ALERTS: "Alertas por email/webhook",
  AUDIT_LOG_CHANGES: "Bitácora de cambios en registros",
  AUDIT_FULL: "Logging exhaustivo de todas las operaciones",
};

// ==================== FLAG STORAGE (in-memory, replace with Redis/DB) ====================
const flagsState: Record<string, boolean> = {
  AUTH_RATE_LIMIT: true,
  AUTH_ACCOUNT_LOCKOUT: true,
  AUTH_2FA: false,
  AUTH_OAUTH_GOOGLE: false,
  AUTH_CAPTCHA: false,
  PROTECTION_CSRF: true,
  PROTECTION_XSS: true,
  PROTECTION_SQLI: true,
  PROTECTION_IDOR: true,
  INCIDENTS_LOGGING: true,
  INCIDENTS_AUTO_DETECT: true,
  INCIDENTS_ALERTS: false,
  AUDIT_LOG_CHANGES: true,
  AUDIT_FULL: false,
};

export async function getSecurityFlags(): Promise<Record<string, boolean>> {
  return { ...flagsState };
}

export async function getFlag(flagName: string): Promise<boolean> {
  return flagsState[flagName] ?? false;
}

export async function setFlag(
  flagName: string,
  value: boolean
): Promise<boolean> {
  if (!(flagName in flagsState)) {
    throw new Error(`Unknown flag: ${flagName}`);
  }
  flagsState[flagName] = value;
  return true;
}

// ==================== ZOD SCHEMAS ====================
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  username: z.string().min(3).max(50),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const CreateVideoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const UpdateVideoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export const UpdateIncidentSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  notes: z.string().optional(),
});

export const UpdateFlagSchema = z.object({
  is_enabled: z.boolean(),
});

// ==================== TYPES ====================
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;
export type UpdateVideoInput = z.infer<typeof UpdateVideoSchema>;
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;
export type UpdateFlagInput = z.infer<typeof UpdateFlagSchema>;

export interface User {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  is_2fa_enabled: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  original_url: string | null;
  hls_path: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  resolution: string | null;
  status: "uploading" | "processing" | "ready" | "failed";
  view_count: number;
  created_at: Date;
}

export interface Incident {
  id: string;
  user_id: string | null;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  resolved_at: Date | null;
  resolved_by: string | null;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}

// ==================== INCIDENT TYPES ====================
export const INCIDENT_TYPES = {
  LOGIN_FAILED: "login_failed",
  LOGIN_SUCCESS: "login_success",
  XSS_ATTEMPT: "xss_attempt",
  SQLI_ATTEMPT: "sqli_attempt",
  IDOR_ATTEMPT: "idor_attempt",
  UNAUTHORIZED_ACCESS: "unauthorized_access",
  ACCOUNT_LOCKED: "account_locked",
  PASSWORD_CHANGED: "password_changed",
  2FA_ENABLED: "2fa_enabled",
  2FA_DISABLED: "2fa_disabled",
  VIDEO_DELETED: "video_deleted",
  VIDEO_UPDATED: "video_updated",
} as const;

export type IncidentType = (typeof INCIDENT_TYPES)[keyof typeof INCIDENT_TYPES];
