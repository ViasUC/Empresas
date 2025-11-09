import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Query para obtener empresa
const GET_MI_EMPRESA = gql`
  query MiEmpresa {
    miEmpresa {
      id
      nombreEmpresa
      ruc
      razonSocial
      contacto
      ubicacion
      email
      sector
      tamano
      descripcion
      sitioWeb
      linkedIn
      ciudad
      direccion
    }
  }
`;

// Mutation para actualizar empresa
const ACTUALIZAR_EMPRESA = gql`
  mutation ActualizarEmpresa($input: ActualizarEmpresaInput!) {
    actualizarEmpresa(input: $input) {
      success
      message
      empresa {
        id
        nombreEmpresa
        ruc
        razonSocial
        contacto
        ubicacion
        email
        sector
        tamano
        descripcion
        sitioWeb
        linkedIn
        ciudad
        direccion
      }
    }
  }
`;

export interface Empresa {
  id: string;
  nombreEmpresa: string;
  ruc: string;
  razonSocial: string;
  contacto?: string;
  ubicacion?: string;
  email?: string;
  sector?: string;
  tamano?: string;
  descripcion?: string;
  sitioWeb?: string;
  linkedIn?: string;
  ciudad?: string;
  direccion?: string;
}

export interface ActualizarEmpresaInput {
  nombreEmpresa: string;
  ruc: string;
  razonSocial: string;
  contacto?: string;
  ubicacion?: string;
  email?: string;
  sector?: string;
  tamano?: string;
  descripcion?: string;
  sitioWeb?: string;
  linkedIn?: string;
  ciudad?: string;
  direccion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadorService {

  constructor(private apollo: Apollo) {}

  /**
   * Obtener datos de la empresa del usuario logueado
   */
  obtenerMiEmpresa(): Observable<Empresa | null> {
    return this.apollo
      .query<{ miEmpresa: Empresa }>({
        query: GET_MI_EMPRESA,
        fetchPolicy: 'network-only' // Siempre obtener datos frescos
      })
      .pipe(
        map(result => result.data.miEmpresa)
      );
  }

  /**
   * Actualizar datos de la empresa
   */
  actualizarEmpresa(input: ActualizarEmpresaInput): Observable<any> {
    return this.apollo
      .mutate({
        mutation: ACTUALIZAR_EMPRESA,
        variables: { input }
      })
      .pipe(
        map(result => result.data)
      );
  }
}
