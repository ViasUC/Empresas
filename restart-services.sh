#!/bin/bash

echo "========================================="
echo "REINICIANDO SERVICIOS VIASUC"
echo "========================================="

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detener backend (Node.js)
echo -e "${YELLOW}[1/4] Deteniendo backend...${NC}"
pkill -f "node server.js"
pkill -f "start-server.sh"
sleep 2
echo -e "${GREEN}Backend detenido${NC}"

# Detener frontend (Angular)
echo -e "${YELLOW}[2/4] Deteniendo frontend...${NC}"
pkill -f "ng serve"
pkill -f "npx ng serve"
sleep 2
echo -e "${GREEN}Frontend detenido${NC}"

# Iniciar backend
echo -e "${YELLOW}[3/4] Iniciando backend...${NC}"
cd /root/proyectos/IngenieriaSoftware/Empresas/backend
bash start-server.sh &
sleep 3
echo -e "${GREEN}Backend iniciado en http://localhost:4000/graphql${NC}"

# Iniciar frontend
echo -e "${YELLOW}[4/4] Iniciando frontend...${NC}"
cd /root/proyectos/IngenieriaSoftware/Empresas/viasuc-empresas
npx ng serve &
sleep 5
echo -e "${GREEN}Frontend iniciado en http://localhost:4200/${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}SERVICIOS REINICIADOS EXITOSAMENTE${NC}"
echo "========================================="
echo "Backend:  http://localhost:4000/graphql"
echo "Frontend: http://localhost:4200/"
echo ""
echo "Logs disponibles en los terminales respectivos"
echo "Para detener: pkill -f 'node server.js' && pkill -f 'ng serve'"
