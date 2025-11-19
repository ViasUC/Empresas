import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Query para obtener empresa
const GET_MI_EMPRESA = gql`
  query MiEmpresa($idUsuario: ID!) {
    miEmpresa(idUsuario: $idUsuario) {
      id
      nombreEmpresa
      ruc
      razonSocial
      contacto
      ubicacion
      email
      descripcion
    }
  }
`;

// Mutation para actualizar empresa
const ACTUALIZAR_EMPRESA = gql`
  mutation ActualizarEmpresa($input: ActualizarEmpresaInput!, $idUsuario: ID!) {
    actualizarEmpresa(input: $input, idUsuario: $idUsuario) {
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
        descripcion
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
  descripcion?: string;
}

export interface ActualizarEmpresaInput {
  nombreEmpresa: string;
  ruc: string;
  razonSocial: string;
  contacto?: string;
  ubicacion?: string;
  email?: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadorService {

  constructor(private apollo: Apollo) {}

  /**
   * Obtener el idUsuario del usuario del localStorage
   */
  private getUserId(): number | null {
    const userStr = localStorage.getItem('viasuc_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.idUsuario || user.id || null;
    }
    return null;
  }

  /**
   * Obtener datos de la empresa del usuario logueado
   */
  obtenerMiEmpresa(): Observable<Empresa | null> {
    const idUsuario = this.getUserId();
    console.log('>>> Frontend: Llamando miEmpresa con idUsuario:', idUsuario);
    return this.apollo
      .query<{ miEmpresa: Empresa }>({
        query: GET_MI_EMPRESA,
        variables: {
          idUsuario: idUsuario
        },
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
    const idUsuario = this.getUserId();
    console.log('>>> Frontend: Llamando actualizarEmpresa con idUsuario:', idUsuario);
    return this.apollo
      .mutate({
        mutation: ACTUALIZAR_EMPRESA,
        variables: { 
          input: input,
          idUsuario: idUsuario
        }
      })
      .pipe(
        map(result => result.data)
      );
  }
}
