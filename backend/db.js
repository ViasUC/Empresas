import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

/**
 * Pool de conexiones a PostgreSQL
 * Conecta a la base de datos en Google Cloud
 */
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Configuración SSL requerida por Google Cloud
  ssl: {
    rejectUnauthorized: false // Para desarrollo, en producción usar certificado válido
  }
});

/**
 * Verificar conexión a la base de datos
 */
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexion a PostgreSQL exitosa');
    console.log(`Base de datos: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Probar una consulta simple
    const result = await client.query('SELECT NOW() as now');
    console.log(`Timestamp del servidor: ${result.rows[0].now}`);
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a PostgreSQL:', error.message);
    throw error;
  }
};

/**
 * Ejecutar query con manejo de errores
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', { text, error: error.message });
    throw error;
  }
};

/**
 * Obtener un cliente del pool para transacciones
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;
