import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const userId = usuario.id || '';
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId.toString()
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
   * UC-EMP-017: Listar Solicitudes de Convenio
   */
  listarSolicitudes(): Observable<{ solicitudes: ConvenioOutput[], total: number }> {
    return this.http.get<{ solicitudes: ConvenioOutput[], total: number }>(
      `${this.apiUrl}/solicitudes`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * UC-EMP-016: Listar Convenios Vigentes
   */
  listarConveniosVigentes(): Observable<{ convenios: ConvenioOutput[], total: number }> {
    return this.http.get<{ convenios: ConvenioOutput[], total: number }>(
      `${this.apiUrl}/vigentes`,
      { headers: this.getHeaders() }
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
   * UC-EMP-016: Dar de Baja Convenio
   */
  darDeBajaConvenio(id: number, motivo: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${id}/baja`,
      { motivo },
      { headers: this.getHeaders() }
    );
  }
}
