-- Script para verificar y agregar columna email_verificado

-- 1. Verificar si la columna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 2. Agregar la columna si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- 3. Agregar columnas de token si no existen
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS token_verificacion_expira TIMESTAMP;

-- 4. Actualizar usuarios existentes para que tengan email verificado
UPDATE usuarios 
SET email_verificado = TRUE 
WHERE email_verificado IS NULL;

-- 5. Crear índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion 
ON usuarios(token_verificacion) 
WHERE token_verificacion IS NOT NULL;

-- 6. Verificar cambios
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
AND column_name IN ('email_verificado', 'token_verificacion', 'token_verificacion_expira');

-- 7. Mostrar un usuario para verificar
SELECT id_usuario, nombre, apellido, email, email_verificado 
FROM usuarios 
LIMIT 3;
