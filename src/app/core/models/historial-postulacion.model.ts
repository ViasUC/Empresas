export interface HistorialPostulacion {
  idHistorial: string;
  estadoAnterior: PostulacionEstado | null;
  estadoNuevo: PostulacionEstado;
  fechaCambio: string;
  motivo: string | null;
  actor: {
    idUsuario: string;
    nombre: string;
    apellido: string;
  } | null;
}

export type PostulacionEstado = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';
