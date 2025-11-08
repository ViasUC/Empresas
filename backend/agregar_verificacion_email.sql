-- Script para agregar columnas de verificación de email a tabla usuarios

-- Agregar columnas si no existen
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS token_verificacion_expira TIMESTAMP;

-- Crear índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion 
ON usuarios(token_verificacion) 
WHERE token_verificacion IS NOT NULL;

-- Actualizar usuarios existentes para que tengan email verificado
-- (usuarios creados antes de implementar esta funcionalidad)
UPDATE usuarios 
SET email_verificado = TRUE 
WHERE email_verificado IS NULL OR token_verificacion IS NULL;

-- Verificar cambios
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
AND column_name IN ('email_verificado', 'token_verificacion', 'token_verificacion_expira');

-- Mostrar resumen
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN email_verificado = TRUE THEN 1 END) as verificados,
  COUNT(CASE WHEN email_verificado = FALSE THEN 1 END) as sin_verificar
FROM usuarios;
