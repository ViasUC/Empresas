import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export enum RolEmpresa {
  ADMINISTRADOR = 'ADMINISTRADOR',
  GERENTE_RRHH = 'GERENTE_RRHH',
  AUXILIAR_RRHH = 'AUXILIAR_RRHH'
}

export interface UsuarioEmpresa {
  idEmpresa: number;
  idUsuario: string;
  usuario: {
    idUsuario: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  rolEnEmpresa: RolEmpresa;
  activo: boolean;
  fechaAlta: string;
}

export interface SolicitudAcceso {
  idEmpresa: number;
  idUsuario: string;
  usuario: {
    idUsuario: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  rolSolicitado: RolEmpresa;
  fechaSolicitud: string;
}

const LISTAR_USUARIOS_EMPRESA = gql`
  query ListarUsuariosEmpresa($idEmpresa: Int!) {
    listarUsuariosEmpresa(idEmpresa: $idEmpresa) {
      idEmpresa
      idUsuario
      usuario {
        idUsuario
        nombre
        apellido
        email
        telefono
      }
      rolEnEmpresa
      activo
      fechaAlta
    }
  }
`;

const LISTAR_SOLICITUDES_PENDIENTES = gql`
  query ListarSolicitudesPendientes($idEmpresa: Int!) {
    listarSolicitudesPendientes(idEmpresa: $idEmpresa) {
      idEmpresa
      idUsuario
      usuario {
        idUsuario
        nombre
        apellido
        email
        telefono
      }
      rolSolicitado
      fechaSolicitud
    }
  }
`;

const APROBAR_USUARIO_EMPRESA = gql`
  mutation AprobarUsuarioEmpresa($input: GestionarUsuarioEmpresaInput!) {
    aprobarUsuarioEmpresa(input: $input) {
      idEmpresa
      idUsuario
      rolEnEmpresa
      activo
    }
  }
`;

const RECHAZAR_USUARIO_EMPRESA = gql`
  mutation RechazarUsuarioEmpresa($input: GestionarUsuarioEmpresaInput!) {
    rechazarUsuarioEmpresa(input: $input)
  }
`;

const CAMBIAR_ROL_USUARIO = gql`
  mutation CambiarRolUsuarioEmpresa($input: CambiarRolUsuarioInput!) {
    cambiarRolUsuarioEmpresa(input: $input) {
      idEmpresa
      idUsuario
      rolEnEmpresa
      activo
    }
  }
`;

const DESACTIVAR_USUARIO = gql`
  mutation DesactivarUsuarioEmpresa($input: GestionarUsuarioEmpresaInput!) {
    desactivarUsuarioEmpresa(input: $input)
  }
`;

const OBTENER_ROL_USUARIO = gql`
  query ObtenerRolUsuario($idEmpresa: Int!, $idUsuario: ID!) {
    obtenerRolUsuario(idEmpresa: $idEmpresa, idUsuario: $idUsuario)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class UsuarioEmpresaService {

  constructor(private apollo: Apollo) { }

  listarUsuariosEmpresa(idEmpresa: number): Observable<UsuarioEmpresa[]> {
    return this.apollo.query<{ listarUsuariosEmpresa: UsuarioEmpresa[] }>({
      query: LISTAR_USUARIOS_EMPRESA,
      variables: { idEmpresa },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.listarUsuariosEmpresa)
    );
  }

  listarSolicitudesPendientes(idEmpresa: number): Observable<SolicitudAcceso[]> {
    return this.apollo.query<{ listarSolicitudesPendientes: any[] }>({
      query: LISTAR_SOLICITUDES_PENDIENTES,
      variables: { idEmpresa },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => {
        // El backend ya devuelve rolSolicitado y fechaSolicitud correctamente
        return result.data.listarSolicitudesPendientes;
      })
    );
  }

  aprobarUsuario(idEmpresa: number, idUsuario: string, idAdministrador: string): Observable<UsuarioEmpresa> {
    return this.apollo.mutate<{ aprobarUsuarioEmpresa: UsuarioEmpresa }>({
      mutation: APROBAR_USUARIO_EMPRESA,
      variables: {
        input: {
          idEmpresa,
          idUsuario,
          idAdministrador
        }
      }
    }).pipe(
      map(result => result.data!.aprobarUsuarioEmpresa)
    );
  }

  rechazarUsuario(idEmpresa: number, idUsuario: string, idAdministrador: string): Observable<boolean> {
    return this.apollo.mutate<{ rechazarUsuarioEmpresa: boolean }>({
      mutation: RECHAZAR_USUARIO_EMPRESA,
      variables: {
        input: {
          idEmpresa,
          idUsuario,
          idAdministrador
        }
      }
    }).pipe(
      map(result => result.data!.rechazarUsuarioEmpresa)
    );
  }

  cambiarRolUsuario(idEmpresa: number, idUsuario: string, nuevoRol: RolEmpresa, idAdministrador: string): Observable<UsuarioEmpresa> {
    return this.apollo.mutate<{ cambiarRolUsuarioEmpresa: UsuarioEmpresa }>({
      mutation: CAMBIAR_ROL_USUARIO,
      variables: {
        input: {
          idEmpresa,
          idUsuario,
          nuevoRol,
          idAdministrador
        }
      }
    }).pipe(
      map(result => result.data!.cambiarRolUsuarioEmpresa)
    );
  }

  desactivarUsuario(idEmpresa: number, idUsuario: string, idAdministrador: string): Observable<boolean> {
    return this.apollo.mutate<{ desactivarUsuarioEmpresa: boolean }>({
      mutation: DESACTIVAR_USUARIO,
      variables: {
        input: {
          idEmpresa,
          idUsuario,
          idAdministrador
        }
      }
    }).pipe(
      map(result => result.data!.desactivarUsuarioEmpresa)
    );
  }

  obtenerRolUsuario(idEmpresa: number, idUsuario: string): Observable<RolEmpresa | null> {
    return this.apollo.query<{ obtenerRolUsuario: RolEmpresa }>({
      query: OBTENER_ROL_USUARIO,
      variables: { idEmpresa, idUsuario },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.obtenerRolUsuario)
    );
  }

  getNombreRol(rol: RolEmpresa): string {
    switch (rol) {
      case RolEmpresa.ADMINISTRADOR:
        return 'Administrador';
      case RolEmpresa.GERENTE_RRHH:
        return 'Gerente de RRHH';
      case RolEmpresa.AUXILIAR_RRHH:
        return 'Auxiliar de RRHH';
      default:
        return rol;
    }
  }
}
