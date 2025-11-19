import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Query para obtener empresa
const GET_MI_EMPRESA = gql`
  query MiEmpresa($idUsuario: ID!) {
    miEmpresa(idUsuario: $idUsuario) {
      idEmpresa
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
        idEmpresa
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
  id?: string; // Mantener por compatibilidad
  idEmpresa: number;
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

  // Subject para notificar cambios en los datos de la empresa
  private empresaActualizadaSubject = new BehaviorSubject<Empresa | null>(null);
  public empresaActualizada$ = this.empresaActualizadaSubject.asObservable();

  constructor(private apollo: Apollo) {}

  /**
   * Obtener el idUsuario del usuario del localStorage
   */
  private getUserId(): number | null {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userId = user.idUsuario || user.id || null;
        console.log('>>> getUserId(): Usuario recuperado de localStorage:', user);
        console.log('>>> getUserId(): ID extraído:', userId);
        return userId;
      } catch (error) {
        console.error('>>> getUserId(): Error al parsear usuario de localStorage:', error);
        return null;
      }
    }
    console.warn('>>> getUserId(): No se encontró usuario en localStorage');
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
        map(result => result.data),
        tap((result: any) => {
          // Si la actualización fue exitosa, actualizar localStorage y notificar
          if (result?.actualizarEmpresa?.success && result.actualizarEmpresa.empresa) {
            this.actualizarEmpresaEnLocalStorage(result.actualizarEmpresa.empresa);
            this.empresaActualizadaSubject.next(result.actualizarEmpresa.empresa);
          }
        })
      );
  }

  /**
   * Actualiza los datos de la empresa en localStorage
   */
  private actualizarEmpresaEnLocalStorage(empresaActualizada: Empresa): void {
    try {
      const empresaStorage = localStorage.getItem('empresa');
      if (empresaStorage) {
        const empresaActual = JSON.parse(empresaStorage);
        
        // Mantener campos existentes (como id, rolEnEmpresa) y actualizar los demás
        const empresaMerged = {
          ...empresaActual,
          idEmpresa: empresaActualizada.idEmpresa || empresaActual.idEmpresa,
          nombreEmpresa: empresaActualizada.nombreEmpresa,
          ruc: empresaActualizada.ruc,
          razonSocial: empresaActualizada.razonSocial,
          contacto: empresaActualizada.contacto,
          ubicacion: empresaActualizada.ubicacion,
          email: empresaActualizada.email,
          descripcion: empresaActualizada.descripcion
        };
        
        localStorage.setItem('empresa', JSON.stringify(empresaMerged));
        console.log('Empresa actualizada en localStorage:', empresaMerged);
      } else {
        // Si no existe en localStorage, crearla
        localStorage.setItem('empresa', JSON.stringify(empresaActualizada));
        console.log('Empresa creada en localStorage:', empresaActualizada);
      }
    } catch (error) {
      console.error('Error al actualizar empresa en localStorage:', error);
    }
  }
}
