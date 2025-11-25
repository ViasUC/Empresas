import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Apollo, gql } from 'apollo-angular';
import { environment } from '../../../environments/environment';

export interface ConvenioInput {
  institucion: string;
  descripcion: string;
  fechaIni: string;
  fechaFin: string;
  responsables: string;
  duracion?: string;
  cantHoras?: string;
  objetivos?: string;
  beneficios?: string;
  requisitos?: string;
  documentoAdjunto?: string;
}

export interface ConvenioUpdateInput {
  responsables?: string;
  observaciones?: string;
}

export interface ConvenioOutput {
  idConven: number;
  institucion: string;
  descripcion: string;
  estado: string;
  fechaIni: string;
  fechaFin: string;
  responsables?: string;
  duracion?: string;
  cantHoras?: string;
  objetivos?: string;
  beneficios?: string;
  requisitos?: string;
  observaciones?: string;
  documentoAdjunto?: string;
  empresaId: number;
  nombreEmpresa: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConvenioService {
  
  private apiUrl = `${environment.apiUrl}/convenios`;

  // GraphQL Query para obtener convenios activos
  private GET_CONVENIOS_ACTIVOS = gql`
    query ObtenerConveniosActivos($idEmpresa: ID!) {
      obtenerConveniosActivos(idEmpresa: $idEmpresa) {
        idConven
        institucion
        descripcion
        estado
        fechaIni
        fechaFin
        responsables
        duracion
        cantHoras
        objetivos
        beneficios
        requisitos
        observaciones
        documentoAdjunto
        empresaId
      }
    }
  `;

  // GraphQL Query para obtener todas las solicitudes (incluye finalizadas)
  private GET_TODAS_SOLICITUDES = gql`
    query ObtenerTodasSolicitudes($idEmpresa: ID!) {
      obtenerTodasSolicitudes(idEmpresa: $idEmpresa) {
        idConven
        institucion
        descripcion
        estado
        fechaIni
        fechaFin
        responsables
        duracion
        cantHoras
        objetivos
        beneficios
        requisitos
        observaciones
        documentoAdjunto
        empresaId
        fechaCreacion
      }
    }
  `;

  // GraphQL Mutation para dar de baja un convenio
  private DAR_DE_BAJA_CONVENIO = gql`
    mutation DarDeBajaConvenio($idConvenio: Int!, $motivo: String!) {
      darDeBajaConvenio(idConvenio: $idConvenio, motivo: $motivo)
    }
  `;

  // GraphQL Mutation para actualizar un convenio
  private ACTUALIZAR_CONVENIO = gql`
    mutation ActualizarConvenio(
      $idConvenio: Int!
      $institucion: String!
      $descripcion: String!
      $fechaIni: String!
      $fechaFin: String!
      $responsables: String!
      $duracion: String
      $cantHoras: String
      $objetivos: String
      $beneficios: String
    ) {
      actualizarConvenio(
        idConvenio: $idConvenio
        institucion: $institucion
        descripcion: $descripcion
        fechaIni: $fechaIni
        fechaFin: $fechaFin
        responsables: $responsables
        duracion: $duracion
        cantHoras: $cantHoras
        objetivos: $objetivos
        beneficios: $beneficios
      ) {
        idConven
        institucion
        descripcion
        estado
        fechaIni
        fechaFin
        responsables
        duracion
        cantHoras
        objetivos
        beneficios
      }
    }
  `;

  // GraphQL Mutation para activar/desactivar convenio
  private TOGGLE_ACTIVO_CONVENIO = gql`
    mutation ToggleActivoConvenio($idConvenio: Int!, $activo: Boolean!) {
      toggleActivoConvenio(idConvenio: $idConvenio, activo: $activo)
    }
  `;

  // GraphQL Mutation para aprobar convenio
  private APROBAR_CONVENIO = gql`
    mutation AprobarConvenio($idConvenio: Int!) {
      aprobarConvenio(idConvenio: $idConvenio)
    }
  `;

  constructor(
    private http: HttpClient,
    private apollo: Apollo
  ) {}

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const userId = usuario.id || '';
    const idEmpresa = usuario.idEmpresa || '';
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId.toString(),
      'X-Empresa-Id': idEmpresa.toString()
    });
  }

  /**
   * UC-EMP-013: Solicitar Convenio
   */
  solicitarConvenio(input: ConvenioInput): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitar`, input, {
      headers: this.getHeaders()
    });
  }

  /**
   * UC-EMP-017: Listar Solicitudes de Convenio usando GraphQL
   */
  listarSolicitudes(): Observable<{ solicitudes: ConvenioOutput[], total: number }> {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idEmpresa = usuario.idEmpresa;
    
    if (!idEmpresa) {
      throw new Error('Usuario no pertenece a ninguna empresa');
    }

    return this.apollo.query<{ obtenerTodasSolicitudes: ConvenioOutput[] }>({
      query: this.GET_TODAS_SOLICITUDES,
      variables: { idEmpresa: idEmpresa.toString() },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => ({
        solicitudes: result.data.obtenerTodasSolicitudes || [],
        total: result.data.obtenerTodasSolicitudes?.length || 0
      }))
    );
  }

  /**
   * UC-EMP-016: Listar Convenios Vigentes usando GraphQL
   */
  listarConveniosVigentes(): Observable<{ convenios: ConvenioOutput[], total: number }> {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idEmpresa = usuario.idEmpresa;
    
    if (!idEmpresa) {
      throw new Error('Usuario no pertenece a ninguna empresa');
    }

    return this.apollo.query<{ obtenerConveniosActivos: ConvenioOutput[] }>({
      query: this.GET_CONVENIOS_ACTIVOS,
      variables: { idEmpresa: idEmpresa.toString() },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => ({
        convenios: result.data.obtenerConveniosActivos || [],
        total: result.data.obtenerConveniosActivos?.length || 0
      }))
    );
  }

  /**
   * Obtener detalle de un convenio
   */
  obtenerDetalleConvenio(id: number): Observable<ConvenioOutput> {
    return this.http.get<ConvenioOutput>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * UC-EMP-016: Actualizar Responsable
   */
  actualizarResponsable(id: number, input: ConvenioUpdateInput): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/responsable`,
      input,
      { headers: this.getHeaders() }
    );
  }

  /**
   * UC-EMP-016: Solicitar Renovación
   */
  solicitarRenovacion(id: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${id}/renovar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * UC-EMP-016: Dar de Baja Convenio usando GraphQL
   */
  darDeBajaConvenio(id: number, motivo: string): Observable<boolean> {
    return this.apollo.mutate<{ darDeBajaConvenio: boolean }>({
      mutation: this.DAR_DE_BAJA_CONVENIO,
      variables: {
        idConvenio: id,
        motivo: motivo
      }
    }).pipe(
      map(result => result.data?.darDeBajaConvenio || false)
    );
  }

  /**
   * Aprobar Convenio usando GraphQL
   */
  aprobarConvenio(id: number): Observable<any> {
    return this.apollo.mutate({
      mutation: this.APROBAR_CONVENIO,
      variables: {
        idConvenio: id
      }
    }).pipe(
      map(result => result.data)
    );
  }

  /**
   * Activar/Desactivar Convenio usando GraphQL
   */
  toggleActivoConvenio(id: number, activo: boolean): Observable<any> {
    return this.apollo.mutate({
      mutation: this.TOGGLE_ACTIVO_CONVENIO,
      variables: {
        idConvenio: id,
        activo: activo
      }
    }).pipe(
      map(result => result.data)
    );
  }

  /**
   * Actualizar datos completos de un convenio usando GraphQL
   */
  actualizarConvenio(datos: any): Observable<any> {
    return this.apollo.mutate({
      mutation: this.ACTUALIZAR_CONVENIO,
      variables: {
        idConvenio: datos.idConven,
        institucion: datos.institucion,
        descripcion: datos.descripcion,
        fechaIni: datos.fechaIni,
        fechaFin: datos.fechaFin,
        responsables: datos.responsables,
        duracion: datos.duracion || '',
        cantHoras: datos.cantHoras || '',
        objetivos: datos.objetivos || '',
        beneficios: datos.beneficios || ''
      }
    }).pipe(
      map(result => result.data)
    );
  }
}
