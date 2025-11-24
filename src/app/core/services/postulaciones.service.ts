import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  FiltroPostulacionInput,
  PostulacionesEmpresaResponse,
  Postulacion,
} from '../models/postulacion.model';
import { POSTULACIONES_EMPRESA } from '../graphql/postulaciones-empresa.query';

export interface PostulacionesEmpresaVars {
  idOfertante: string;
  page: number;
  size: number;
  sort?: string | null;
  filtro?: FiltroPostulacionInput | null;
}

const ACTUALIZAR_ESTADO_POSTULACION = gql`
  mutation ActualizarEstadoPostulacion(
    $idPostulacion: ID!
    $estado: PostulacionEstado!
    $motivo: String
    $idActor: ID
  ) {
    actualizarEstadoPostulacion(
      idPostulacion: $idPostulacion
      estado: $estado
      motivo: $motivo
      idActor: $idActor
    ) {
      idPostulacion
      estado
      fechaPostulacion
    }
  }
`;

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

  actualizarEstado(
    idPostulacion: number,
    estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA',
    motivo: string | null,
    idActor: number
  ): Observable<Postulacion> {
    return this.apollo
      .mutate<{ actualizarEstadoPostulacion: Postulacion }>({
        mutation: ACTUALIZAR_ESTADO_POSTULACION,
        variables: {
          idPostulacion: idPostulacion.toString(),
          estado,
          motivo,
          idActor: idActor.toString(),
        },
      })
      .pipe(
        map(result => {
          if (!result.data?.actualizarEstadoPostulacion) {
            throw new Error('No se recibió respuesta al actualizar el estado');
          }
          return result.data.actualizarEstadoPostulacion;
        })
      );
  }
}
