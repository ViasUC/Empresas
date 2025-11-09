import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Interceptor HTTP que agrega el token de autenticación a todas las peticiones
 * y maneja la expiración automática del token
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getCurrentToken();

  if (token) {
    // Clonar la petición y agregar el header de autorización
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si es error 401 o UNAUTHENTICATED, cerrar sesión automáticamente
        if (error.status === 401 || 
            error.error?.errors?.some((e: any) => e.extensions?.code === 'UNAUTHENTICATED')) {
          console.warn('Sesion expirada. Cerrando sesion automaticamente...');
          // Limpiar datos locales inmediatamente y redirigir (sin llamar al backend)
          localStorage.removeItem('viasuc_user');
          localStorage.removeItem('viasuc_token');
          localStorage.removeItem('viasuc_refresh_token');
          router.navigate(['/login']);
          alert('Tu sesion ha expirado. Por favor, inicia sesion nuevamente.');
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
