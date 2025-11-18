import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideApollo(() => {
      const httpClient = inject(HttpClient);
      const httpLink = new HttpLink(httpClient);
      const router = inject(Router);
      
      // Link de autenticación para Apollo
      const auth = setContext(() => {
        const token = localStorage.getItem('viasuc_token');
        console.log('[Apollo Auth] Token encontrado en localStorage:', token ? 'SÍ (longitud: ' + token.length + ')' : 'NO');
        if (token) {
          console.log('[Apollo Auth] Agregando header Authorization');
          return {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
        }
        console.warn('[Apollo Auth] No se encontró token, enviando sin autenticación');
        return {};
      });

      // Error handler para cerrar sesión automáticamente
      const errorLink = onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors) {
          for (const err of graphQLErrors) {
            console.error('[GraphQL Error]:', err.message, 'Code:', err.extensions?.['code']);
            
            // Si el error es de autenticación, cerrar sesión
            if (err.extensions?.['code'] === 'UNAUTHENTICATED' || 
                err.message.includes('Token inválido') ||
                err.message.includes('No autenticado')) {
              console.warn('[Apollo] Sesión expirada. Cerrando sesión automáticamente...');
              localStorage.removeItem('viasuc_user');
              localStorage.removeItem('viasuc_token');
              localStorage.removeItem('viasuc_refresh_token');
              router.navigate(['/login']);
              alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            }
          }
        }
        
        if (networkError) {
          console.error('[Network Error]:', networkError);
        }
      });

      // Crear el link HTTP
      const http = httpLink.create({
        uri: environment.graphqlUrl
      });

      return {
        link: ApolloLink.from([errorLink, auth, http]),
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all'
          },
          query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all'
          },
          mutate: {
            errorPolicy: 'all'
          }
        }
      };
    })
  ]
};
