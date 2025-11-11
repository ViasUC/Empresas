/**
 * Schema GraphQL para VIASUC
 * Define los tipos, queries y mutations del sistema
 */

export const typeDefs = `#graphql
  # Tipo de usuario en el sistema
  enum TipoUsuario {
    EMPLEADOR
    ESTUDIANTE
    EGRESADO
    ADMIN
  }

  # Usuario del sistema
  type User {
    id: ID!
    email: String!
    nombre: String!
    apellido: String!
    tipo: TipoUsuario!
    telefono: String
    fechaCreacion: String
    ultimoAcceso: String
    emailVerificado: Boolean!
  }

  # Respuesta del login
  type AuthPayload {
    user: User!
    token: String!
    refreshToken: String!
  }

  # Respuesta de logout
  type LogoutResponse {
    success: Boolean!
    message: String!
  }

  # Respuesta de verificación de token
  type TokenVerification {
    valid: Boolean!
    user: User
  }

  # Input para login
  input LoginInput {
    email: String!
    password: String!
    tipoUsuario: TipoUsuario!
  }

  # Input para registro de usuario
  input RegisterInput {
    tipoUsuario: TipoUsuario!
    nombre: String!
    apellido: String!
    email: String!
    telefono: String!
    password: String!
    ubicacion: String
    # Campos específicos para EMPLEADOR
    nombreEmpresa: String
    ruc: String
    razonSocial: String
    contacto: String
    ubicacionEmpresa: String
    emailEmpresa: String
    rolEnEmpresa: String
  }

  # Queries disponibles
  type Query {
    # Verificar si el token actual es válido
    verifyToken: TokenVerification!
    
    # Obtener usuario actual (requiere autenticación)
    me: User
    
    # Obtener empresa del usuario logueado
    miEmpresa: Empresa
  }

  # Respuesta de verificación de email
  type VerifyEmailResponse {
    success: Boolean!
    message: String!
    token: String
  }

  # Empresa
  type Empresa {
    id: ID!
    nombreEmpresa: String!
    ruc: String!
    razonSocial: String!
    contacto: String
    ubicacion: String
    email: String
    sector: String
    tamano: String
    descripcion: String
    sitioWeb: String
    linkedIn: String
    ciudad: String
    direccion: String
  }

  # Input para actualizar empresa
  input ActualizarEmpresaInput {
    nombreEmpresa: String!
    ruc: String!
    razonSocial: String!
    contacto: String
    ubicacion: String
    email: String
    sector: String
    tamano: String
    descripcion: String
    sitioWeb: String
    linkedIn: String
    ciudad: String
    direccion: String
  }

  # Respuesta de actualización de empresa
  type ActualizarEmpresaResponse {
    success: Boolean!
    message: String!
    empresa: Empresa
  }

  # Portafolio de candidato
  type Portafolio {
    id: ID!
    usuarioId: ID!
    nombre: String!
    apellido: String!
    email: String
    telefono: String
    carrera: String
    nivelEstudio: String
    habilidades: [String!]
    experiencia: String
    ubicacion: String
    disponibilidad: String
    descripcion: String
    visibilidad: String!
    fechaActualizacion: String
  }

  # Filtros de búsqueda
  input FiltrosBusqueda {
    carrera: String
    habilidades: [String!]
    nivelEstudio: String
    ubicacion: String
    disponibilidad: String
    experiencia: String
    pagina: Int
    limite: Int
  }

  # Resultado paginado de búsqueda
  type ResultadoBusqueda {
    portafolios: [Portafolio!]!
    total: Int!
    pagina: Int!
    totalPaginas: Int!
  }

  # Catálogo de filtros disponibles
  type FiltrosDisponibles {
    carreras: [String!]!
    niveles: [String!]!
    ubicaciones: [String!]!
    disponibilidades: [String!]!
  }

  # Queries disponibles
  type Query {
    # Verificar si el token es válido
    verifyToken: TokenVerification!
    
    # Verificar si un email está disponible
    verificarEmailDisponible(email: String!): Boolean!
    
    # Obtener datos de mi empresa
    miEmpresa: Empresa
    
    # Buscar portafolios de candidatos
    buscarPortafolios(filtros: FiltrosBusqueda): ResultadoBusqueda!
    
    # Obtener catálogo de filtros disponibles
    obtenerFiltros: FiltrosDisponibles!
  }

  # Mutations disponibles
  type Mutation {
    # Iniciar sesión
    login(email: String!, password: String!, tipoUsuario: TipoUsuario!): AuthPayload!
    
    # Registrar nuevo usuario
    register(input: RegisterInput!): AuthPayload!
    
    # Cerrar sesión
    logout: LogoutResponse!
    
    # Verificar email con token
    verifyEmail(token: String!): VerifyEmailResponse!
    
    # Reenviar email de verificación
    resendVerificationEmail(email: String!): LogoutResponse!
    
    # Actualizar datos de empresa
    actualizarEmpresa(input: ActualizarEmpresaInput!): ActualizarEmpresaResponse!
  }
`;

export default typeDefs;
