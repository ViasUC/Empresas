import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Opportunity,
  OpportunityInput,
  OpportunityState,
  CreateOpportunityResponse,
  UpdateOpportunityResponse,
  ChangeStateResponse,
  DeleteOpportunityResponse
} from '../../../core/models/opportunity.model';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Servicio para gestionar oportunidades laborales
 * Integrado con AuthService para obtener usuario actual
 */
@Injectable({
  providedIn: 'root',
})
export class OpportunityService {
  
  // GraphQL Queries
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

  private readonly GET_BY_EMPRESA = gql`
    query OportunidadesPorEmpresa($idEmpresa: ID!) {
      oportunidadesPorEmpresa(idEmpresa: $idEmpresa) {
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

  // GraphQL Mutations
  private readonly CREAR_OPORTUNIDAD = gql`
    mutation CrearOportunidad($input: CrearOportunidadInput!) {
      crearOportunidadDocente(input: $input) {
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
    mutation EditarOportunidad($input: EditarOportunidadInput!) {
      editarOportunidad(input: $input) {
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
    mutation CambiarEstado($idOportunidad: ID!, $nuevoEstado: EstadoOportunidad!, $idActor: ID!) {
      cambiarEstadoOportunidad(idOportunidad: $idOportunidad, nuevoEstado: $nuevoEstado, idActor: $idActor) {
        id: idOportunidad
        idOportunidad
        estado
        fechaPublicacion
      }
    }
  `;

  private readonly ELIMINAR_OPORTUNIDAD = gql`
    mutation EliminarOportunidad($id: ID!, $idActor: ID!) {
      eliminarOportunidad(id: $id, idActor: $idActor)
    }
  `;

  constructor(
    private apollo: Apollo,
    private authService: AuthService
  ) {}

  /**
   * Obtiene el ID del usuario actual desde AuthService
   */
  private get currentUserId(): number {
    const user = this.authService.getCurrentUser();
    console.log('Obteniendo currentUserId, usuario completo:', JSON.stringify(user));
    if (!user) {
      console.error('Usuario no autenticado - user es null/undefined');
      throw new Error('Usuario no autenticado. Por favor, inicia sesión nuevamente.');
    }
    if (!user.id) {
      console.error('Usuario no tiene ID:', user);
      throw new Error('El usuario no tiene ID válido');
    }
    return user.id;
  }

  /**
   * Mapea el estado del backend (constraint PostgreSQL: activo, borrador, pausada, cerrado)
   */
  private mapEstadoFromBackend(estado: string | null | undefined): OpportunityState {
    const value = (estado || '').toLowerCase();
    switch (value) {
      case 'activo':
        return 'activo';
      case 'borrador':
        return 'borrador';
      case 'pausada':
        return 'pausada';
      case 'cerrado':
        return 'cerrado';
      default:
        return 'borrador';
    }
  }

  /**
   * Mapea la respuesta de GraphQL al modelo Opportunity
   */
  private mapFromGql(o: any): Opportunity {
    return {
      id: Number(o.id ?? o.idOportunidad),
      idOportunidad: Number(o.idOportunidad ?? o.id),
      idEmpresa: o.id_empresa ?? 0,
      idCreador: o.creador ? Number(o.creador.idUsuario) : 0,
      titulo: o.titulo ?? '',
      descripcion: o.descripcion ?? '',
      requisitos: o.requisitos ?? '',
      ubicacion: o.ubicacion ?? '',
      modalidad: o.modalidad ?? 'PRESENCIAL',
      tipo: o.tipo ?? 'PASANTIA',
      fechaPublicacion: o.fechaPublicacion ?? null,
      fechaCierre: o.fechaCierre ?? null,
      estado: this.mapEstadoFromBackend(o.estado),
      etiquetas: o.etiquetas ?? [],
      creador: o.creador,
      empresa: o.empresa
    };
  }

  /**
   * Lista todas las oportunidades del usuario actual
   * Usa oportunidadesPorEmpresa para usuarios EMPLEADOR con idEmpresa
   * Usa oportunidadesPorCreador para otros usuarios
   */
  list(): Observable<Opportunity[]> {
    const currentUser = this.authService.getCurrentUser();
    console.log('📋 OPPORTUNITY SERVICE LIST - Usuario actual:', currentUser);
    
    // Si es usuario EMPLEADOR con idEmpresa, buscar por empresa
    if (currentUser?.tipo === 'EMPLEADOR' && currentUser.idEmpresa) {
      console.log('✅ USANDO QUERY oportunidadesPorEmpresa con idEmpresa:', currentUser.idEmpresa);
      return this.apollo
        .watchQuery<{ oportunidadesPorEmpresa: any[] }>({
          query: this.GET_BY_EMPRESA,
          variables: { idEmpresa: currentUser.idEmpresa.toString() },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(
          map((result) => {
            console.log('📦 RESPUESTA oportunidadesPorEmpresa:', result.data);
            return (result.data?.oportunidadesPorEmpresa || []).map((o) => this.mapFromGql(o));
          }),
          catchError((error) => {
            console.error('❌ ERROR al listar oportunidades por empresa:', error);
            return throwError(() => error);
          })
        );
    }
    
    // Para otros usuarios, buscar por creadorId
    console.log('⚠️ USANDO oportunidadesPorCreador con creadorId:', this.currentUserId);
    return this.apollo
      .watchQuery<{ oportunidadesPorCreador: any[] }>({
        query: this.GET_BY_CREADOR,
        variables: { creadorId: this.currentUserId },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((result) => {
          console.log('📦 RESPUESTA oportunidadesPorCreador:', result.data);
          return (result.data?.oportunidadesPorCreador || []).map((o) => this.mapFromGql(o));
        }),
        catchError((error) => {
          console.error('❌ ERROR al listar oportunidades por creador:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Alias para list() - obtiene oportunidades del usuario actual
   */
  listMine(): Observable<Opportunity[]> {
    return this.list();
  }

  /**
   * Obtiene una oportunidad por ID
   */
  getById(id: number): Observable<Opportunity | undefined> {
    return this.apollo
      .query<{ oportunidad: any }>({
        query: this.GET_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) =>
          result.data?.oportunidad ? this.mapFromGql(result.data.oportunidad) : undefined
        ),
        catchError((error) => {
          console.error('Error al obtener oportunidad:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Crea una nueva oportunidad
   */
  create(data: OpportunityInput): Observable<Opportunity> {
    const input = {
      idCreador: String(this.currentUserId),
      titulo: data.titulo,
      descripcion: data.descripcion,
      requisitos: data.requisitos || '',
      ubicacion: data.ubicacion,
      modalidad: data.modalidad,
      tipo: data.tipo,
      fechaCierre: data.fechaCierre ? `${data.fechaCierre}T23:59:00` : null,
      estado: 'borrador',
    };

    return this.apollo
      .mutate<{ crearOportunidadDocente: any }>({
        mutation: this.CREAR_OPORTUNIDAD,
        variables: { input },
      })
      .pipe(
        map((result) => {
          if (!result.data?.crearOportunidadDocente) {
            throw new Error('No se recibió respuesta del servidor al crear la oportunidad');
          }
          return this.mapFromGql(result.data.crearOportunidadDocente);
        }),
        catchError((error) => {
          console.error('Error al crear oportunidad:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualiza una oportunidad existente
   */
  update(id: number, input: OpportunityInput): Observable<Opportunity> {
    const variables = {
      input: {
        idOportunidad: id,
        idEditor: String(this.currentUserId),
        titulo: input.titulo,
        descripcion: input.descripcion,
        requisitos: input.requisitos || '',
        ubicacion: input.ubicacion,
        modalidad: input.modalidad,
        tipo: input.tipo,
        fechaCierre: input.fechaCierre ? `${input.fechaCierre}T23:59:00` : null,
        estado: null, // No cambiar estado en edición regular
      },
    };

    return this.apollo
      .mutate<UpdateOpportunityResponse>({
        mutation: this.ACTUALIZAR_OPORTUNIDAD,
        variables,
      })
      .pipe(
        map((result) => {
          if (!result.data?.editarOportunidad) {
            throw new Error('No se recibió respuesta al actualizar la oportunidad');
          }
          return this.mapFromGql(result.data.editarOportunidad);
        }),
        catchError((error) => {
          console.error('Error al actualizar oportunidad:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cambia el estado de una oportunidad con auditoría automática
   * Estados: 'borrador', 'activo', 'pausada', 'cerrado'
   */
  changeState(id: number, newState: OpportunityState): Observable<Opportunity> {
    return this.apollo
      .mutate<ChangeStateResponse>({
        mutation: this.CAMBIAR_ESTADO,
        variables: {
          idOportunidad: id,
          nuevoEstado: newState,
          idActor: this.currentUserId.toString(),
        },
      })
      .pipe(
        map((result) => {
          if (!result.data?.cambiarEstadoOportunidad) {
            throw new Error('No se recibió respuesta al cambiar el estado');
          }
          return this.mapFromGql(result.data.cambiarEstadoOportunidad);
        }),
        catchError((error) => {
          console.error('Error al cambiar estado:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Elimina una oportunidad
   */
  delete(id: number): Observable<boolean> {
    return this.apollo
      .mutate<DeleteOpportunityResponse>({
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
        catchError((error) => {
          console.error('Error al eliminar oportunidad:', error);
          return throwError(() => error);
        })
      );
  }
}
