import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  FiltroPostulacionInput,
  PostulacionesEmpresaResponse,
} from '../models/postulacion.model';
import { HistorialPostulacion, PostulacionEstado } from '../models/historial-postulacion.model';
import { POSTULACIONES_EMPRESA } from '../graphql/postulaciones-empresa.query';
import { HISTORIAL_POSTULACION, ACTUALIZAR_ESTADO_POSTULACION } from '../graphql/postulacion-mutations.graphql';

export interface PostulacionesEmpresaVars {
  idOfertante: string;
  page: number;
  size: number;
  sort?: string | null;
  filtro?: FiltroPostulacionInput | null;
}

@Injectable({
  providedIn: 'root',
})
export class PostulacionesService {
  constructor(private apollo: Apollo) {}

  getPostulacionesEmpresa(
    vars: PostulacionesEmpresaVars
  ): Observable<PostulacionesEmpresaResponse> {
    return this.apollo
      .watchQuery<PostulacionesEmpresaResponse, PostulacionesEmpresaVars>({
        query: POSTULACIONES_EMPRESA,
        variables: {
          ...vars,
          filtro: vars.filtro ?? null,
          sort: vars.sort ?? 'fechaPostulacion,desc',
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map(result => result.data)
      );
  }

  getHistorialPostulacion(idPostulacion: number): Observable<HistorialPostulacion[]> {
    return this.apollo
      .query<{ historialPostulacion: HistorialPostulacion[] }>({
        query: HISTORIAL_POSTULACION,
        variables: { idPostulacion: idPostulacion.toString() },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map(result => result.data.historialPostulacion)
      );
  }

  actualizarEstadoPostulacion(
    idPostulacion: number,
    estado: PostulacionEstado,
    motivo: string | null,
    idActor: number
  ): Observable<any> {
    return this.apollo
      .mutate({
        mutation: ACTUALIZAR_ESTADO_POSTULACION,
        variables: {
          idPostulacion: idPostulacion.toString(),
          estado,
          motivo,
          idActor: idActor.toString(),
        },
      })
      .pipe(
        map(result => result.data)
      );
  }
}
