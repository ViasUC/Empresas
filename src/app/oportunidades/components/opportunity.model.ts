export type OpportunityState = 'BORRADOR' | 'ACTIVA' | 'PAUSADA' | 'CERRADA';

export interface Opportunity {
  id: number;
  id_oportunidad?: number;
  id_empresa?: number;
  id_creador?: number;
  titulo: string;
  descripcion: string;
  requisitos?: string;
  ubicacion: string;
  modalidad: string;
  tipo: string;
  fecha_publicacion?: string | null;
  fechaPublicacion?: string | null;
  fecha_cierre?: string;
  fechaCierre?: string | null;
  estado: OpportunityState;
  etiquetas?: string[];
}

export interface OpportunityInput {
  titulo: string;
  descripcion: string;
  requisitos?: string;
  ubicacion: string;
  modalidad: string;
  tipo: string;
  fechaCierre?: string | null;  // ISO 8601
}

export const OPPORTUNITY_STATES: { value: OpportunityState; label: string }[] = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'PAUSADA', label: 'Pausada' },
  { value: 'CERRADA', label: 'Cerrada' },
];

export const MODALIDADES = ['PRESENCIAL', 'HIBRIDO', 'REMOTO'];
export const TIPOS = ['PASANTIA', 'TIEMPO_COMPLETO', 'TIEMPO_PARCIAL', 'PROYECTO'];
