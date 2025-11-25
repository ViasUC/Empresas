# VIASUC - Portal de Empresa
**Trabajo Final - Ingeniería de Software**  
**Universidad Católica Nuestra Señora de la Asunción**  
**Autores:** Grupo 4 - Empresas 
**Año:** 2025

---

## ¿Qué es esto?

Este es el frontend del portal para empresas de VIASUC (Vínculo Academia-Sector Productivo). Básicamente es una aplicación web donde las empresas pueden:

- Publicar oportunidades laborales (pasantías, empleos)
- Gestionar sus publicaciones (crear, editar, pausar, cerrar)
- Solicitar convenios con la universidad
- Buscar candidatos (egresados/alumnos)
- Administrar usuarios de la empresa

## Tecnologías Usadas

- **Angular 18** - Framework principal (con standalone components, lo más nuevo)
- **TypeScript** - Para tener tipado y no morir debuggeando
- **Apollo Client** - Para conectarnos al backend GraphQL
- **SCSS** - Para los estilos (CSS con esteroides)
- **Three.js** - Para el fondo animado con partículas en el login (porque se ve cool)

## Estructura del Proyecto

```
src/app/
├── core/                          # Cosas compartidas globalmente
│   ├── models/                    # Interfaces TypeScript
│   │   ├── auth.models.ts        # User, LoginResponse, etc.
│   │   └── opportunity.model.ts  # Todo lo de oportunidades
│   ├── services/                 # Servicios globales
│   │   └── auth.service.ts       # Maneja login/logout/sesión
│   └── guards/                   # Protegen rutas (si no estás logueado, te saca)
│
├── features/                     # Módulos por funcionalidad
│   ├── auth/                     # Login y registro
│   │   ├── login/               # Pantalla de login con animaciones
│   │   └── register/            # Registro de empresas
│   │
│   ├── empleador/               # Todo lo del dashboard de empresa
│   │   ├── dashboard-empleador/ # Pantalla principal con las cards
│   │   ├── buscar-portafolios/  # Buscar candidatos
│   │   ├── gestion-usuarios/    # Administrar equipo de RRHH
│   │   ├── solicitar-convenio/  # Formulario para convenios
│   │   ├── mis-solicitudes/     # Ver estado de convenios
│   │   └── convenios-vigentes/  # Convenios aprobados
│   │
│   └── oportunidades/           # Módulo de ofertas laborales
│       ├── opportunity-list/    # Lista con filtros y acciones
│       ├── opportunity-form/    # Crear/editar oportunidad
│       └── services/            # Lógica de negocio de oportunidades
│
└── shared/                      # Componentes reutilizables
    └── components/              # Botones, modales, etc.
```

## Cómo Levantar el Proyecto

### Requisitos Previos

Para levantar el FRONTEND necesitas:
- **Node.js** (versión 18 o superior) - Para correr Angular y el servidor de desarrollo
- **npm** (viene incluido con Node.js) - Para instalar dependencias
- **Git** - Para clonar el repositorio

Nota: Angular 18 se instala automáticamente al hacer `npm install`, no hace falta instalarlo por separado.

### Pasos para Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/ViasUC/Empresas.git
   cd Empresas/ViasucFrontEnd
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```
   (Esto puede tardar un rato, va a descargar todas las librerías)

3. **Configurar variables de entorno**
   
   El archivo `src/environments/environment.ts` ya tiene las URLs del backend:
   ```typescript
   apiUrl: 'http://localhost:8080/api/v1'
   graphqlUrl: 'http://localhost:8080/graphql'
   ```
   
   Si necesitas cambiar algo, edita ese archivo.

4. **Levantar el servidor de desarrollo**
   ```bash
   npm start
   ```
   
   Abre el navegador en: `http://localhost:4200`

5. **Para acceder desde el celular** (misma red WiFi):
   ```bash
   npm start -- --host 0.0.0.0 --port 4200
   ```
   Luego abre en el celular: `http://[IP-DE-TU-PC]:4200`

### Build para Producción

```bash
npm run build
```

Los archivos compilados quedan en `dist/` listos para subir al servidor.

## Credenciales de Prueba

Para probar el sistema:
- **Email:** `portega@gmail.com`
- **Password:** `chacomer`
- **Rol:** EMPLEADOR (empresa)

## Módulos Principales Implementados

### 1. Sistema de Autenticación
- Login con validación
- Registro de empresas nuevas
- Manejo de sesión con localStorage
- Guards para proteger rutas

### 2. Gestión de Oportunidades (LO MÁS IMPORTANTE)

Este fue el módulo que más trabajamos. Tiene todo un sistema de estados:

#### Estados de una Oportunidad
- **Borrador** - Recién creada, solo visible para la empresa
- **Activo** - Publicada, visible para todos los candidatos
- **Pausada** - Temporalmente oculta (se puede reactivar)
- **Cerrado** - Finalizada, no se puede reabrir

#### Reglas de Negocio
- Solo se puede **EDITAR** si está en estado **BORRADOR**
- Si está Activa o Pausada, solo puedes cambiarle el estado
- Cada cambio de estado queda **auditado** en la BD (quién lo hizo y cuándo)
- Los botones de acción cambian según el estado actual

#### Transiciones de Estado
```
BORRADOR ──(Publicar)──> ACTIVO
ACTIVO ──(Pausar)──> PAUSADA
PAUSADA ──(Reanudar)──> ACTIVO
ACTIVO/PAUSADA ──(Cerrar)──> CERRADO
```

