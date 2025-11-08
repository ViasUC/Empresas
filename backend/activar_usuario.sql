-- Script para activar manualmente usuarios (solo para testing)

-- Ver usuarios sin verificar
SELECT id_usuario, email, nombre, apellido, email_verificado, fecha_creacion
FROM usuarios 
WHERE email_verificado = FALSE
ORDER BY id_usuario DESC;

-- ACTIVAR el último usuario creado (Alfredo Acosta)
-- Cambia el email si es diferente
UPDATE usuarios 
SET email_verificado = TRUE,
    token_verificacion = NULL,
    token_verificacion_expira = NULL
WHERE email = 'alfre_costas@hotmail.com';

-- O activar TODOS los usuarios (útil para testing)
-- UPDATE usuarios SET email_verificado = TRUE;

-- Verificar cambios
SELECT id_usuario, email, nombre, email_verificado
FROM usuarios 
WHERE email = 'alfre_costas@hotmail.com';
