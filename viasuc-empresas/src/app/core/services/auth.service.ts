import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface LoginCredentials {
  email: string;
  password: string;
  tipoUsuario: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO' | 'DOCENTE' | 'ADMIN';
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  tipo: string;
  token?: string;
}

export interface LoginResponse {
  login: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface RegistroData {
  tipoUsuario: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO' | 'DOCENTE';
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  ubicacion?: string;
  datosEmpresa?: {
    nombreEmpresa: string;
    ruc: string;
    razonSocial: string;
    contacto: string;
    ubicacion: string;
    email: string;
    rolEnEmpresa: string;
  };
}

export interface RegisterResponse {
  register: {
    user: User;
    token: string;
    refreshToken: string;
  };
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
    mutation Login($email: String!, $password: String!, $tipoUsuario: TipoUsuario!) {
      login(email: $email, password: $password, tipoUsuario: $tipoUsuario) {
        user {
          id
          email
          nombre
          apellido
          tipo
        }
        token
        refreshToken
      }
    }
  `;

  private REGISTER_MUTATION = gql`
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        user {
          id
          email
          nombre
          apellido
          tipo
        }
        token
        refreshToken
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

  constructor(private apollo: Apollo) {
    this.loadStoredUser();
  }

  /**
   * Inicia sesión con credenciales
   */
  login(credentials: LoginCredentials): Observable<User> {
    return this.apollo.mutate<LoginResponse>({
      mutation: this.LOGIN_MUTATION,
      variables: {
        email: credentials.email,
        password: credentials.password,
        tipoUsuario: credentials.tipoUsuario
      }
    }).pipe(
      map(result => {
        console.log('Login result from backend:', result);
        if (!result.data) {
          console.error('Errors from backend:', result.errors);
          if (result.errors && result.errors.length > 0) {
            throw result.errors[0];
          }
          throw new Error('No se recibió respuesta del servidor');
        }
        return result.data.login;
      }),
      tap(loginData => {
        const user = { ...loginData.user, token: loginData.token };
        this.setCurrentUser(user, loginData.token);
        this.storeAuthData(user, loginData.token, loginData.refreshToken);
      }),
      map(loginData => loginData.user)
    );
  }

  /**
   * Registra un nuevo usuario
   */
  register(datos: RegistroData): Observable<User> {
    return this.apollo.mutate<RegisterResponse>({
      mutation: this.REGISTER_MUTATION,
      variables: {
        input: {
          tipoUsuario: datos.tipoUsuario,
          nombre: datos.nombre,
          apellido: datos.apellido,
          email: datos.email,
          telefono: datos.telefono,
          password: datos.password,
          ubicacion: datos.ubicacion || 'Asunción',
          // Datos de empresa solo para empleadores
          ...(datos.tipoUsuario === 'EMPLEADOR' && datos.datosEmpresa ? {
            nombreEmpresa: datos.datosEmpresa.nombreEmpresa,
            ruc: datos.datosEmpresa.ruc,
            razonSocial: datos.datosEmpresa.razonSocial,
            contacto: datos.datosEmpresa.contacto,
            ubicacionEmpresa: datos.datosEmpresa.ubicacion,
            emailEmpresa: datos.datosEmpresa.email,
            rolEnEmpresa: datos.datosEmpresa.rolEnEmpresa
          } : {})
        }
      }
    }).pipe(
      map(result => {
        if (!result.data) {
          throw new Error('No se recibió respuesta del servidor');
        }
        return result.data.register;
      }),
      tap(registerData => {
        const user = { ...registerData.user, token: registerData.token };
        this.setCurrentUser(user, registerData.token);
        this.storeAuthData(user, registerData.token, registerData.refreshToken);
      }),
      map(registerData => registerData.user)
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
}
