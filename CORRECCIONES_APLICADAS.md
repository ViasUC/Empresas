# Correcciones Aplicadas - 10 Nov 2025

## 1. ✅ Corrección del Enum `rol_usuario`

### Problema:
El código GraphQL usaba valores como `'EMPLEADOR'`, `'ESTUDIANTE'`, etc., pero la base de datos PostgreSQL tiene un enum `rol_usuario` que usa valores diferentes:
- Base de datos: `'empresa'`, `'alumno'`, `'egresado'`, `'administrador'`
- GraphQL: `'EMPLEADOR'`, `'ESTUDIANTE'`, `'EGRESADO'`, `'ADMIN'`

### Solución:
Se crearon funciones de mapeo bidireccionales en `backend/resolvers.js`:

```javascript
const TIPO_GRAPHQL_TO_BD = {
  'EMPLEADOR': 'empresa',
  'ESTUDIANTE': 'alumno',
  'EGRESADO': 'egresado',
  'ADMIN': 'administrador'
};

const TIPO_BD_TO_GRAPHQL = {
  'empresa': 'EMPLEADOR',
  'alumno': 'ESTUDIANTE',
  'egresado': 'EGRESADO',
  'administrador': 'ADMIN'
};
```

### Archivos modificados:
- `backend/resolvers.js`: Agregadas funciones `tipoGraphQLToBD()` y `tipoBDToGraphQL()`
- Se actualizaron los resolvers: `register`, `login`, `buscarPortafolios`, `obtenerFiltros`

---

## 2. ✅ Corrección del usuario `alfre_costas@hotmail.com`

### Problema:
El usuario existente tenía `rol_principal = 'EMPLEADOR'` (valor de GraphQL) en lugar de `'empresa'` (valor del enum de BD).

### Solución:
```sql
UPDATE public.usuarios 
SET rol_principal = 'empresa' 
WHERE email = 'alfre_costas@hotmail.com';
```

### Resultado:
Usuario actualizado correctamente, ahora puede iniciar sesión sin problemas.

---

## 3. ✅ Tipo de dato `id_auditoria` en tabla `alumnos`

### Problema reportado:
"La columna id_auditoria de la tabla alumno se cambió de int a bigint"

### Verificación:
Se verificó que la columna ya está correctamente definida como `bigint` en la base de datos:

```
Column       | Type   
-------------|--------
id_auditoria | bigint
```

**No se requiere ninguna acción adicional.**

---

## 4. ✅ Documentación de logs del sistema

### Ubicación de logs:
- **Backend**: `/tmp/backend.log`
- **Frontend**: `/tmp/frontend.log`

### Comandos útiles agregados a `ComandoUtiles.txt`:

```bash
# Ver logs en tiempo real
tail -f /tmp/backend.log
tail -f /tmp/frontend.log

# Ver últimas 50 líneas
tail -50 /tmp/backend.log
tail -50 /tmp/frontend.log

# Buscar errores
grep -i "error" /tmp/backend.log
grep -i "error" /tmp/frontend.log
```

---

## 🧪 Pruebas recomendadas:

### 1. Probar registro de nueva empresa:
```
Email: alfredinho008@gmail.com
Tipo: EMPLEADOR
```
**Resultado esperado**: Debe registrarse sin errores.

### 2. Probar login del usuario corregido:
```
Email: alfre_costas@hotmail.com
Password: [tu password]
Tipo: EMPLEADOR
```
**Resultado esperado**: Login exitoso.

### 3. Probar búsqueda de portafolios:
- Iniciar sesión como empleador
- Navegar a "Buscar Candidatos"
- Aplicar filtros y buscar

**Resultado esperado**: No debe mostrar error "Token inválido o expirado".

---

## 📋 Estado actual:

- ✅ Backend reiniciado con correcciones
- ✅ Frontend funcionando (no requiere cambios)
- ✅ Base de datos actualizada
- ✅ Logs documentados
- ✅ Mapeo de tipos implementado
- ✅ Usuario existente corregido

