/**
 * Modelos para el módulo de Oportunidades Laborales
 */

export type OpportunityState = 'BORRADOR' | 'ACTIVA' | 'PAUSADA' | 'CERRADA';
export type OpportunityModalidad = 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO';
export type OpportunityTipo = 'PASANTIA' | 'TIEMPO_COMPLETO' | 'TIEMPO_PARCIAL' | 'PROYECTO';

/**
 * Interfaz principal de Oportunidad
 */
export interface Opportunity {
  id: number;
  idOportunidad?: number;
  idEmpresa?: number;
  idCreador?: number;
  titulo: string;
  descripcion: string;
  requisitos?: string;
  ubicacion: string;
  modalidad: OpportunityModalidad;
  tipo: OpportunityTipo;
  fechaPublicacion?: string | null;
  fechaCierre?: string | null;
  estado: OpportunityState;
  etiquetas?: string[];
  creador?: {
    idUsuario: number;
    nombre?: string;
    apellido?: string;
  };
  empresa?: {
    idEmpresa: number;
    nombreEmpresa: string;
  };
}

/**
 * Input para crear/actualizar oportunidad
 */
export interface OpportunityInput {
  titulo: string;
  descripcion: string;
  requisitos?: string;
  ubicacion: string;
  modalidad: OpportunityModalidad;
  tipo: OpportunityTipo;
  fechaCierre?: string | null;
  etiquetas?: string[];
}

/**
 * Respuesta de GraphQL al crear oportunidad
 */
export interface CreateOpportunityResponse {
  crearOportunidadDocente?: Opportunity;
  crearOportunidadEmpresa?: Opportunity;
}

/**
 * Respuesta de GraphQL al actualizar oportunidad
 */
export interface UpdateOpportunityResponse {
  actualizarOportunidad: Opportunity;
}

/**
 * Respuesta de GraphQL al cambiar estado
 */
export interface ChangeStateResponse {
  cambiarEstadoOportunidad: Opportunity;
}

/**
 * Respuesta de GraphQL al eliminar
 */
export interface DeleteOpportunityResponse {
  eliminarOportunidad: boolean;
}

/**
 * Constantes para estados
 */
export const OPPORTUNITY_STATES: { value: OpportunityState; label: string }[] = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'PAUSADA', label: 'Pausada' },
  { value: 'CERRADA', label: 'Cerrada' },
];

/**
 * Constantes para modalidades
 */
export const MODALIDADES: { value: OpportunityModalidad; label: string }[] = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'HIBRIDO', label: 'Híbrido' },
  { value: 'REMOTO', label: 'Remoto' },
];

/**
 * Constantes para tipos
 */
export const TIPOS: { value: OpportunityTipo; label: string }[] = [
  { value: 'PASANTIA', label: 'Pasantía' },
  { value: 'TIEMPO_COMPLETO', label: 'Tiempo Completo' },
  { value: 'TIEMPO_PARCIAL', label: 'Tiempo Parcial' },
  { value: 'PROYECTO', label: 'Proyecto' },
];
