#!/bin/bash

echo "======================================="
echo "Agregando columnas de verificacion de email"
echo "======================================="

PGPASSWORD='Jeferson123' psql -h 34.95.213.224 -U postgres -d postgres -f agregar_verificacion_email.sql

echo ""
echo "Listo! Columnas agregadas."
