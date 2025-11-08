#!/bin/bash

# Script para detectar emojis en el proyecto VIASUC
# Uso: ./check-no-emojis.sh

echo "==================================="
echo "Validador de Emojis - Proyecto VIASUC"
echo "==================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de emojis encontrados
EMOJI_COUNT=0

echo "Buscando emojis en archivos del proyecto..."
echo ""

# Buscar emojis en archivos TypeScript, JavaScript, HTML
echo "[1/4] Revisando archivos TypeScript..."
TS_EMOJIS=$(find viasuc-empresas/src backend -type f \( -name "*.ts" -o -name "*.js" \) ! -path "*/node_modules/*" -exec grep -l -P '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' {} \; 2>/dev/null)

if [ -n "$TS_EMOJIS" ]; then
    echo -e "${RED}[ERROR] Emojis encontrados en archivos TypeScript/JavaScript:${NC}"
    echo "$TS_EMOJIS"
    EMOJI_COUNT=$((EMOJI_COUNT + $(echo "$TS_EMOJIS" | wc -l)))
else
    echo -e "${GREEN}[OK] Sin emojis en archivos TypeScript/JavaScript${NC}"
fi
echo ""

# Buscar emojis en archivos HTML
echo "[2/4] Revisando archivos HTML..."
HTML_EMOJIS=$(find viasuc-empresas/src -type f -name "*.html" -exec grep -l -P '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' {} \; 2>/dev/null)

if [ -n "$HTML_EMOJIS" ]; then
    echo -e "${RED}[ERROR] Emojis encontrados en archivos HTML:${NC}"
    echo "$HTML_EMOJIS"
    EMOJI_COUNT=$((EMOJI_COUNT + $(echo "$HTML_EMOJIS" | wc -l)))
else
    echo -e "${GREEN}[OK] Sin emojis en archivos HTML${NC}"
fi
echo ""

# Buscar emojis en archivos SCSS/CSS
echo "[3/4] Revisando archivos SCSS/CSS..."
CSS_EMOJIS=$(find viasuc-empresas/src -type f \( -name "*.scss" -o -name "*.css" \) -exec grep -l -P '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' {} \; 2>/dev/null)

if [ -n "$CSS_EMOJIS" ]; then
    echo -e "${RED}[ERROR] Emojis encontrados en archivos SCSS/CSS:${NC}"
    echo "$CSS_EMOJIS"
    EMOJI_COUNT=$((EMOJI_COUNT + $(echo "$CSS_EMOJIS" | wc -l)))
else
    echo -e "${GREEN}[OK] Sin emojis en archivos SCSS/CSS${NC}"
fi
echo ""

# Buscar emojis en archivos de configuración
echo "[4/4] Revisando archivos de configuracion..."
CONFIG_EMOJIS=$(find . -maxdepth 3 -type f \( -name "*.json" -o -name "*.md" \) ! -path "./node_modules/*" ! -path "./DiagramaViasUc/*" -exec grep -l -P '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' {} \; 2>/dev/null)

if [ -n "$CONFIG_EMOJIS" ]; then
    echo -e "${YELLOW}[WARNING] Emojis encontrados en archivos de configuracion/documentacion:${NC}"
    echo "$CONFIG_EMOJIS"
else
    echo -e "${GREEN}[OK] Sin emojis en archivos de configuracion${NC}"
fi
echo ""

# Resultado final
echo "==================================="
if [ $EMOJI_COUNT -gt 0 ]; then
    echo -e "${RED}[FALLO] Se encontraron $EMOJI_COUNT archivos con emojis${NC}"
    echo -e "${RED}Por favor, eliminar todos los emojis antes de hacer commit${NC}"
    exit 1
else
    echo -e "${GREEN}[EXITO] No se encontraron emojis en el codigo${NC}"
    echo -e "${GREEN}El proyecto cumple con la regla NO_EMOJIS${NC}"
    exit 0
fi
