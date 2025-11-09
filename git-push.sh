#!/bin/bash

echo "======================================="
echo "GIT COMMIT & PUSH - VIASUC"
echo "======================================="

cd /root/proyectos/IngenieriaSoftware/Empresas

# Verificar en qué rama estamos
BRANCH=$(git branch --show-current)
echo "Rama actual: $BRANCH"

# Configurar upstream si no está configurado
echo ""
echo "[1/6] Configurando upstream..."
git branch --set-upstream-to=origin/$BRANCH $BRANCH 2>/dev/null || echo "Upstream ya configurado"

# Hacer pull para sincronizar
echo ""
echo "[2/6] Sincronizando con remoto (pull)..."
git pull --no-rebase || echo "No hay cambios remotos o ya está actualizado"

# Ver estado antes de commit
echo ""
echo "[3/6] Estado de archivos antes de commit:"
git status --short

# Verificar si hay cambios para commitear
if [[ -z $(git status --porcelain) ]]; then
    echo ""
    echo "✓ No hay cambios para commitear"
    echo "======================================="
    exit 0
fi

# Pedir mensaje de commit
echo ""
echo "[4/6] Ingrese el mensaje de commit:"
read -r COMMIT_MSG

if [[ -z "$COMMIT_MSG" ]]; then
    echo "✗ Error: El mensaje de commit no puede estar vacío"
    exit 1
fi

# Hacer commit
echo ""
echo "[5/6] Haciendo commit..."
git add .
git commit -m "$COMMIT_MSG"

# Push
echo ""
echo "[6/6] Subiendo cambios (push)..."
git push origin $BRANCH

echo ""
echo "======================================="
echo "PUSH COMPLETADO EXITOSAMENTE"
echo "======================================="
echo "Rama: $BRANCH"
echo "Remoto: origin/$BRANCH"
