import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Guard que protege rutas requiriendo autenticación
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Verificar que el token sigue siendo válido
    return authService.verifyToken().pipe(
      map(isValid => {
        if (isValid) {
          return true;
        }
        // Token inválido, redirigir al login
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      })
    );
  }

  // No autenticado, redirigir al login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/**
 * Guard que verifica si el usuario es empleador
 */
export const empleadorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isEmpleador()) {
    return true;
  }

  // No es empleador, redirigir
  router.navigate(['/login']);
  return false;
};
