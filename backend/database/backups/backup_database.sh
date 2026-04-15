#!/bin/bash
# =============================================
# StreamFlow - Script de Backup de Base de Datos
# Versión: 1.0.0
# Descripción: Realiza backup de la base de datos PostgreSQL
# =============================================

set -e

# Variables de entorno (valores por defecto para Docker)
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-streamflow}"
POSTGRES_USER="${POSTGRES_USER:-streamflow}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-streamflow}"

# Directorio de backups
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="streamflow_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"

echo "============================================="
echo "StreamFlow - Backup de Base de Datos"
echo "============================================="
echo "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "Base de datos: ${POSTGRES_DB}"
echo "Fecha: $(date)"
echo "============================================="

# Crear directorio de backups si no existe
mkdir -p "${BACKUP_DIR}"

# Configurar conexión PostgreSQL
export PGPASSWORD="${POSTGRES_PASSWORD}"

# Verificar conexión
if ! pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}"; then
    echo "ERROR: No se puede conectar a PostgreSQL"
    exit 1
fi

# Realizar backup
echo "Iniciando backup..."
pg_dump -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --format=custom \
        --compress=9 \
        --verbose \
        -f "${BACKUP_PATH%.gz}"

# Comprimir el backup
gzip "${BACKUP_PATH%.gz}"

# Obtener tamaño del backup
BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)

echo "============================================="
echo "Backup completado exitosamente!"
echo "============================================="
echo "Archivo: ${BACKUP_PATH}"
echo "Tamaño: ${BACKUP_SIZE}"
echo "============================================="

# Limpiar backups antiguos (mantener últimos 7)
echo "Limpiando backups antiguos..."
ls -t "${BACKUP_DIR}"/streamflow_backup_*.sql.gz | tail -n +8 | xargs -r rm -f

echo "Backups antiguos limpiados (se mantienen los últimos 7)"

# Mostrar lista de backups actuales
echo ""
echo "Backups actuales:"
ls -lh "${BACKUP_DIR}"/streamflow_backup_*.sql.gz 2>/dev/null || echo "No hay backups disponibles"

exit 0
