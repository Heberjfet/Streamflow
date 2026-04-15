#!/bin/bash
# =============================================
# StreamFlow - Script de Restore de Base de Datos
# Versión: 1.0.0
# Descripción: Restaura la base de datos PostgreSQL desde un backup
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

echo "============================================="
echo "StreamFlow - Restore de Base de Datos"
echo "============================================="
echo "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "Base de datos: ${POSTGRES_DB}"
echo "Fecha: $(date)"
echo "============================================="

# Configurar conexión PostgreSQL
export PGPASSWORD="${POSTGRES_PASSWORD}"

# Verificar conexión
if ! pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}"; then
    echo "ERROR: No se puede conectar a PostgreSQL"
    exit 1
fi

# Si no se especifica backup, mostrar lista de disponibles
if [ -z "$1" ]; then
    echo ""
    echo "Backups disponibles:"
    ls -lh "${BACKUP_DIR}"/streamflow_backup_*.sql.gz 2>/dev/null || echo "No hay backups disponibles"
    echo ""
    echo "Uso: $0 <nombre_del_backup>"
    echo "Ejemplo: $0 streamflow_backup_20240115_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Verificar que el backup existe
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "ERROR: El archivo de backup no existe: ${BACKUP_DIR}/${BACKUP_FILE}"
    exit 1
fi

# Confirmar antes de restaurar
echo ""
echo "ADVERTENCIA: Esta acción eliminará todos los datos actuales"
echo "y los reemplazará con el backup seleccionado."
echo ""
read -p "¿Está seguro de continuar? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Operación cancelada por el usuario"
    exit 0
fi

echo ""
echo "Iniciando restore..."

# Detener conexiones activas a la base de datos
echo "Terminando conexiones activas..."
psql -h "${POSTGRES_HOST}" \
     -p "${POSTGRES_PORT}" \
     -U "${POSTGRES_USER}" \
     -d postgres \
     -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
     2>/dev/null || true

# Eliminar base de datos existente
echo "Eliminando base de datos existente..."
psql -h "${POSTGRES_HOST}" \
     -p "${POSTGRES_PORT}" \
     -U "${POSTGRES_USER}" \
     -d postgres \
     -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

# Crear nueva base de datos
echo "Creando nueva base de datos..."
psql -h "${POSTGRES_HOST}" \
     -p "${POSTGRES_PORT}" \
     -U "${POSTGRES_USER}" \
     -d postgres \
     -c "CREATE DATABASE ${POSTGRES_DB};"

# Restaurar desde backup
echo "Restaurando datos..."
gunzip -c "${BACKUP_DIR}/${BACKUP_FILE}" | \
    pg_restore -h "${POSTGRES_HOST}" \
               -p "${POSTGRES_PORT}" \
               -U "${POSTGRES_USER}" \
               -d "${POSTGRES_DB}" \
               --clean \
               --if-exists \
               --verbose

echo ""
echo "============================================="
echo "Restore completado exitosamente!"
echo "============================================="
echo "Base de datos restaurada: ${POSTGRES_DB}"
echo "Backup utilizado: ${BACKUP_FILE}"
echo "============================================="

exit 0
