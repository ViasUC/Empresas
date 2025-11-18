export const environment = {
  production: true,
  // TEMPORAL: URL directa de AWS (Cloudflare cayó - 18/11/2025)
  apiUrl: 'http://viasuc-backend-env.eba-hehvbb97t.us-east-2.elasticbeanstalk.com/api/v1',
  graphqlUrl: 'http://viasuc-backend-env.eba-hehvbb97t.us-east-2.elasticbeanstalk.com/graphql',
  wsUrl: 'ws://viasuc-backend-env.eba-hehvbb97t.us-east-2.elasticbeanstalk.com/graphql',
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