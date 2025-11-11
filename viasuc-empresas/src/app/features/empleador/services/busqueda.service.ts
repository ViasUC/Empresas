import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Portafolio {
  id: string;
  usuarioId: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  carrera?: string;
  habilidades: string[];
  descripcion?: string;
  ubicacion?: string;
  visibilidad: string;
  fechaActualizacion?: string;
  // Campos adicionales para búsqueda avanzada
  tipo?: string; // 'PORTAFOLIO' | 'ESTUDIANTE' | 'EGRESADO'
  modalidad?: string; // 'presencial' | 'remoto' | 'hibrido'
  promedio?: number;
  rating?: number;
  experiencia?: string;
  idiomas?: string[];
  anioEstudio?: number;
}

export interface FiltrosBusqueda {
  carrera?: string;
  habilidades?: string[];
  ubicacion?: string;
  pagina?: number;
  limite?: number;
}

export interface ResultadoBusqueda {
  portafolios: Portafolio[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface FiltrosDisponibles {
  carreras: string[];
  niveles: string[];
  ubicaciones: string[];
  disponibilidades: string[];
}

/**
 * Servicio para busqueda de portafolios de candidatos
 */
@Injectable({
  providedIn: 'root'
})
export class BusquedaService {

  private BUSCAR_PORTAFOLIOS = gql`
    query BuscarPortafolios($filtros: FiltrosBusqueda) {
      buscarPortafolios(filtros: $filtros) {
        portafolios {
          id
          tipo
          usuarioId
          nombre
          apellido
          email
          telefono
          carrera
          habilidades
          descripcion
          ubicacion
          visibilidad
          fechaActualizacion
        }
        total
        pagina
        totalPaginas
      }
    }
  `;

  private OBTENER_FILTROS = gql`
    query ObtenerFiltros {
      obtenerFiltros {
        carreras
        niveles
        ubicaciones
        disponibilidades
      }
    }
  `;

  constructor(private apollo: Apollo) {}

  /**
   * Buscar portafolios con filtros opcionales
   */
  buscarPortafolios(filtros?: FiltrosBusqueda): Observable<ResultadoBusqueda> {
    return this.apollo.query<{ buscarPortafolios: ResultadoBusqueda }>({
      query: this.BUSCAR_PORTAFOLIOS,
      variables: { filtros },
      fetchPolicy: 'network-only' // Siempre obtener datos frescos
    }).pipe(
      map(result => result.data.buscarPortafolios)
    );
  }

  /**
   * Obtener catalogo de filtros disponibles
   */
  obtenerFiltros(): Observable<FiltrosDisponibles> {
    return this.apollo.query<{ obtenerFiltros: FiltrosDisponibles }>({
      query: this.OBTENER_FILTROS,
      fetchPolicy: 'cache-first' // Los filtros no cambian tanto
    }).pipe(
      map(result => result.data.obtenerFiltros)
    );
  }
}
