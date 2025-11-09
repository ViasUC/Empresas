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