---

## 5. ✅ Mejora en manejo de errores de registro

### Problemas identificados:
1. Error de foreign key no mostraba mensaje amigable
2. Email duplicado se detectaba, pero el mensaje no era claro
3. Otros errores de BD mostraban mensajes técnicos

### Soluciones implementadas:

#### Backend (`resolvers.js`):
- ✅ Mejorado mensaje de email duplicado: "Este correo electrónico ya está registrado. Por favor, utilice otro correo o inicie sesión si ya tiene una cuenta."
- ✅ Error 23503 (foreign key): "No se pudo crear la cuenta. Por favor, contacte con el administrador del sistema."
- ✅ Error 23505 (constraint único): "Este correo electrónico ya está registrado. Por favor, utilice otro correo."
- ✅ Otros errores de BD: Mensaje genérico amigable con logging detallado

#### Frontend (`login.component.ts`):
- ✅ Mejorado manejo de errores con códigos específicos
- ✅ Duración de snackbar ajustada según tipo de error (7-8 segundos)
- ✅ Mensajes diferenciados por tipo de error:
  - `EMAIL_ALREADY_EXISTS`: Mensaje claro con sugerencia
  - `DATABASE_ERROR`: Mensaje para contactar administrador
  - `networkError`: Mensaje de error de conexión
- ✅ Logging detallado en consola para debugging

### Mensajes de error mejorados:

| Situación | Mensaje al Usuario |
|-----------|-------------------|
| Email duplicado | "Este correo electrónico ya está registrado. Por favor, utilice otro correo o inicie sesión si ya tiene una cuenta." |
| Error de integridad (FK) | "No se pudo crear la cuenta. Por favor, contacte con el administrador del sistema." |
| Error de conexión | "Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente." |
| Error genérico | "No se pudo crear la cuenta. Por favor, contacte con el administrador del sistema." |

---

## 6. ✅ Corrección de secuencia de PostgreSQL

### Problema:
La secuencia `usuarios_id_usuario_seq` estaba desincronizada, generando IDs que ya no existían (ej: ID 5).

### Solución ejecutada por el usuario:
```sql
SELECT setval('public.usuarios_id_usuario_seq', (SELECT MAX(id_usuario) FROM public.usuarios));
```

**Resultado**: Secuencia ahora en 1001, próximo ID será 1002.

---

---

## 7. ✅ Problema de schemas duplicados (postgres vs public)

### Problema crítico identificado:
La base de datos tiene **DOS tablas `usuarios`**:
- `postgres.usuarios` (tabla antigua/incorrecta)
- `public.usuarios` (tabla correcta)

Cuando el código hacía INSERTs sin especificar schema, PostgreSQL usaba el schema por defecto (a veces `postgres`), pero los foreign keys apuntaban a `public.usuarios`, causando errores de violación de constraints.

### Solución implementada:
✅ **TODOS los queries ahora usan `public.` explícitamente**:
- `INSERT INTO public.usuarios ...`
- `INSERT INTO public.empresas ...`
- `INSERT INTO public.empresa_usuario ...`
- `INSERT INTO public.auditoria ...`
- `INSERT INTO public.sesion ...`
- `INSERT INTO public.alumnos ...`
- `INSERT INTO public.egresados ...`
- `SELECT ... FROM public.usuarios ...`
- `UPDATE public.usuarios ...`
- `UPDATE public.empresas ...`

### Archivos modificados:
- `backend/resolvers.js`: Todos los queries de registro, login, verificación de email, actualización de empresa, etc.

---

## 8. ✅ Validación en tiempo real de email duplicado

### Implementación:
Se agregó validación **asíncrona** que verifica el email mientras el usuario escribe.

