import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { json } from 'express';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { testConnection } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

/**
 * Servidor Apollo GraphQL para VIASUC
 */
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    // Log del error en el servidor
    console.error('GraphQL Error:', {
      message: error.message,
      code: error.extensions && error.extensions.code,
      path: error.path,
    });

    // Retornar error formateado al cliente
    return {
      message: error.message,
      extensions: {
        code: (error.extensions && error.extensions.code) || 'INTERNAL_SERVER_ERROR',
        ...(error.extensions || {}),
      },
    };
  },
});

/**
 * Iniciar servidor
 */
async function startServer() {
  try {
    console.log('Iniciando servidor VIASUC GraphQL...\n');

    // Verificar conexión a la base de datos
    await testConnection();
    console.log('');

    // Crear app Express
    const app = express();

    // Configurar CORS para permitir peticiones desde Angular
    app.use(cors({
      origin: 'http://localhost:4200',
      credentials: true,
    }));

    // Iniciar servidor Apollo
    await server.start();

    // Aplicar middleware de Apollo con Express
    app.use(
      '/graphql',
      json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          // Extraer token del header Authorization
          const authHeader = req.headers.authorization || '';
          const token = authHeader.replace('Bearer ', '');
          
          return {
            token,
          };
        },
      })
    );

    // Ruta raiz redirige a /graphql
    app.get('/', (req, res) => {
      res.redirect('/graphql');
    });

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(`Servidor GraphQL listo en: http://localhost:${PORT}/graphql`);
      console.log(`CORS habilitado para: http://localhost:4200`);
      console.log(`\nEsperando peticiones...\n`);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();
