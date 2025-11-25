/**
 * FSM (Finite State Machine) para UC-EMP-004 - Buscar Portafolios Candidato
 * 
 * DIAGRAMA DE ESTADOS:
 * 
 *     [IDLE] 
 *        |
 *        | INIT
 *        ↓
 *   [LOADING_FILTERS] ←────────────────┐
 *        |                             │
 *        | FILTERS_LOADED              │ RETRY
 *        ↓                             │
 *     [READY] ←──────────────────────┐ │
 *        |                           │ │
 *        | SEARCH_REQUESTED          │ │
 *        ↓                           │ │
 *   [SEARCHING]                      │ │
 *        |                           │ │
 *        ├─ SUCCESS → [SUCCESS] ─────┘ │
 *        ├─ AUTH_ERROR → [ERROR_AUTH]  │
 *        ├─ FORBIDDEN → [ERROR_FORBIDDEN]
 *        ├─ VALIDATION → [ERROR_VALIDATION] ──┐
 *        └─ SERVER_ERROR → [ERROR_SERVER] ────┘
 * 
 * TRANSICIONES:
 * - RESET: Cualquier estado → IDLE (excepto desde estados de error auth/forbidden)
 * - RETRY: Estados de error → Estado anterior apropiado
 * 
 * CASOS DE USO CUBIERTOS:
 * 1. Flujo normal: IDLE → LOADING_FILTERS → READY → SEARCHING → SUCCESS
 * 2. Error de autenticación: → ERROR_AUTH (require login)
 * 3. Error de permisos: → ERROR_FORBIDDEN (sin permisos)
 * 4. Error de validación: → ERROR_VALIDATION (filtros inválidos, puede reintentar)
 * 5. Error de servidor: → ERROR_SERVER (problema técnico, puede reintentar)
 * 
 * EVENTOS DEL DIAGRAMA DE SECUENCIA:
 * - GET/Search/Filters → INIT + FILTERS_LOADED
 * - POST/Search(Filtros) → SEARCH_REQUESTED
 * - validarToken() OK → continúa flujo
 * - validarToken() ERROR → AUTH_ERROR (401)
 * - Sin permisos → FORBIDDEN_ERROR (403)
 * - Filtros inválidos → VALIDATION_ERROR (400)
 * - Error BD → SERVER_ERROR (500)
 * - Resultado exitoso → SEARCH_SUCCESS
 */

// Este archivo sirve como documentación del FSM implementado