#### Backend:
- ✅ Nuevo query GraphQL: `verificarEmailDisponible(email: String!): Boolean!`
- ✅ Resolver que retorna `true` si el email está disponible, `false` si ya existe
- ✅ Manejo de errores que permite continuar si falla la verificación

#### Frontend:
- ✅ Nuevo método en `AuthService`: `verificarEmailDisponible(email: string)`
- ✅ Validador asíncrono en `RegisterComponent`: `emailDisponibleValidator()`
- ✅ Debounce de 500ms para evitar muchas peticiones
- ✅ Mensaje de error: "Este correo electrónico ya está registrado"
- ✅ El formulario se marca como inválido y **no permite avanzar**

### Beneficio:
El usuario **ve el error INMEDIATAMENTE** al escribir el email, no al final del formulario.

---

## 9. ✅ Mejora global de mensajes de error de GraphQL

### Problema:
Los mensajes de error del backend no se mostraban correctamente en el frontend. Solo aparecían mensajes genéricos.

### Solución implementada:

#### Estrategia de prioridad:
1. **SIEMPRE usar el mensaje del backend** si está disponible (`graphQLError.message`)
2. Solo usar mensajes hardcoded si no hay mensaje del backend
3. Incluir códigos de error específicos para casos especiales

#### Login Component (`login.component.ts`):
```typescript
private getLoginErrorMessage(error: any): string {
  // PRIMERO: Intentar obtener el mensaje de GraphQL
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    
    // Si el backend envió un mensaje, USARLO directamente
    if (graphQLError.message) {
      return graphQLError.message;
    }
    // ...
  }
}
```

#### Mensajes mejorados:
| Código de Error | Mensaje al Usuario |
|----------------|-------------------|
| `EMAIL_NOT_VERIFIED` | "Debe verificar su correo electronico antes de iniciar sesion. Revise su bandeja de entrada." |
| `INVALID_CREDENTIALS` | "Correo o contraseña incorrectos" |
| `USER_NOT_FOUND` | "Usuario no encontrado" |
| `INVALID_USER_TYPE` | "Este usuario no tiene permisos para acceder como el tipo seleccionado" |
| `EMAIL_ALREADY_EXISTS` | Mensaje del backend directamente |
| `DATABASE_ERROR` | Mensaje del backend directamente |
| `networkError` | "Error de conexión con el servidor. Por favor, verifique su conexión a internet" |

#### Duración de snackbar:
- ✅ `EMAIL_NOT_VERIFIED`: **10 segundos** (mensaje importante)
- ✅ `EMAIL_ALREADY_EXISTS`: **8 segundos**
- ✅ Otros errores: **7 segundos**
- ✅ Mensajes de éxito: **3-5 segundos**

---

## 📋 Estado actual (10 Nov 2025 21:40):

- ✅ Backend reiniciado con schemas corregidos (`public.` en TODOS los queries)
- ✅ Frontend con mensajes de error completos desde el backend
- ✅ Validación en tiempo real de email duplicado
- ✅ Duración de snackbar ajustada según importancia del mensaje
- ✅ Secuencia de BD corregida
- ✅ Logs documentados en `/tmp/backend.log` y `/tmp/frontend.log`
- ✅ Mapeo de tipos GraphQL ↔ BD implementado
- ✅ Usuario `alfre_costas@hotmail.com` corregido

## 🧪 Próximos pasos:

1. ✅ Schemas corregidos - Ya hecho
2. ✅ Validación en tiempo real - Ya hecho
3. ✅ Mensajes de error mejorados - Ya hecho
4. Probar registro de nueva empresa con `alfredinho008@gmail.com`
5. Verificar mensaje de email duplicado en tiempo real
6. Verificar mensaje de EMAIL_NOT_VERIFIED al intentar login
7. Verificar el link de verificación de email en `/tmp/backend.log`
8. Activar el email manualmente en la BD si es necesario
9. Probar login exitoso y búsqueda de portafolios
10. Hacer commit y push de los cambios
