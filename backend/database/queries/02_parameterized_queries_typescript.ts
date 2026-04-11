/**
 * ============================================================================
 * StreamFlow - Ejemplos de Consultas Parametrizadas en TypeScript/Deno
 * Archivo: 02_parameterized_queries_typescript.ts
 * Descripción: Ejemplos de consultas seguras usando el driver postgres
 * ============================================================================
 */

import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

/**
 * IMPORTANTE: Las consultas parametrizadas previenen inyección SQL
 * NUNCA concatenar strings directamente en las queries
 */

// ============================================================================
// CONFIGURACIÓN DE CONEXIÓN
// ============================================================================

const client = new Client({
  user: "streamflow_app_user",
  database: "postgres",
  hostname: "localhost",
  port: 5433,
  password: "change_this_password_in_production",
});

await client.connect();

// ============================================================================
// EJEMPLO 1: Buscar usuario por email (SEGURO)
// ==============================================================================

async function getUserByEmail(email: string) {
  const result = await client.queryObject({
    text: `
      SELECT id, email, name, role, is_active, created_at
      FROM users
      WHERE email = $1
      AND is_active = TRUE
    `,
    args: [email],
  });

  return result.rows[0];
}

// Uso:
// const user = await getUserByEmail('admin@streamflow.local');
// console.log(user);

// ============================================================================
// EJEMPLO 2: Buscar usuarios por rol (SEGURO)
// ==============================================================================

async function getUsersByRole(role: string) {
  const result = await client.queryObject({
    text: `
      SELECT id, email, name, role, created_at, last_login
      FROM users
      WHERE role = $1
      AND is_active = TRUE
      ORDER BY created_at DESC
    `,
    args: [role],
  });

  return result.rows;
}

// Uso:
// const admins = await getUsersByRole('admin');
// console.log(admins);

// ============================================================================
// EJEMPLO 3: Crear nuevo usuario (SEGURO)
// ==============================================================================

interface CreateUserParams {
  googleId: string;
  email: string;
  name: string;
  role: "viewer" | "editor" | "admin" | "superadmin";
  avatarUrl?: string;
}

async function createUser(params: CreateUserParams) {
  const result = await client.queryObject({
    text: `
      INSERT INTO users (google_id, email, name, role, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role, created_at
    `,
    args: [
      params.googleId,
      params.email,
      params.name,
      params.role,
      params.avatarUrl || null,
    ],
  });

  return result.rows[0];
}

// Uso:
// const newUser = await createUser({
//   googleId: 'google_123456',
//   email: 'nuevo@ejemplo.com',
//   name: 'Usuario Nuevo',
//   role: 'viewer',
//   avatarUrl: 'https://avatar.com/image.jpg'
// });

// ============================================================================
// EJEMPLO 4: Actualizar usuario (SEGURO)
// ==============================================================================

interface UpdateUserParams {
  userId: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
}

async function updateUser(params: UpdateUserParams) {
  // Construir query dinámicamente solo con campos proporcionados
  const updates: string[] = [];
  const args: any[] = [];
  let paramIndex = 1;

  if (params.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    args.push(params.name);
  }

  if (params.role !== undefined) {
    updates.push(`role = $${paramIndex++}`);
    args.push(params.role);
  }

  if (params.avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    args.push(params.avatarUrl);
  }

  if (updates.length === 0) {
    throw new Error("No hay campos para actualizar");
  }

  // Agregar user_id como último parámetro
  args.push(params.userId);

  const result = await client.queryObject({
    text: `
      UPDATE users
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, email, name, role, updated_at
    `,
    args: args,
  });

  return result.rows[0];
}

// Uso:
// const updated = await updateUser({
//   userId: 'uuid-del-usuario',
//   name: 'Nuevo Nombre',
//   role: 'admin'
// });

// ============================================================================
// EJEMPLO 5: Buscar videos por categoría con paginación (SEGURO)
// ==============================================================================

interface GetVideosByCategoryParams {
  categoryId: string;
  limit?: number;
  offset?: number;
}

async function getVideosByCategory(params: GetVideosByCategoryParams) {
  const limit = params.limit || 10;
  const offset = params.offset || 0;

  const result = await client.queryObject({
    text: `
      SELECT 
        v.id, v.title, v.description, v.duration, v.poster_path,
        c.name as category_name, c.slug as category_slug
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      WHERE v.category_id = $1
      AND v.is_published = TRUE
      ORDER BY v.created_at DESC
      LIMIT $2 OFFSET $3
    `,
    args: [params.categoryId, limit, offset],
  });

  return result.rows;
}

