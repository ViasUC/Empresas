import jwt from 'jsonwebtoken';

/**
 * Script para inspeccionar un token JWT y ver su fecha de expiración
 * Uso: node inspect-token.js "TU_TOKEN_AQUI"
 */

const token = process.argv[2];

if (!token) {
  console.error('[ERROR] Debes proporcionar un token como argumento');
  console.log('Uso: node inspect-token.js "TU_TOKEN_AQUI"');
  process.exit(1);
}

try {
  // Decodificar sin verificar (solo para inspeccion)
  const decoded = jwt.decode(token);
  
  if (!decoded) {
    console.error('[ERROR] Token invalido o mal formado');
    process.exit(1);
  }

  console.log('\n=== INFORMACION DEL TOKEN JWT ===\n');
  console.log('Datos del usuario:');
  console.log('   - ID:', decoded.id);
  console.log('   - Email:', decoded.email);
  console.log('   - Tipo:', decoded.tipo);
  console.log('   - Nombre:', decoded.nombre, decoded.apellido);
  
  console.log('\nInformacion de tiempo:');
  
  // iat (issued at - cuando se creo)
  if (decoded.iat) {
    const issuedDate = new Date(decoded.iat * 1000);
    console.log('   - Creado el:', issuedDate.toLocaleString('es-PY', { 
      timeZone: 'America/Asuncion',
      dateStyle: 'full',
      timeStyle: 'long'
    }));
  }
  
  // exp (expiration - cuando expira)
  if (decoded.exp) {
    const expirationDate = new Date(decoded.exp * 1000);
    const now = new Date();
    const diffMs = expirationDate - now;
    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    const diffSeconds = Math.floor((diffMs / 1000) % 60);
    
    console.log('   - Expira el:', expirationDate.toLocaleString('es-PY', { 
      timeZone: 'America/Asuncion',
      dateStyle: 'full',
      timeStyle: 'long'
    }));
    
    if (diffMs > 0) {
      console.log('   - [OK] Tiempo restante:', `${diffMinutes} minuto(s) y ${diffSeconds} segundo(s)`);
      
      if (diffMinutes <= 2) {
        console.log('   - [CORRECTO] Token expira en 2 minutos o menos');
      } else {
        console.log('   - [ATENCION] Token expira en mas de 2 minutos');
      }
    } else {
      console.log('   - [EXPIRADO] TOKEN EXPIRADO hace', Math.abs(diffMinutes), 'minuto(s)');
    }
    
    // Calcular duracion total del token
    if (decoded.iat) {
      const durationMs = (decoded.exp - decoded.iat) * 1000;
      const durationMinutes = Math.floor(durationMs / 1000 / 60);
      console.log('   - Duracion total:', durationMinutes, 'minuto(s)');
    }
  }
  
  console.log('\n');
  
} catch (error) {
  console.error('[ERROR] Al decodificar el token:', error.message);
  process.exit(1);
}
