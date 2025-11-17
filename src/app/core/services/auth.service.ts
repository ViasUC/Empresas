import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { User, RegistroData, LoginResponse, RegisterResponse } from '../models/auth.models';

export interface LoginCredentials {
  email: string;
  password: string;
  tipoUsuario: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO' | 'DOCENTE' | 'ADMIN';
}

/**
 * Servicio de autenticación para VIASUC
 * Gestiona login, logout y estado de sesión
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  // GraphQL Mutations
  private LOGIN_MUTATION = gql`
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        idUsuario
        nombre
        apellido
        rolPrincipal
      }
    }
  `;

  private REGISTER_MUTATION = gql`
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        token
        usuario {
          idUsuario
          nombre
          apellido
          email
          rol
        }
        success
        message
      }
    }
  `;

  private LOGOUT_MUTATION = gql`
    mutation Logout {
      logout {
        success
        message
      }
    }
  `;

  private VERIFY_TOKEN_QUERY = gql`
    query VerifyToken {
      verifyToken {
        valid
        user {
          id
          email
          nombre
          apellido
          tipo
        }
      }
    }
  `;

  private VERIFICAR_EMAIL_QUERY = gql`
    query VerificarEmailDisponible($email: String!) {
      verificarEmailDisponible(email: $email)
    }
  `;
  
  private LISTAR_EMPRESAS_QUERY = gql`
    query ListarEmpresas {
      listarEmpresas {
        idEmpresa
        nombreEmpresa
        ruc
        razonSocial
      }
    }
  `;

  constructor(private apollo: Apollo) {
    this.loadStoredUser();
  }

  /**
   * Mapea los roles del backend original a los tipos del frontend
   */
  private mapRolPrincipalToTipo(rolPrincipal: string): string {
    const roleMap: { [key: string]: string } = {
      'empresa': 'EMPLEADOR',
      'empleador': 'EMPLEADOR',
      'alumno': 'ESTUDIANTE',
      'estudiante': 'ESTUDIANTE',
      'egresado': 'EGRESADO',
      'profesor': 'DOCENTE',
      'investigador': 'DOCENTE',
      'docente': 'DOCENTE',
      'administrador': 'ADMIN',
      'admin': 'ADMIN'
    };
    return roleMap[rolPrincipal?.toLowerCase()] || rolPrincipal || 'EMPLEADOR';
  }

  /**
   * Inicia sesión con credenciales
   */
  login(credentials: LoginCredentials): Observable<User> {
    return this.apollo.mutate<LoginResponse>({
      mutation: this.LOGIN_MUTATION,
      variables: {
        input: {
          email: credentials.email,
          password: credentials.password
        }
      }
    }).pipe(
      map(result => {
        // Si hay errores, propagarlos
        if (result.errors && result.errors.length > 0) {
          const error = result.errors[0];
          // Propagar el error original del backend
          throw error;
        }
        
        if (!result.data) {
          throw new Error('No se recibió respuesta del servidor');
        }
        
        if (!result.data.login) {
          throw new Error('Credenciales inválidas o usuario no encontrado');
        }
        
        return result.data.login;
      }),
      tap(loginData => {
        // Backend original no devuelve token, adaptamos la respuesta
        // Mapear rolPrincipal del backend original a tipo del frontend
        const tipoMapeado = this.mapRolPrincipalToTipo(loginData.rolPrincipal);
        const user: User = { 
          id: parseInt(loginData.idUsuario),
          email: credentials.email,
          nombre: loginData.nombre || '',
          apellido: loginData.apellido || '',
          tipo: tipoMapeado
        };
        this.setCurrentUser(user, ''); // Sin token en backend original
        this.storeAuthData(user, '', '');
      }),
      map(loginData => {
        // Retornamos el user construido
        const tipoMapeado = this.mapRolPrincipalToTipo(loginData.rolPrincipal);
        const user: User = { 
          id: parseInt(loginData.idUsuario),
          email: credentials.email,
          nombre: loginData.nombre || '',
          apellido: loginData.apellido || '',
          tipo: tipoMapeado
        };
        return user;
      })
    );
  }

  /**
   * Registra un nuevo usuario
   */
  register(datos: RegistroData): Observable<User> {
    // Preparar el input base
    const input: any = {
      tipoUsuario: datos.tipoUsuario,
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      telefono: datos.telefono,
      password: datos.password,
      ubicacion: datos.ubicacion || 'Asunción'
    };
    
    // Si es EMPLEADOR, manejar datos de empresa
    if (datos.tipoUsuario === 'EMPLEADOR' && datos.datosEmpresa) {
      if (datos.datosEmpresa.unirseAExistente && datos.datosEmpresa.idEmpresa) {
        // Caso: Unirse a empresa existente
        input.idEmpresaExistente = datos.datosEmpresa.idEmpresa;
        input.rolSolicitado = datos.datosEmpresa.rolEnEmpresa; // GERENTE_RRHH o AUXILIAR_RRHH
      } else {
        // Caso: Crear empresa nueva
        input.nombreEmpresa = datos.datosEmpresa.nombreEmpresa;
        input.ruc = datos.datosEmpresa.ruc;
        input.razonSocial = datos.datosEmpresa.razonSocial;
        input.contacto = datos.datosEmpresa.contacto || '';
        input.ubicacionEmpresa = datos.datosEmpresa.ubicacion || 'Asunción';
        input.emailEmpresa = datos.datosEmpresa.email || '';
      }
    }
    
    return this.apollo.mutate<RegisterResponse>({
      mutation: this.REGISTER_MUTATION,
      variables: { input }
    }).pipe(
      map(result => {
        if (!result.data) {
          throw new Error('No se recibió respuesta del servidor');
        }
        return result.data.register;
      }),
      tap(registerData => {
        // Mapear la respuesta del backend al formato User del frontend
        const tipoMapeado = this.mapRolPrincipalToTipo(registerData.usuario.rol);
        const user: User = {
          id: parseInt(registerData.usuario.idUsuario),
          email: registerData.usuario.email,
          nombre: registerData.usuario.nombre,
          apellido: registerData.usuario.apellido,
          tipo: tipoMapeado,
          token: registerData.token
        };
        this.setCurrentUser(user, registerData.token);
        this.storeAuthData(user, registerData.token, ''); // Sin refreshToken por ahora
      }),
      map(registerData => {
        // Retornar el user construido
        const tipoMapeado = this.mapRolPrincipalToTipo(registerData.usuario.rol);
        return {
          id: parseInt(registerData.usuario.idUsuario),
          email: registerData.usuario.email,
          nombre: registerData.usuario.nombre,
          apellido: registerData.usuario.apellido,
          tipo: tipoMapeado,
          token: registerData.token
        };
      })
    );
  }

  /**
   * Verifica si un email está disponible para registro
   */
  verificarEmailDisponible(email: string): Observable<boolean> {
    return this.apollo.query<{ verificarEmailDisponible: boolean }>({
      query: this.VERIFICAR_EMAIL_QUERY,
      variables: { email },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.verificarEmailDisponible),
      catchError((error) => {
        console.error('Error al verificar email:', error);
        // En caso de error, permitir que continúe
        return of(true);
      })
    );
  }

  /**
   * Cierra sesión
   */
  logout(): Observable<boolean> {
    return this.apollo.mutate({
      mutation: this.LOGOUT_MUTATION
    }).pipe(
      tap(() => {
        this.clearAuthData();
      }),
      map(() => true)
    );
  }

  /**
   * Verifica si el token actual es válido
   */
  verifyToken(): Observable<boolean> {
    const token = this.getStoredToken();
    if (!token) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return this.apollo.query({
      query: this.VERIFY_TOKEN_QUERY,
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => {
        if (result.data?.verifyToken?.valid) {
          this.setCurrentUser(result.data.verifyToken.user, token);
          return true;
        }
        this.clearAuthData();
        return false;
      })
    );
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el token actual
   */
  getCurrentToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null && this.tokenSubject.value !== null;
  }

  /**
   * Verifica si el usuario es empleador
   */
  isEmpleador(): boolean {
    const user = this.getCurrentUser();
    return user?.tipo === 'EMPLEADOR';
  }

  /**
   * Establece el usuario actual y token
   */
  private setCurrentUser(user: User, token: string): void {
    this.currentUserSubject.next(user);
    this.tokenSubject.next(token);
  }

  /**
   * Almacena los datos de autenticación en localStorage
   */
  private storeAuthData(user: User, token: string, refreshToken: string): void {
    localStorage.setItem('viasuc_user', JSON.stringify(user));
    localStorage.setItem('viasuc_token', token);
    localStorage.setItem('viasuc_refresh_token', refreshToken);
  }

  /**
   * Carga el usuario almacenado en localStorage
   */
  private loadStoredUser(): void {
    try {
      const userJson = localStorage.getItem('viasuc_user');
      const token = localStorage.getItem('viasuc_token');
      
      if (userJson && token) {
        const user = JSON.parse(userJson);
        this.setCurrentUser(user, token);
      }
    } catch (error) {
      console.error('Error al cargar usuario almacenado:', error);
      this.clearAuthData();
    }
  }

  /**
   * Obtiene el token almacenado
   */
  private getStoredToken(): string | null {
    return localStorage.getItem('viasuc_token');
  }

  /**
   * Limpia todos los datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem('viasuc_user');
    localStorage.removeItem('viasuc_token');
    localStorage.removeItem('viasuc_refresh_token');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }
  
  /**
   * Lista todas las empresas disponibles para unirse
   */
  listarEmpresas(): Observable<any[]> {
    return this.apollo.query<any>({
      query: this.LISTAR_EMPRESAS_QUERY,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.listarEmpresas),
      catchError(error => {
        console.error('Error al listar empresas:', error);
        return of([]);
      })
    );
  }
}
