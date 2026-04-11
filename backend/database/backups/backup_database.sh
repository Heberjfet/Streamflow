#!/bin/bash

# ============================================================================
# StreamFlow - Script de Backup Completo
# Archivo: backup_database.sh
# Descripción: Realiza backup completo de la base de datos PostgreSQL
# ============================================================================

# Configuración
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="postgres"
DB_USER="streamflow_admin_user"

# Directorios
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/streamflow_backup_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_FILE}.gz"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# FUNCIONES
# ============================================================================

print_header() {
    echo -e "${GREEN}"
    echo "============================================================================"
    echo " StreamFlow - Backup de Base de Datos"
    echo "============================================================================"
    echo -e "${NC}"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# VALIDACIONES
# ============================================================================

# Verificar que pg_dump esté instalado
if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump no está instalado. Instala PostgreSQL client tools."
    exit 1
fi

# Crear directorio de backups si no existe
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    print_info "Directorio de backups creado: $BACKUP_DIR"
fi

# ============================================================================
# PROCESO DE BACKUP
# ============================================================================

print_header

print_info "Iniciando backup de la base de datos..."
print_info "Host: $DB_HOST:$DB_PORT"
print_info "Base de datos: $DB_NAME"
print_info "Fecha: $(date)"

# Exportar password (para evitar prompt interactivo)
export PGPASSWORD="${POSTGRES_PASSWORD:-change_this_admin_password}"

# Realizar backup
print_info "Ejecutando pg_dump..."

pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=plain \
    --verbose \
    --file="$BACKUP_FILE" \
    --no-owner \
    --no-acl \
    --create \
    --clean \
    --if-exists \
    2>&1 | grep -v "NOTICE"

# Verificar si el backup fue exitoso
if [ $? -eq 0 ]; then
    print_success "Backup completado exitosamente"
    
    # Obtener tamaño del archivo
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_info "Tamaño del backup: $BACKUP_SIZE"
    
    # Comprimir backup
    print_info "Comprimiendo backup..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
        print_success "Backup comprimido: $BACKUP_COMPRESSED"
        print_info "Tamaño comprimido: $COMPRESSED_SIZE"
    else
        print_error "Error al comprimir el backup"
    fi
else
    print_error "Error al realizar el backup"
    exit 1
fi

# ============================================================================
# LIMPIEZA DE BACKUPS ANTIGUOS (mantener últimos 7 días)
# ============================================================================

print_info "Limpiando backups antiguos (más de 7 días)..."

find "$BACKUP_DIR" -name "streamflow_backup_*.sql.gz" -type f -mtime +7 -delete

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "streamflow_backup_*.sql.gz" -type f | wc -l)
print_success "Backups disponibles: $REMAINING_BACKUPS"

# ============================================================================
# BACKUP DE SOLO DATOS (opcional)
# ============================================================================

DATA_ONLY_FILE="${BACKUP_DIR}/streamflow_data_only_${TIMESTAMP}.sql"

print_info "Creando backup de solo datos..."

pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=plain \
    --data-only \
    --file="$DATA_ONLY_FILE" \
    --no-owner \
    --no-acl \
    2>&1 | grep -v "NOTICE"

if [ $? -eq 0 ]; then
    gzip "$DATA_ONLY_FILE"
    print_success "Backup de solo datos creado: ${DATA_ONLY_FILE}.gz"
fi

# ============================================================================
# BACKUP DE SOLO ESQUEMA (opcional)
# ============================================================================

SCHEMA_ONLY_FILE="${BACKUP_DIR}/streamflow_schema_only_${TIMESTAMP}.sql"

print_info "Creando backup de solo esquema..."

pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=plain \
    --schema-only \
    --file="$SCHEMA_ONLY_FILE" \
    --no-owner \
    --no-acl \
    2>&1 | grep -v "NOTICE"

if [ $? -eq 0 ]; then
    gzip "$SCHEMA_ONLY_FILE"
    print_success "Backup de solo esquema creado: ${SCHEMA_ONLY_FILE}.gz"
fi

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo ""
echo -e "${GREEN}"
echo "============================================================================"
echo " Backup Completado Exitosamente"
echo "============================================================================"
echo -e "${NC}"
echo "Archivos generados:"
echo "  - Backup completo: $BACKUP_COMPRESSED"
echo "  - Backup solo datos: ${DATA_ONLY_FILE}.gz"
echo "  - Backup solo esquema: ${SCHEMA_ONLY_FILE}.gz"
echo ""
echo "Para restaurar el backup, ejecuta:"
echo "  ./restore_database.sh $BACKUP_COMPRESSED"
echo ""

# Limpiar variable de password
unset PGPASSWORD
