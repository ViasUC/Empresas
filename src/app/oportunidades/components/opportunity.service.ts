import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { Opportunity, OpportunityInput, OpportunityState } from './opportunity.model';
import { AuthService } from '../../core/services/auth.service';

interface OportunidadesPorCreadorResponse {
  oportunidadesPorCreador: any[];
}

interface OportunidadResponse {
  oportunidad: any;
}

interface CrearOportunidadResponse {
  crearOportunidadDocente: any;
  crearOportunidadEmpresa?: any;
}

interface GraphQLResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class OpportunityService {
  private readonly GET_BY_CREADOR = gql`
    query OportunidadesPorCreador($creadorId: ID!) {
      oportunidadesPorCreador(creadorId: $creadorId) {
        id
        idOportunidad
        titulo
        descripcion
        requisitos
        ubicacion
        modalidad
        tipo
        fechaPublicacion
        fechaCierre
        estado
        creador {
          idUsuario
        }
        empresa
      }
    }
  `;

  private readonly GET_BY_ID = gql`
    query Oportunidad($id: ID!) {
      oportunidad(id: $id) {
        id
        idOportunidad
        titulo
        descripcion
        requisitos
        ubicacion
        modalidad
        tipo
        fechaPublicacion
        fechaCierre
        estado
        creador {
          idUsuario
        }
        empresa
      }
    }
  `;

  private readonly CREAR_OPORTUNIDAD = gql`
    mutation CrearOportunidadDocente($input: CrearOportunidadInput!) {
      crearOportunidadDocente(input: $input) {
        id
        idOportunidad
        titulo
        descripcion
        requisitos
        ubicacion
        modalidad
        tipo
        fechaPublicacion
        fechaCierre
        estado
        creador {
          idUsuario
        }
        empresa
      }
    }
  `;

  private readonly CREAR_OPORTUNIDAD_EMPRESA = gql`
    mutation CrearOportunidadEmpresa($input: CrearOportunidadInput!) {
      crearOportunidadEmpresa(input: $input) {
        id: idOportunidad
        idOportunidad
        titulo
        descripcion
        requisitos
        ubicacion
        modalidad
        tipo
        fechaPublicacion
        fechaCierre
        estado
      }
    }
  `;

  private readonly ACTUALIZAR_OPORTUNIDAD = gql`
    mutation ActualizarOportunidad($id: Int!, $input: CrearOportunidadInput!, $idActor: ID!) {
      actualizarOportunidad(id: $id, input: $input, idActor: $idActor) {
        id: idOportunidad
        idOportunidad
        titulo
        descripcion
        requisitos
        ubicacion
        modalidad
        tipo
        fechaPublicacion
        fechaCierre
        estado
      }
    }
  `;

  private readonly CAMBIAR_ESTADO = gql`
    mutation CambiarEstado($id: Int!, $estado: String!, $idActor: ID!) {
      cambiarEstadoOportunidad(id: $id, estado: $estado, idActor: $idActor) {
        id: idOportunidad
        idOportunidad
        estado
        fechaPublicacion
      }
    }
  `;

  private readonly ELIMINAR_OPORTUNIDAD = gql`
    mutation EliminarOportunidad($id: Int!, $idActor: ID!) {
      eliminarOportunidad(id: $id, idActor: $idActor)
    }
  `;

  private apiUrl = 'http://localhost:8080/graphql';