// Uso:
// const videos = await getVideosByCategory({
//   categoryId: 'uuid-categoria',
//   limit: 20,
//   offset: 0
// });

// ============================================================================
// EJEMPLO 6: Búsqueda de videos por título (SEGURO)
// ==============================================================================

async function searchVideosByTitle(searchTerm: string, limit = 20) {
  const result = await client.queryObject({
    text: `
      SELECT id, title, description, poster_path, duration, is_published
      FROM videos
      WHERE title ILIKE $1
      AND is_published = TRUE
      ORDER BY created_at DESC
      LIMIT $2
    `,
    args: [`%${searchTerm}%`, limit],
  });

  return result.rows;
}

// Uso:
// const results = await searchVideosByTitle('Algorithm');

// ============================================================================
// EJEMPLO 7: Obtener detalles completos de un video (SEGURO)
// ==============================================================================

async function getVideoDetails(videoId: string) {
  const result = await client.queryObject({
    text: `
      SELECT 
        v.id, v.title, v.description, v.hls_path, v.poster_path,
        v.duration, v.file_size, v.is_processed, v.is_published,
        v.created_at, v.updated_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      LEFT JOIN users u ON v.uploaded_by = u.id
      WHERE v.id = $1
    `,
    args: [videoId],
  });

  return result.rows[0];
}

// Uso:
// const video = await getVideoDetails('uuid-del-video');

// ============================================================================
// EJEMPLO 8: Insertar video con transacción (SEGURO)
// ==============================================================================

interface CreateVideoParams {
  title: string;
  description: string;
  categoryId: string;
  hlsPath: string;
  uploadedBy: string;
}

