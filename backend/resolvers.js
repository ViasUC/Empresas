import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query, getClient } from './db.js';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyToken,
  getUserFromContext 
} from './auth.js';
import { GraphQLError } from 'graphql';

/**
 * Resolvers de GraphQL para VIASUC
 */
export const resolvers = {
  Query: {
    /**
     * Verificar si el token actual es válido
     */
    verifyToken: async (_, __, context) => {
      try {
        const user = getUserFromContext(context);
        
        if (!user) {
          return {
            valid: false,
            user: null
          };
        }

        // Buscar usuario en la base de datos para asegurar que aún existe
        const result = await query(
          'SELECT id_usuario as id, email, nombre, apellido, rol_principal as tipo, telefono FROM usuarios WHERE id_usuario = $1',
          [user.id]
        );

        if (result.rows.length === 0) {
          return {
            valid: false,
            user: null
          };
        }

        return {
          valid: true,
          user: result.rows[0]
        };
      } catch (error) {
        console.error('Error al verificar token:', error);
        return {
          valid: false,
          user: null
        };
      }
    },

    /**
     * Obtener usuario actual
     */
    me: async (_, __, context) => {
      const user = getUserFromContext(context);
      
      if (!user) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const result = await query(
        'SELECT id_usuario as id, email, nombre, apellido, rol_principal as tipo, telefono FROM usuarios WHERE id_usuario = $1',
        [user.id]
      );

      if (result.rows.length === 0) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      return result.rows[0];
    },

    /**
     * Obtener empresa del usuario logueado
     */
    miEmpresa: async (_, __, context) => {
      const user = getUserFromContext(context);
      
      if (!user) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      console.log(`Obteniendo empresa para usuario ID: ${user.id}`);

      // Buscar empresa vinculada al usuario
      const empresaResult = await query(`
        SELECT 
          e.id_empresa as id,
          e.nombre_empresa as "nombreEmpresa",
          e.ruc,
          e.razon_social as "razonSocial",
          e.contacto,
          e.ubicacion,
          e.email
        FROM empresas e
        INNER JOIN empresa_usuario eu ON e.id_empresa = eu.id_empresa
        WHERE eu.id_usuario = $1 AND eu.activo = TRUE
        LIMIT 1
      `, [user.id]);

      if (empresaResult.rows.length === 0) {
        console.log(`No se encontro empresa para usuario ${user.id}`);
        return null;
      }

      const empresa = empresaResult.rows[0];
      console.log(`Empresa encontrada: ${empresa.nombreEmpresa} (ID: ${empresa.id})`);
      
      return empresa;
    }
  },

  Mutation: {
    /**
     * Login de usuario
     */
    login: async (_, { email, password, tipoUsuario }) => {
      try {
        console.log(`Intento de login: ${email} como ${tipoUsuario}`);

        // Buscar usuario por email en la tabla usuarios existente
        const result = await query(
          'SELECT id_usuario as id, email, nombre, apellido, rol_principal as tipo, password, telefono, email_verificado FROM public.usuarios WHERE LOWER(email) = LOWER($1)',
          [email]
        );

        // Verificar si el usuario existe
        if (result.rows.length === 0) {
          console.log(`Usuario no encontrado: ${email}`);
          throw new GraphQLError('Usuario no encontrado', {
            extensions: { 
              code: 'USER_NOT_FOUND',
              http: { status: 404 }
            }
          });
        }

        const user = result.rows[0];

        // Verificar si el email está verificado
        if (!user.email_verificado) {
          console.log(`Email no verificado: ${email}`);
          throw new GraphQLError('Debe verificar su correo electronico antes de iniciar sesion. Revise su bandeja de entrada.', {
            extensions: { 
              code: 'EMAIL_NOT_VERIFIED',
              email: email
            }
          });
        }

        // Verificar que el tipo de usuario coincida
        if (user.tipo !== tipoUsuario) {
          console.log(`Tipo de usuario incorrecto: esperado ${tipoUsuario}, encontrado ${user.tipo}`);
          throw new GraphQLError(`Este usuario no esta registrado como ${tipoUsuario}`, {
            extensions: { 
              code: 'INVALID_USER_TYPE',
              expectedType: tipoUsuario,
              actualType: user.tipo
            }
          });
        }

        // Verificar contraseña (usando el campo 'password' que ya contiene el hash)
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
          console.log(`Contrasena incorrecta para: ${email}`);
          throw new GraphQLError('Contrasena incorrecta', {
            extensions: { code: 'INVALID_CREDENTIALS' }
          });
        }

        // Crear registro en auditoría PRIMERO
        const auditoriaResult = await query(
          'INSERT INTO auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
          [user.id, 'LOGIN', `Login exitoso como ${user.tipo}`]
        );
        const idAuditoria = auditoriaResult.rows[0].id_auditoria;

        // Registrar sesión en la tabla sesion CON id_auditoria
        await query(
          'INSERT INTO sesion (id_usuario, fecha_ini, id_auditoria) VALUES ($1, NOW(), $2)',
          [user.id, idAuditoria]
        );

        // Generar tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        // Remover password del objeto de respuesta
        delete user.password;

        console.log(`Login exitoso: ${email} (${user.tipo})`);

        return {
          user,
          token,
          refreshToken
        };
      } catch (error) {
        console.error('Error en login:', error);
        throw error;
      }
    },

    /**
     * Registro de nuevo usuario
     */
    register: async (_, { input }) => {
      const client = await getClient();
      
      try {
        // Iniciar transacción
        await client.query('BEGIN');
        console.log(`Intento de registro: ${input.email} como ${input.tipoUsuario}`);

        // Verificar si el email ya existe
        const existingUser = await client.query(
          'SELECT id_usuario FROM usuarios WHERE LOWER(email) = LOWER($1)',
          [input.email]
        );

        if (existingUser.rows.length > 0) {
          console.log(`Email ya registrado: ${input.email}`);
          throw new GraphQLError('Este correo electronico ya esta registrado', {
            extensions: { 
              code: 'EMAIL_ALREADY_EXISTS',
              http: { status: 409 }
            }
          });
        }

        // Generar hash de la contraseña
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Generar token de verificación único
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Crear registro en auditoría primero
        const auditoriaResult = await client.query(
          'INSERT INTO auditoria (accion, detalle, fecha_evento) VALUES ($1, $2, NOW()) RETURNING id_auditoria',
          ['REGISTRO_USUARIO', `Registro de nuevo usuario: ${input.email}`]
        );
        const idAuditoria = auditoriaResult.rows[0].id_auditoria;

        // Insertar usuario en la base de datos con email_verificado = FALSE
        const userResult = await client.query(
          `INSERT INTO usuarios (email, password, nombre, apellido, rol_principal, telefono, completitud, email_verificado, token_verificacion, token_verificacion_expira, id_auditoria)
           VALUES ($1, $2, $3, $4, $5, $6, 30, FALSE, $7, $8, $9)
           RETURNING id_usuario as id, email, nombre, apellido, rol_principal as tipo, telefono, email_verificado`,
          [input.email, passwordHash, input.nombre, input.apellido, input.tipoUsuario, input.telefono, verificationToken, tokenExpiry, idAuditoria]
        );

        const user = userResult.rows[0];
        console.log(`Usuario creado con ID: ${user.id}`);

        // Si es EMPLEADOR, insertar datos de la empresa Y relación empresa_usuario
        if (input.tipoUsuario === 'EMPLEADOR' && input.nombreEmpresa) {
          // Crear auditoría para empresa
          const auditoriaEmpresaResult = await client.query(
            'INSERT INTO auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
            [user.id, 'REGISTRO_EMPRESA', `Registro de empresa: ${input.nombreEmpresa}`]
          );
          const idAuditoriaEmpresa = auditoriaEmpresaResult.rows[0].id_auditoria;

          // Insertar empresa con todos los campos requeridos
          const empresaResult = await client.query(
            `INSERT INTO empresas (nombre_empresa, ruc, razon_social, contacto, ubicacion, email, id_auditoria)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id_empresa`,
            [
              input.nombreEmpresa,
              input.ruc || '',
              input.razonSocial || input.nombreEmpresa,
              input.contacto || input.telefono,
              input.ubicacionEmpresa || input.ubicacion || 'Asunción',
              input.emailEmpresa || input.email,
              idAuditoriaEmpresa
            ]
          );
          const idEmpresa = empresaResult.rows[0].id_empresa;
          console.log(`Empresa creada con ID: ${idEmpresa}`);

          // Crear auditoría para relación empresa_usuario
          const auditoriaRelacionResult = await client.query(
            'INSERT INTO auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
            [user.id, 'VINCULACION_EMPRESA_USUARIO', `Usuario ${user.id} vinculado a empresa ${idEmpresa}`]
          );
          const idAuditoriaRelacion = auditoriaRelacionResult.rows[0].id_auditoria;

          // Insertar relación en empresa_usuario
          await client.query(
            `INSERT INTO empresa_usuario (id_empresa, id_usuario, rol_en_empresa, activo, fecha_alta, id_auditoria)
             VALUES ($1, $2, $3, TRUE, NOW(), $4)`,
            [
              idEmpresa,
              user.id,
              input.rolEnEmpresa || 'Administrador',
              idAuditoriaRelacion
            ]
          );
          console.log(`Relación empresa_usuario creada: Empresa ${idEmpresa} - Usuario ${user.id}`);
        }

        // Si es ESTUDIANTE, insertar en tabla alumnos
        if (input.tipoUsuario === 'ESTUDIANTE') {
          // Crear auditoría para alumno
          const auditoriaAlumnoResult = await client.query(
            'INSERT INTO auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
            [user.id, 'REGISTRO_ALUMNO', `Registro como alumno`]
          );
          const idAuditoriaAlumno = auditoriaAlumnoResult.rows[0].id_auditoria;

          await client.query(
            'INSERT INTO alumnos (id_usuario, id_auditoria) VALUES ($1, $2)',
            [user.id, idAuditoriaAlumno]
          );
          console.log(`Alumno registrado con ID usuario: ${user.id}`);
        }

        // Si es EGRESADO, insertar en tabla egresados
        if (input.tipoUsuario === 'EGRESADO') {
          // Crear auditoría para egresado
          const auditoriaEgresadoResult = await client.query(
            'INSERT INTO auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
            [user.id, 'REGISTRO_EGRESADO', `Registro como egresado`]
          );
          const idAuditoriaEgresado = auditoriaEgresadoResult.rows[0].id_auditoria;

          await client.query(
            'INSERT INTO egresados (id_usuario, id_auditoria) VALUES ($1, $2)',
            [user.id, idAuditoriaEgresado]
          );
          console.log(`Egresado registrado con ID usuario: ${user.id}`);
        }

        // Commit de la transacción
        await client.query('COMMIT');

        // SIMULAR envío de email de verificación (por ahora solo log)
        const verificationLink = `http://localhost:4200/verify-email?token=${verificationToken}`;
        console.log('\n==================================================');
        console.log('EMAIL DE VERIFICACION (SIMULADO)');
        console.log(`Para: ${input.email}`);
        console.log(`Asunto: Verifica tu cuenta en VIASUC`);
        console.log(`Link de verificación: ${verificationLink}`);
        console.log('==================================================\n');

        // NO generar tokens de sesión aquí - el usuario debe verificar email primero
        console.log(`Registro exitoso: ${input.email} (${input.tipoUsuario}) - Email pendiente de verificación`);

        return {
          user,
          token: '', // Token vacío por ahora
          refreshToken: '' // RefreshToken vacío por ahora
        };
      } catch (error) {
        // Rollback en caso de error
        await client.query('ROLLBACK');
        console.error('Error en registro (ROLLBACK ejecutado):', error);
        throw error;
      } finally {
        // Liberar el cliente
        client.release();
      }
    },

    /**
     * Cerrar sesión
     */
    logout: async (_, __, context) => {
      // En este caso simple, el logout se maneja en el cliente
      // Aquí podríamos invalidar el refresh token si lo guardamos en BD
      return {
        success: true,
        message: 'Sesión cerrada correctamente'
      };
    },

    /**
     * Verificar email con token
     */
    verifyEmail: async (_, { token }) => {
      try {
        console.log(`Intento de verificación de email con token: ${token.substring(0, 10)}...`);

        // Buscar usuario con este token que no haya expirado
        const result = await query(
          `SELECT id_usuario, email, nombre, apellido, rol_principal as tipo, telefono 
           FROM usuarios 
           WHERE token_verificacion = $1 
           AND token_verificacion_expira > NOW() 
           AND email_verificado = FALSE`,
          [token]
        );

        if (result.rows.length === 0) {
          throw new GraphQLError('Token de verificación inválido o expirado', {
            extensions: { code: 'INVALID_TOKEN' }
          });
        }

        const user = result.rows[0];

        // Actualizar usuario: marcar email como verificado y limpiar token
        await query(
          `UPDATE usuarios 
           SET email_verificado = TRUE, 
               token_verificacion = NULL, 
               token_verificacion_expira = NULL 
           WHERE id_usuario = $1`,
          [user.id_usuario]
        );

        // Crear sesión
        await query(
          'INSERT INTO sesion (id_usuario, fecha_ini) VALUES ($1, NOW())',
          [user.id_usuario]
        );

        // Generar tokens de autenticación
        const authUser = {
          id: user.id_usuario,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          tipo: user.tipo
        };

        const authToken = generateToken(authUser);
        const refreshToken = generateRefreshToken(authUser);

        console.log(`Email verificado exitosamente: ${user.email}`);

        return {
          success: true,
          message: 'Email verificado exitosamente. Ya puede iniciar sesión.',
          token: authToken
        };
      } catch (error) {
        console.error('Error en verificación de email:', error);
        throw error;
      }
    },

    /**
     * Reenviar email de verificación
     */
    resendVerificationEmail: async (_, { email }) => {
      try {
        console.log(`Solicitud de reenvío de email de verificación: ${email}`);

        // Buscar usuario
        const result = await query(
          'SELECT id_usuario, email, nombre, email_verificado, token_verificacion FROM usuarios WHERE LOWER(email) = LOWER($1)',
          [email]
        );

        if (result.rows.length === 0) {
          throw new GraphQLError('Usuario no encontrado', {
            extensions: { code: 'USER_NOT_FOUND' }
          });
        }

        const user = result.rows[0];

        // Si ya está verificado, no hacer nada
        if (user.email_verificado) {
          return {
            success: true,
            message: 'Este correo ya está verificado. Puede iniciar sesión.'
          };
        }

        // Generar nuevo token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Actualizar token
        await query(
          `UPDATE usuarios 
           SET token_verificacion = $1, 
               token_verificacion_expira = $2 
           WHERE id_usuario = $3`,
          [verificationToken, tokenExpiry, user.id_usuario]
        );

        // SIMULAR envío de email
        const verificationLink = `http://localhost:4200/verify-email?token=${verificationToken}`;
        console.log('\n==================================================');
        console.log('REENVIO DE EMAIL DE VERIFICACION (SIMULADO)');
        console.log(`Para: ${email}`);
        console.log(`Link de verificación: ${verificationLink}`);
        console.log('==================================================\n');

        return {
          success: true,
          message: 'Email de verificación reenviado. Revise su bandeja de entrada.'
        };
      } catch (error) {
        console.error('Error al reenviar email de verificación:', error);
        throw error;
      }
    },

    /**
     * Actualizar datos de empresa
     */
    actualizarEmpresa: async (_, { input }, context) => {
      const user = getUserFromContext(context);
      
      if (!user) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const client = await getClient();

      try {
        console.log(`Actualizando empresa para usuario ID: ${user.id}`);
        
        await client.query('BEGIN');

        // Buscar empresa del usuario
        const empresaResult = await client.query(`
          SELECT e.id_empresa
          FROM empresas e
          INNER JOIN empresa_usuario eu ON e.id_empresa = eu.id_empresa
          WHERE eu.id_usuario = $1 AND eu.activo = TRUE
          LIMIT 1
        `, [user.id]);

        if (empresaResult.rows.length === 0) {
          throw new GraphQLError('No se encontro empresa asociada al usuario', {
            extensions: { code: 'EMPRESA_NOT_FOUND' }
          });
        }

        const idEmpresa = empresaResult.rows[0].id_empresa;

        // Crear registro en auditoria
        const auditoriaResult = await client.query(
          'INSERT INTO auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
          [user.id, 'ACTUALIZAR_EMPRESA', `Actualizacion de datos de empresa ID: ${idEmpresa}`]
        );
        const idAuditoria = auditoriaResult.rows[0].id_auditoria;

        // Actualizar empresa
        await client.query(`
          UPDATE empresas 
          SET 
            nombre_empresa = $1,
            ruc = $2,
            razon_social = $3,
            contacto = $4,
            ubicacion = $5,
            email = $6,
            id_auditoria = $7
          WHERE id_empresa = $8
        `, [
          input.nombreEmpresa,
          input.ruc,
          input.razonSocial,
          input.contacto || null,
          input.ubicacion || null,
          input.email || null,
          idAuditoria,
          idEmpresa
        ]);

        await client.query('COMMIT');
        
        console.log(`Empresa ${idEmpresa} actualizada exitosamente. Auditoria ID: ${idAuditoria}`);

        // Obtener empresa actualizada
        const empresaActualizadaResult = await query(`
          SELECT 
            id_empresa as id,
            nombre_empresa as "nombreEmpresa",
            ruc,
            razon_social as "razonSocial",
            contacto,
            ubicacion,
            email
          FROM empresas
          WHERE id_empresa = $1
        `, [idEmpresa]);

        return {
          success: true,
          message: 'Empresa actualizada exitosamente',
          empresa: empresaActualizadaResult.rows[0]
        };

      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar empresa:', error);
        throw error;
      } finally {
        client.release();
      }
    }
  }
};

export default resolvers;