  constructor(
    private apollo: Apollo,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ==== Helpers ====

  private postGraphQL<T>(query: string, variables?: any): Observable<T> {
    return this.http
      .post<GraphQLResponse<T>>(this.apiUrl, { query, variables })
      .pipe(map((res) => res.data));
  }

  private get currentUserId(): number {
    const user = this.authService.getCurrentUser();
    console.log('OpportunityService.currentUserId - Usuario actual:', user);
    if (!user || !user.id) {
      console.error('OpportunityService.currentUserId - No hay usuario autenticado o no tiene ID');
      throw new Error('No hay usuario autenticado. Por favor, inicia sesión nuevamente.');
    }
    console.log('OpportunityService.currentUserId - ID del usuario:', user.id);
    return user.id;
  }

  private mapEstadoFromBackend(estado: string | null | undefined): OpportunityState {
    const value = (estado || '').toLowerCase();
    switch (value) {
      case 'activo':
        return 'ACTIVA';
      case 'activa':
        return 'ACTIVA';
      case 'borrador':
        return 'BORRADOR';
      case 'pausada':
        return 'PAUSADA';
      case 'cerrado':
      case 'cerrada':
        return 'CERRADA';
      default:
        return 'BORRADOR';
    }
  }

  private mapFromGql(o: any): Opportunity {
    return {
      id: Number(o.id ?? o.idOportunidad),
      id_oportunidad: Number(o.idOportunidad ?? o.id),
      id_empresa: o.id_empresa ?? 0,
      id_creador: o.creador ? Number(o.creador.idUsuario) : 0,
      titulo: o.titulo ?? '',
      descripcion: o.descripcion ?? '',
      requisitos: o.requisitos ?? '',
      ubicacion: o.ubicacion ?? '',
      modalidad: o.modalidad ?? '',
      tipo: o.tipo ?? '',
      fecha_publicacion: o.fechaPublicacion ?? null,
      fechaPublicacion: o.fechaPublicacion ?? null,
      fecha_cierre: o.fechaCierre ?? '',
      fechaCierre: o.fechaCierre ?? null,
      estado: this.mapEstadoFromBackend(o.estado),
      etiquetas: o.etiquetas ?? [],
    };
  }

  // ==== Queries ====

  list(): Observable<Opportunity[]> {
    return this.apollo
      .watchQuery<OportunidadesPorCreadorResponse>({
        query: this.GET_BY_CREADOR,
        variables: { creadorId: this.currentUserId },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((result) =>
          (result.data?.oportunidadesPorCreador || []).map((o) => this.mapFromGql(o)),
        ),
      );
  }

  listMine(): Observable<Opportunity[]> {
    return this.list();
  }

  getById(id: number): Observable<Opportunity | undefined> {
    return this.apollo
      .query<OportunidadResponse>({
        query: this.GET_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) =>
          result.data?.oportunidad ? this.mapFromGql(result.data.oportunidad) : undefined,
        ),
      );
  }

  // ==== Mutations ====

  create(
    data:
      | OpportunityInput
      | {
          titulo: string;
          descripcion: string;
          requisitos?: string;
          ubicacion: string;
          modalidad: string;
          tipo: string;
          fecha_cierre: string;
          etiquetas?: string[];
        },
  ): Observable<Opportunity> {
    const input = {
      idCreador: String(this.currentUserId),
      titulo: data.titulo,
      descripcion: data.descripcion,
      requisitos: data.requisitos || '',
      ubicacion: data.ubicacion,
      modalidad: data.modalidad,
      tipo: data.tipo,
      fechaCierre: ('fechaCierre' in data ? data.fechaCierre : null) || 
                    ('fecha_cierre' in data ? `${data.fecha_cierre}T23:59:00` : null),
      estado: 'borrador',
    };

    console.log('OpportunityService.create - Input a enviar:', input);

    return this.apollo
      .mutate<CrearOportunidadResponse>({
        mutation: this.CREAR_OPORTUNIDAD_EMPRESA,
        variables: { input },
      })
      .pipe(
        map((result) => {
          if (!result.data?.crearOportunidadEmpresa) {
            throw new Error('No se recibió respuesta del servidor al crear la oportunidad');
          }
          console.log('OpportunityService.create - Respuesta del servidor:', result.data.crearOportunidadEmpresa);
          return this.mapFromGql(result.data.crearOportunidadEmpresa);
        }),
      );
  }

  update(id: number, input: OpportunityInput | Partial<Opportunity>): Observable<Opportunity> {
    const variables = {
      id,
      idActor: this.currentUserId,
      input: {
        idCreador: String(this.currentUserId),
        titulo: input.titulo || '',
        descripcion: input.descripcion || '',
        requisitos: input.requisitos || '',
        ubicacion: input.ubicacion || '',
        modalidad: input.modalidad || '',
        tipo: input.tipo || '',
        fechaCierre: input.fechaCierre || null,
      },
    };

    return this.apollo
      .mutate<{ actualizarOportunidad: any }>({
        mutation: this.ACTUALIZAR_OPORTUNIDAD,
        variables,
      })
      .pipe(
        map((result) => {
          if (!result.data?.actualizarOportunidad) {
            throw new Error('No se recibió respuesta al actualizar la oportunidad');
          }
          return this.mapFromGql(result.data.actualizarOportunidad);
        }),
      );
  }

  changeState(id: number, newState: OpportunityState): Observable<Opportunity> {
    // Mapear el estado del frontend al formato que espera el backend
    const estadoBackend = this.mapEstadoToBackend(newState);
    
    return this.apollo
      .mutate<{ cambiarEstadoOportunidad: any }>({
        mutation: this.CAMBIAR_ESTADO,
        variables: {
          id,
          estado: estadoBackend,
          idActor: this.currentUserId,
        },
      })
      .pipe(
        map((result) => {
          if (!result.data?.cambiarEstadoOportunidad) {
            throw new Error('No se recibió respuesta al cambiar el estado');
          }
          return this.mapFromGql(result.data.cambiarEstadoOportunidad);
        }),
      );
  }

  private mapEstadoToBackend(estado: OpportunityState): string {
    switch (estado) {
      case 'ACTIVA':
        return 'activo';
      case 'BORRADOR':
        return 'borrador';
      case 'PAUSADA':
        return 'pausada';
      case 'CERRADA':
        return 'cerrado';
      default:
        return 'borrador';
    }
  }

  duplicate(_id: number): Observable<Opportunity> {
    console.error('[OpportunityService] duplicate() aún no implementado en backend');
    return of(null as any as Opportunity);
  }

  delete(id: number): Observable<boolean> {
    return this.apollo
      .mutate<{ eliminarOportunidad: boolean }>({
        mutation: this.ELIMINAR_OPORTUNIDAD,
        variables: {
          id,
          idActor: this.currentUserId,
        },
      })
      .pipe(
        map((result) => {
          if (result.data?.eliminarOportunidad === undefined) {
            throw new Error('No se recibió respuesta al eliminar');
          }
          return result.data.eliminarOportunidad;
        }),
      );
  }
}
