#!/bin/bash

# ============================================================================
# StreamFlow - Script de Restauración de Base de Datos
# Archivo: restore_database.sh
# Descripción: Restaura la base de datos desde un archivo de backup
# ============================================================================

# Configuración
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="postgres"
DB_USER="streamflow_admin_user"

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
    echo " StreamFlow - Restauración de Base de Datos"
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

print_warning() {
    echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

# ============================================================================
# VALIDACIONES
# ============================================================================

# Verificar que se proporcionó un archivo de backup
if [ -z "$1" ]; then
    print_error "Debes proporcionar la ruta al archivo de backup"
    echo "Uso: $0 <archivo_backup>"
    echo "Ejemplo: $0 ./backups/streamflow_backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "El archivo de backup no existe: $BACKUP_FILE"
    exit 1
fi

# Verificar que psql está instalado
if ! command -v psql &> /dev/null; then
    print_error "psql no está instalado. Instala PostgreSQL client tools."
    exit 1
fi

# ============================================================================
# CONFIRMACIÓN
# ============================================================================

print_header

print_warning "¡ADVERTENCIA! Esta operación:"
echo "  - Eliminará TODOS los datos actuales de la base de datos"
echo "  - Restaurará los datos desde: $BACKUP_FILE"
echo "  - Esta acción NO se puede deshacer"
echo ""

read -p "¿Estás seguro de que deseas continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_info "Restauración cancelada por el usuario"
    exit 0
fi

# ============================================================================
# PROCESO DE RESTAURACIÓN
# ============================================================================

print_info "Iniciando restauración de la base de datos..."
print_info "Archivo de backup: $BACKUP_FILE"
print_info "Fecha: $(date)"

# Exportar password
export PGPASSWORD="${POSTGRES_PASSWORD:-change_this_admin_password}"

# Descomprimir si es necesario
TEMP_SQL_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    print_info "Descomprimiendo archivo..."
    TEMP_SQL_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_SQL_FILE"
    
    if [ $? -ne 0 ]; then
        print_error "Error al descomprimir el archivo"
        exit 1
    fi
    
    SQL_FILE="$TEMP_SQL_FILE"
else
    SQL_FILE="$BACKUP_FILE"
fi

# Restaurar la base de datos
print_info "Restaurando base de datos..."

psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --file="$SQL_FILE" \
    --quiet \
    2>&1 | grep -v "NOTICE"

# Verificar resultado
if [ $? -eq 0 ]; then
    print_success "Restauración completada exitosamente"
else
    print_error "Error durante la restauración"
    
    # Limpiar archivo temporal si existe
    if [ -n "$TEMP_SQL_FILE" ] && [ -f "$TEMP_SQL_FILE" ]; then
        rm "$TEMP_SQL_FILE"
    fi
    
    exit 1
fi

# Limpiar archivo temporal si existe
if [ -n "$TEMP_SQL_FILE" ] && [ -f "$TEMP_SQL_FILE" ]; then
    rm "$TEMP_SQL_FILE"
    print_info "Archivo temporal eliminado"
fi

# ============================================================================
# VERIFICACIÓN POST-RESTAURACIÓN
# ============================================================================

print_info "Verificando integridad de la restauración..."

# Contar registros en tablas principales
USERS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null)
VIDEOS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM videos;" 2>/dev/null)
CATEGORIES_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null)

echo ""
print_success "Estadísticas de la base de datos restaurada:"
echo "  - Usuarios: $USERS_COUNT"
echo "  - Videos: $VIDEOS_COUNT"
echo "  - Categorías: $CATEGORIES_COUNT"

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo ""
echo -e "${GREEN}"
echo "============================================================================"
echo " Restauración Completada Exitosamente"
echo "============================================================================"
echo -e "${NC}"
echo "Base de datos restaurada desde: $BACKUP_FILE"
echo "Fecha de restauración: $(date)"
echo ""
echo "IMPORTANTE:"
echo "  - Verifica que la aplicación funcione correctamente"
echo "  - Revisa los logs de errores si hay problemas"
echo "  - Considera crear un nuevo backup después de verificar"
echo ""

# Limpiar variable de password
unset PGPASSWORD
