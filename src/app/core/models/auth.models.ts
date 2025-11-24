/**
 * Modelos de datos para autenticación y registro
 */

export interface RegistroData {
  tipoUsuario: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO';
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  ubicacion?: string;
  datosEmpresa?: DatosEmpresaRegistro;
}

export interface DatosEmpresaRegistro {
  idEmpresa?: number; // ID de empresa existente (cuando se une a una empresa)
  nombreEmpresa: string;
  ruc: string;
  razonSocial: string;
  contacto?: string;
  ubicacion?: string;
  email?: string;
  rolEnEmpresa: string;
  unirseAExistente?: boolean; // Flag para indicar si se une a existente o crea nueva
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  tipo: string; // EMPLEADOR, ESTUDIANTE, EGRESADO, DOCENTE, etc.
  token?: string;
  telefono?: string;
  idEmpresa?: number; // ID de la empresa si es tipo EMPLEADOR
}

export interface LoginResponse {
  login: {
    idUsuario: string;
    nombre: string;
    apellido: string;
    rolPrincipal: string;
    idEmpresa?: number;
  };
}

export interface RegisterResponse {
  register: {
    token: string;
    usuario: {
      idUsuario: string;
      nombre: string;
      apellido: string;
      email: string;
      rol: string;
    };
    success: boolean;
    message: string;
  };
}