async function createVideo(params: CreateVideoParams) {
  // Iniciar transacción
  const transaction = client.createTransaction("create_video");

  try {
    await transaction.begin();

    // Establecer contexto de usuario para auditoría
    await transaction.queryObject({
      text: `SET LOCAL app.current_user_id = $1`,
      args: [params.uploadedBy],
    });

    // Insertar video
    const result = await transaction.queryObject({
      text: `
        INSERT INTO videos (
          title, description, category_id, hls_path, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, created_at
      `,
      args: [
        params.title,
        params.description,
        params.categoryId,
        params.hlsPath,
        params.uploadedBy,
      ],
    });

    await transaction.commit();
    return result.rows[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Uso:
// const newVideo = await createVideo({
//   title: 'Nuevo Video',
//   description: 'Descripción del video',
//   categoryId: 'uuid-categoria',
//   hlsPath: 'production-vod/video/master.m3u8',
//   uploadedBy: 'uuid-usuario'
// });

// ============================================================================
// EJEMPLO 9: Búsqueda avanzada con múltiples filtros opcionales (SEGURO)
// ==============================================================================

interface AdvancedSearchParams {
  searchTerm?: string;
  categoryId?: string;
  isPublished?: boolean;
  limit?: number;
  offset?: number;
}

async function advancedVideoSearch(params: AdvancedSearchParams) {
  const conditions: string[] = [];
  const args: any[] = [];
  let paramIndex = 1;

  // Agregar condiciones dinámicamente
  if (params.searchTerm) {
    conditions.push(`v.title ILIKE $${paramIndex++}`);
    args.push(`%${params.searchTerm}%`);
  }

  if (params.categoryId) {
    conditions.push(`v.category_id = $${paramIndex++}`);
    args.push(params.categoryId);
  }

  if (params.isPublished !== undefined) {
    conditions.push(`v.is_published = $${paramIndex++}`);
    args.push(params.isPublished);
  }

  // Construir WHERE clause
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Agregar limit y offset
  const limit = params.limit || 10;
  const offset = params.offset || 0;
  args.push(limit, offset);

  const result = await client.queryObject({
    text: `
      SELECT 
        v.id, v.title, v.description, v.poster_path,
        v.duration, v.created_at,
        c.name as category_name
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      ${whereClause}
      ORDER BY v.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `,
    args: args,
  });

  return result.rows;
}

// Uso:
// const results = await advancedVideoSearch({
//   searchTerm: 'Algorithm',
//   categoryId: 'uuid-categoria',
//   isPublished: true,
//   limit: 20,
//   offset: 0
// });

// ============================================================================
// EJEMPLO 10: Consultar logs de auditoría (SEGURO)
// ==============================================================================

interface GetAuditLogsParams {
  tableName?: string;
  operationType?: "INSERT" | "UPDATE" | "DELETE";
  userId?: string;
  isCritical?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

async function getAuditLogs(params: GetAuditLogsParams) {
  const conditions: string[] = [];
  const args: any[] = [];
  let paramIndex = 1;

  if (params.tableName) {
    conditions.push(`table_name = $${paramIndex++}`);
    args.push(params.tableName);
  }

  if (params.operationType) {
    conditions.push(`operation_type = $${paramIndex++}`);
    args.push(params.operationType);
  }

  if (params.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    args.push(params.userId);
  }

  if (params.isCritical !== undefined) {
    conditions.push(`is_critical = $${paramIndex++}`);
    args.push(params.isCritical);
  }

  if (params.startDate) {
    conditions.push(`operation_timestamp >= $${paramIndex++}`);
    args.push(params.startDate);
  }

  if (params.endDate) {
    conditions.push(`operation_timestamp <= $${paramIndex++}`);
    args.push(params.endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 50;
  args.push(limit);

  const result = await client.queryObject({
    text: `
      SELECT 
        id, operation_type, table_name, record_id,
        user_email, user_role, operation_timestamp,
        is_critical, critical_message
      FROM audit_log
      ${whereClause}
      ORDER BY operation_timestamp DESC
      LIMIT $${paramIndex}
    `,
    args: args,
  });

  return result.rows;
}

// Uso:
// const logs = await getAuditLogs({
//   tableName: 'videos',
//   isCritical: true,
//   limit: 100
// });

// ============================================================================
// EJEMPLO DE CONSULTA INSEGURA (NUNCA HACER ESTO)
// ==============================================================================

// MAL - Vulnerable a SQL Injection
async function INSECURE_getUserByEmail_BAD(email: string) {
  // NUNCA HACER ESTO:
  const result = await client.queryObject(
    `SELECT * FROM users WHERE email = '${email}'`
  );
  // Si email = "' OR '1'='1", retornará todos los usuarios
  return result.rows;
}

// BIEN - Usando parámetros
async function SECURE_getUserByEmail_GOOD(email: string) {
  const result = await client.queryObject({
    text: `SELECT * FROM users WHERE email = $1`,
    args: [email],
  });
  return result.rows;
}

// ============================================================================
// EJEMPLO 11: Helper para establecer contexto de usuario en transacciones
// ============================================================================

interface UserContext {
  userId: string;
  userEmail: string;
  userRole: string;
}

async function setUserContext(client: any, context: UserContext) {
  await client.queryObject({
    text: `
      SELECT 
        set_config('app.current_user_id', $1, true),
        set_config('app.current_user_email', $2, true),
        set_config('app.current_user_role', $3, true)
    `,
    args: [context.userId, context.userEmail, context.userRole],
  });
}

// Uso en transacción:
async function updateVideoWithContext(
  videoId: string,
  title: string,
  userContext: UserContext
) {
  const transaction = client.createTransaction("update_video");

  try {
    await transaction.begin();

    // Establecer contexto para triggers de auditoría
    await setUserContext(transaction, userContext);

    // Actualizar video
    const result = await transaction.queryObject({
      text: `
        UPDATE videos
        SET title = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, updated_at
      `,
      args: [title, videoId],
    });

    await transaction.commit();
    return result.rows[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ============================================================================
// CERRAR CONEXIÓN
// ============================================================================

// await client.end();

/**
 * REGLAS DE SEGURIDAD:
 *
 * 1. SIEMPRE usar parámetros ($1, $2, etc.) para valores dinámicos
 * 2. NUNCA concatenar strings directamente en las queries
 * 3. Validar y sanitizar inputs antes de usarlos
 * 4. Usar transacciones para operaciones que modifican múltiples tablas
 * 5. Establecer contexto de usuario para triggers de auditoría
 * 6. Manejar errores apropiadamente y hacer rollback en transacciones
 * 7. Usar TypeScript para type safety
 * 8. Limitar resultados con LIMIT para prevenir queries costosas
 */

export {
  advancedVideoSearch,
  createUser,
  createVideo,
  getAuditLogs,
  getUserByEmail,
  getUsersByRole,
  getVideoDetails,
  getVideosByCategory,
  searchVideosByTitle,
  setUserContext,
  updateUser,
  updateVideoWithContext,
};
