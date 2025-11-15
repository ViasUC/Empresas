export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/graphql', // URL del servidor GraphQL Spring Boot
  wsUrl: 'ws://localhost:8080/graphql', // WebSocket para subscriptions
  appName: 'VIASUC - Empresas',
  version: '1.0.0',
  
  // Configuración de base de datos (para referencia del backend)
  database: {
    host: '34.95.213.224',
    port: 5432,
    database: 'postgres',
    // Credenciales se manejan en el backend
  }
};