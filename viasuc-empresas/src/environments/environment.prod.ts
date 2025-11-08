export const environment = {
  production: true,
  apiUrl: 'https://api.viasuc.com/graphql', // URL del servidor GraphQL en producción
  wsUrl: 'wss://api.viasuc.com/graphql', // WebSocket seguro para subscriptions
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