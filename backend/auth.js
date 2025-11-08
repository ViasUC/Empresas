import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Genera un access token JWT
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    tipo: user.tipo,
    nombre: user.nombre,
    apellido: user.apellido
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Genera un refresh token JWT
 */
export const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

/**
 * Verifica y decodifica un token JWT
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

/**
 * Verifica un refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Refresh token inválido o expirado');
  }
};

/**
 * Obtiene el usuario desde el contexto de la petición
 */
export const getUserFromContext = (context) => {
  const token = context.token;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  getUserFromContext,
};
