export interface OportunidadResumen {
  idOportunidad: number;
  titulo: string;
}

export interface PostulanteResumen {
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
}

export interface Postulacion {
  idPostulacion: number;
  fechaPostulacion: string;
  estado: string;
  oportunidad: OportunidadResumen | null;
  postulante: PostulanteResumen | null;
}

export interface PostulacionesEmpresaPayload {
  total: number;
  page: number;
  size: number;
  items: Postulacion[];
}

export interface PostulacionesEmpresaResponse {
  postulacionesEmpresa: PostulacionesEmpresaPayload;
}

// Debe coincidir con tu input GraphQL PostulacionFiltro
export interface FiltroPostulacionInput {
  idOportunidad?: string | null;
  idAlumno?: string | null;
  estados?: string[] | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  texto?: string | null;
}
