import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  FiltroPostulacionInput,
  PostulacionesEmpresaResponse,
} from '../models/postulacion.model';
import { POSTULACIONES_EMPRESA } from '../graphql/postulaciones-empresa.query';

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
}
