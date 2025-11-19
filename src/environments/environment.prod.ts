export const environment = {
  production: true,
  apiUrl: 'https://api.viasuc.com/api/v1', // URL del servidor REST en producción
  graphqlUrl: 'https://api.viasuc.com/graphql', // URL del servidor GraphQL en producción
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



/*

#comentar todo
export const environment = {
  production: true,
  // Backend desplegado en AWS (Cloudflare caído - 18/11/2025)
  apiUrl: 'http://viasuc-backend-env.eba-hehvb97f.us-east-2.elasticbeanstalk.com/api/v1',
  graphqlUrl: 'http://viasuc-backend-env.eba-hehvb97f.us-east-2.elasticbeanstalk.com/graphql',
  wsUrl: 'ws://viasuc-backend-env.eba-hehvb97f.us-east-2.elasticbeanstalk.com/graphql',
  appName: 'VIASUC - Empresas',
  version: '1.0.0',
  
  // Configuración de base de datos (para referencia del backend)
  database: {
    host: '34.95.213.224',
    port: 5432,
    database: 'postgres',
    // Credenciales se manejan en el backend
  }
};*/