#### Campos de una Oportunidad
- Título
- Descripción
- Requisitos
- Ubicación
- Modalidad (Presencial, Híbrido, Remoto)
- Tipo (Pasantía, Tiempo Completo, Tiempo Parcial, Proyecto)
- Fecha de cierre
- Etiquetas (separadas por comas)

### 3. Módulo de Convenios

Implementado por el compañero Federico:
- Solicitar convenio con la universidad
- Ver estado de solicitudes
- Administrar convenios vigentes

### 4. Dashboard Principal

Una pantalla con cards que te llevan a:
- Publicar nueva oferta
- Ver mis ofertas
- Buscar candidatos
- Gestionar usuarios
- Solicitar convenio
- Ver convenios

## Características de Diseño

### Login
- Fondo animado con partículas (Three.js)
- Redes sociales de la UC (Facebook, Twitter, Instagram, YouTube)
- Enlaces laterales flotantes (Beneficios, Radio Cáritas, Sapientia)
- Diseño responsive para móviles

### Lista de Oportunidades
- Tabla con filtros por texto y estado
- Badges de colores según el estado
- Botones condicionales (solo aparecen si puedes hacer esa acción)
- Confirmaciones antes de cambiar estado

### Formulario de Oportunidad
- Validaciones en tiempo real
- Fecha con datepicker
- Dropdowns para modalidad y tipo
- Warning si intentas editar algo que no está en borrador
- Guardado con formato ISO para las fechas (backend lo pide así)

## Problemas que Resolvimos

### 1. Enum de Estados
**Problema:** El frontend usaba `'ACTIVA'`, `'PAUSADA'` (mayúsculas) pero la BD de PostgreSQL tiene `'activo'`, `'pausada'` (minúsculas y con género mixto).

**Solución:** Cambiamos todo el frontend para usar exactamente los valores de la BD:
```typescript
type OpportunityState = 'activo' | 'borrador' | 'pausada' | 'cerrado';
```

### 2. Formato de Fechas
**Problema:** El backend esperaba `'2025-12-31T23:59:00'` pero mandábamos `'2025-12-31'`.

**Solución:** Agregamos la hora al string:
```typescript
fechaCierre: data.fechaCierre ? `${data.fechaCierre}T23:59:00` : null
```

**Solución:** Resolvimos el conflicto manualmente, dejando AMBAS rutas:
```typescript
// Rutas Oportunidades
{ path: 'oportunidades', component: OpportunityListComponent },
// Rutas Convenios  
{ path: 'dashboard/empleador/solicitar-convenio', component: SolicitarConvenioComponent },
```

## Known Issues (Bugs Conocidos)
- **Budget warnings:** Los archivos CSS son un poco pesados (pasan los 8KB), pero funciona igual
- **CommonJS warnings:** Algunas librerías (canvg, html2canvas) todavía usan CommonJS en vez de ESM, Angular se queja pero no rompe nada
- **Cloudflare down:** Tuvimos que cambiar a la URL directa de AWS porque Cloudflare se cayó (temporal)

## Dependencias Importantes

```json
{
  "apollo-angular": "^7.0.2",        // Cliente GraphQL
  "graphql": "^16.9.0",              // Para las queries
  "three": "^0.169.0",               // Animaciones 3D
  "ngx-cookie-service": "^18.0.0",   // Manejo de cookies
  "@angular/forms": "^18.2.8"        // Formularios reactivos
}
```

## Conexión con el Backend

El backend está en Spring Boot con GraphQL. Las queries principales que usamos:

### Login
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    idUsuario
    nombre
    apellido
    rolPrincipal
  }
}
```

### Crear Oportunidad
```graphql
mutation CrearOportunidad($input: CrearOportunidadInput!) {
  crearOportunidadDocente(input: $input) {
    idOportunidad
    titulo
    estado
  }
}
```

### Cambiar Estado (con auditoría)
```graphql
mutation CambiarEstado($idOportunidad: ID!, $nuevoEstado: EstadoOportunidad!, $idActor: ID!) {
  cambiarEstadoOportunidad(idOportunidad: $idOportunidad, nuevoEstado: $nuevoEstado, idActor: $idActor) {
    idOportunidad
    estado
  }
}
```
## Base de Datos
El backend se conecta a PostgreSQL con este enum:
```sql
CREATE TYPE estado_oportunidad AS ENUM ('activo', 'borrador', 'pausada', 'cerrado');
```

Hay una constraint que valida:
```sql
CHECK (estado IN ('activo', 'borrador', 'pausada', 'cerrado'))
```
Por eso es SÚPER importante usar exactamente esos valores.

## Cómo Probar
1. Iniciar backend (puerto 8080)
2. Iniciar frontend: `npm start`
3. Ir a `http://localhost:4200/login`
4. Loguearte con las credenciales de prueba
5. Crear una oportunidad (queda en BORRADOR)
6. Publicarla (pasa a ACTIVO)
7. Ver que ya no puedes editar (solo cambiar estado)
8. Pausarla, reanudarla, cerrarla
9. Verificar en la BD que se crearon los registros de auditoría

## Responsive
Todo está adaptado para móviles. Probado en:
- Chrome DevTools (varios dispositivos)
- iPhone real
- Android real

## Contacto
Si algo no funciona o tienen dudas para la corrección:
- Email: alfre_costas@hotmail.com
- GitHub: https://github.com/ViasUC/Empresas

---

**Nota para los correctores:** Todo el código está comentado donde es necesario. Si quieren ver cómo funciona algo específico, busquen los archivos mencionados en este README. La parte más importante es el módulo de oportunidades con su sistema de estados y auditoría.


