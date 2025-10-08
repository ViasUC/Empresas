# VIASUC - Portal de Empresas
Este es nuestro proyecto para el curso de Ingeniería de Software. Es una aplicación web para empresas que quieren conectar con estudiantes de la UC.

## ¿Qué es esto?

Es un proyecto hecho con Angular para crear un portal donde las empresas pueden:
- Registrarse e iniciar sesión 
- Buscar perfiles de estudiantes
- Publicar ofertas de trabajo
- Ver portafolios de candidatos

## Cómo ejecutar el proyecto
Primero necesitas tener Node.js instalado. Después ejecuta estos comandos:
```bash
# Instalar las dependencias
npm install
# Ejecutar el servidor de desarrollo
ng serve
```
Luego abre tu navegador en `http://localhost:4200/` y deberías ver la aplicación funcionando.

## Estructura del proyecto

- `src/app/features/auth/` - Todo lo relacionado con login y registro
- `src/app/core/` - Servicios importantes como autenticación  
- `src/app/shared/` - Componentes que usamos en varias partes
- `src/environments/` - Configuraciones para desarrollo y producción

## Tecnologías que usamos

- **Angular 18** - Framework principal
- **Angular Material** - Para los componentes de interfaz
- **TypeScript** - Lenguaje de programación
- **SCSS** - Para los estilos
- **Bootstrap** - Para hacer que se vea bien en móviles

## Estado actual

Por ahora tenemos:
- ✅ Página de login con tabs para diferentes tipos de usuario
- ✅ Formularios con validaciones básicas
- ⏳ Conectar con el backend (en progreso)
- ⏳ Páginas para ver perfiles de estudiantes
- ⏳ Sistema de notificaciones

## Comandos útiles
```bash
# Crear un componente nuevo
ng generate component nombre-del-componente
# Ejecutar las pruebas
ng test
# Compilar para producción
ng build --prod


## Problemas conocidos
- A veces hay que reiniciar el servidor si Angular Material no carga bien
- Los estilos se ven un poco raro en Internet Explorer.



*Si tienes problemas ejecutando el proyecto, pregúntanos en el grupo de WhatsApp!*
