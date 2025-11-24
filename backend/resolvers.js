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
 * Mapeo de tipos entre GraphQL y Base de Datos
 */
const TIPO_GRAPHQL_TO_BD = {
  'EMPLEADOR': 'empresa',
  'ESTUDIANTE': 'alumno',
  'EGRESADO': 'egresado',
  'DOCENTE': 'profesor',
  'ADMIN': 'administrador'
};

const TIPO_BD_TO_GRAPHQL = {
  'empresa': 'EMPLEADOR',
  'alumno': 'ESTUDIANTE',
  'egresado': 'EGRESADO',
  'profesor': 'DOCENTE',
  'administrador': 'ADMIN'
};

/**
 * Convierte tipo de GraphQL a BD
 */
const tipoGraphQLToBD = (tipoGraphQL) => {
  const tipoBD = TIPO_GRAPHQL_TO_BD[tipoGraphQL];
  if (!tipoBD) {
    throw new GraphQLError(`Tipo de usuario no válido: ${tipoGraphQL}`, {
      extensions: { code: 'INVALID_USER_TYPE' }
    });
  }
  return tipoBD;
};

/**
 * Convierte tipo de BD a GraphQL
 */
const tipoBDToGraphQL = (tipoBD) => {
  return TIPO_BD_TO_GRAPHQL[tipoBD] || tipoBD;
};

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
          'SELECT id_usuario as id, email, nombre, apellido, rol_principal as tipo, telefono FROM public.usuarios WHERE id_usuario = $1',
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
        'SELECT id_usuario as id, email, nombre, apellido, rol_principal as tipo, telefono FROM public.usuarios WHERE id_usuario = $1',
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
    },

    /**
     * Buscar portafolios de candidatos con filtros
     */
    buscarPortafolios: async (_, { filtros }, context) => {
      const user = getUserFromContext(context);
      
      if (!user) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // user.tipo viene del token que se generó con el tipo GraphQL
      if (user.tipo !== 'EMPLEADOR' && user.tipo !== 'empresa') {
        throw new GraphQLError('Permisos insuficientes - Solo empleadores pueden buscar portafolios', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      console.log('Busqueda de portafolios con filtros:', filtros);

      // Paginacion: valores por defecto
      const pagina = filtros?.pagina || 1;
      const limite = filtros?.limite || 20;
      const offset = (pagina - 1) * limite;

      // Determinar qué tipos buscar (si no hay filtro, buscar en todos)
      const tiposPerfil = filtros?.tipoPerfil && filtros.tipoPerfil.length > 0 
        ? filtros.tipoPerfil 
        : ['PORTAFOLIO', 'ESTUDIANTE', 'EGRESADO'];

      console.log('Buscando en tipos:', tiposPerfil);

      // Construir queries UNION ALL según tipos seleccionados
      const unionQueries = [];
      let queryParams = [];
      let paramIndex = 1;

      // === QUERY PARA PORTAFOLIOS ===
      if (tiposPerfil.includes('PORTAFOLIO')) {
        let whereConditions = ['p.visibilidad = TRUE'];
        
        // Filtro por carrera
        if (filtros?.carrera) {
          whereConditions.push(`a.carrera ILIKE $${paramIndex}`);
          queryParams.push(`%${filtros.carrera}%`);
          paramIndex++;
        }

        // Filtro por habilidades
        if (filtros?.habilidades && filtros.habilidades.length > 0) {
          const skillsConditions = filtros.habilidades.map(skill => {
            const condition = `p.skills ILIKE $${paramIndex}`;
            queryParams.push(`%${skill}%`);
            paramIndex++;
            return condition;
          });
          whereConditions.push(`(${skillsConditions.join(' OR ')})`);
        }

        // Filtro por ubicacion
        if (filtros?.ubicacion) {
          whereConditions.push(`u.ubicacion ILIKE $${paramIndex}`);
          queryParams.push(`%${filtros.ubicacion}%`);
          paramIndex++;
        }

        const whereClause = whereConditions.length > 0 
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

        unionQueries.push(`
          SELECT 
            'PORTAFOLIO' as tipo,
            p.id_portafolio::text as id,
            p.id_usuario as "usuarioId",
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.ubicacion,
            a.carrera,
            p.descripcion,
            p.skills as habilidades,
            p.ultima_actualizacion as "fechaActualizacion",
            p.visibilidad
          FROM public.portafolio p
          INNER JOIN public.usuarios u ON p.id_usuario = u.id_usuario
          LEFT JOIN public.alumnos a ON p.id_usuario = a.id_usuario
          ${whereClause}
        `);
      }

      // === QUERY PARA ESTUDIANTES (sin portafolio) ===
      if (tiposPerfil.includes('ESTUDIANTE')) {
        let whereConditions = ["u.rol_principal = 'alumno'"];
        whereConditions.push('NOT EXISTS (SELECT 1 FROM public.portafolio p2 WHERE p2.id_usuario = u.id_usuario)');
        
        // Filtro por carrera
        if (filtros?.carrera) {
          whereConditions.push(`a.carrera ILIKE $${paramIndex}`);
          queryParams.push(`%${filtros.carrera}%`);
          paramIndex++;
        }

        // Filtro por ubicacion
        if (filtros?.ubicacion) {
          whereConditions.push(`u.ubicacion ILIKE $${paramIndex}`);
          queryParams.push(`%${filtros.ubicacion}%`);
          paramIndex++;
        }

        const whereClause = whereConditions.length > 0 
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

        unionQueries.push(`
          SELECT 
            'ESTUDIANTE' as tipo,
            u.id_usuario::text as id,
            u.id_usuario as "usuarioId",
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.ubicacion,
            a.carrera,
            NULL as descripcion,
            NULL as habilidades,
            CURRENT_TIMESTAMP as "fechaActualizacion",
            TRUE as visibilidad
          FROM public.usuarios u
          LEFT JOIN public.alumnos a ON u.id_usuario = a.id_usuario
          ${whereClause}
        `);
      }

      // === QUERY PARA EGRESADOS (sin portafolio) ===
      if (tiposPerfil.includes('EGRESADO')) {
        let whereConditions = ["u.rol_principal = 'egresado'"];
        whereConditions.push('NOT EXISTS (SELECT 1 FROM public.portafolio p2 WHERE p2.id_usuario = u.id_usuario)');
        
        // Filtro por ubicacion
        if (filtros?.ubicacion) {
          whereConditions.push(`u.ubicacion ILIKE $${paramIndex}`);
          queryParams.push(`%${filtros.ubicacion}%`);
          paramIndex++;
        }

        // NOTA: Egresados no tienen campo carrera, se omite ese filtro

        const whereClause = whereConditions.length > 0 
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

        unionQueries.push(`
          SELECT 
            'EGRESADO' as tipo,
            u.id_usuario::text as id,
            u.id_usuario as "usuarioId",
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.ubicacion,
            NULL as carrera,
            NULL as descripcion,
            NULL as habilidades,
            CURRENT_TIMESTAMP as "fechaActualizacion",
            TRUE as visibilidad
          FROM public.usuarios u
          INNER JOIN public.egresados eg ON u.id_usuario = eg.id_usuario
          ${whereClause}
        `);
      }

      // Combinar queries con UNION ALL
      const searchQuery = `
        ${unionQueries.join(' UNION ALL ')}
        ORDER BY "fechaActualizacion" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limite, offset);

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total FROM (
          ${unionQueries.join(' UNION ALL ')}
        ) as combined
      `;

      try {
        console.log('Query de búsqueda:', searchQuery);
        console.log('Parámetros:', queryParams);

        // Ejecutar ambos queries
        const [searchResult, countResult] = await Promise.all([
          query(searchQuery, queryParams),
          query(countQuery, queryParams.slice(0, -2)) // Sin limite y offset
        ]);

        const portafolios = searchResult.rows.map(row => ({
          ...row,
          habilidades: row.habilidades ? row.habilidades.split(',').map(s => s.trim()) : []
        }));

        const total = parseInt(countResult.rows[0].total);
        const totalPaginas = Math.ceil(total / limite);

        // Registrar auditoria de busqueda
        await query(`
          INSERT INTO public.auditoria (accion, detalle, fecha_evento, actor_id)
          VALUES ($1, $2, NOW(), $3)
        `, [
          'BUSQUEDA_PORTAFOLIOS',
          JSON.stringify({ filtros, resultados: total }),
          user.id
        ]);

        console.log(`Busqueda completada: ${portafolios.length} resultados de ${total} total`);

        return {
          portafolios,
          total,
          pagina,
          totalPaginas
        };

      } catch (error) {
        console.error('Error en busqueda de portafolios:', error);
        throw new GraphQLError('Error al buscar portafolios', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            details: error.message 
          }
        });
      }
    },

    /**
     * Verificar si un email está disponible (no está registrado)
     */
    verificarEmailDisponible: async (_, { email }) => {
      try {
        const result = await query(
          'SELECT id_usuario FROM public.usuarios WHERE LOWER(email) = LOWER($1)',
          [email]
        );
        
        // Retorna true si el email está disponible (NO existe)
        return result.rows.length === 0;
      } catch (error) {
        console.error('Error al verificar email:', error);
        // En caso de error, permitir que continúe (no bloquear el registro)
        return true;
      }
    },

    /**
     * Obtener catalogo de filtros disponibles
     */
    obtenerFiltros: async (_, __, context) => {
      console.log('=== OBTENER FILTROS ===');
      console.log('Context headers:', context.req?.headers?.authorization);
      
      const user = getUserFromContext(context);
      console.log('Usuario autenticado:', user ? user.email : 'null');
      
      if (!user) {
        console.error('Usuario no autenticado al obtener filtros');
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        console.log('Consultando carreras disponibles...');
        // Obtener carreras unicas
        const carrerasResult = await query(`
          SELECT DISTINCT carrera 
          FROM public.alumnos 
          WHERE carrera IS NOT NULL
          ORDER BY carrera
        `);

        console.log('Carreras encontradas:', carrerasResult.rows.length);
        
        console.log('Consultando ubicaciones disponibles...');
        // Obtener ubicaciones unicas (usando valores del enum de BD)
        const ubicacionesResult = await query(`
          SELECT DISTINCT ubicacion 
          FROM public.usuarios 
          WHERE ubicacion IS NOT NULL AND rol_principal IN ('alumno', 'egresado')
          ORDER BY ubicacion
        `);
        console.log('Ubicaciones encontradas:', ubicacionesResult.rows.length);

        const filtros = {
          carreras: carrerasResult.rows.map(r => r.carrera),
          niveles: ['ESTUDIANTE', 'EGRESADO'], // Hardcoded por ahora
          ubicaciones: ubicacionesResult.rows.map(r => r.ubicacion),
          disponibilidades: ['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'PRACTICAS'] // Hardcoded
        };
        
        console.log('Filtros construidos:', JSON.stringify(filtros));
        return filtros;

      } catch (error) {
        console.error('Error al obtener filtros:', error);
        console.error('Stack:', error.stack);
        throw new GraphQLError('Error al obtener filtros', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            details: error.message 
          }
        });
      }
    }
  },

  Mutation: {
    /**
     * Login de usuario
     */
    login: async (_, { email, password, tipoUsuario }) => {
      try {
        console.log(`Intento de login: ${email} como ${tipoUsuario}`);

        // Convertir el tipo de usuario de GraphQL al rol de la base de datos
        const rolBD = tipoGraphQLToBD(tipoUsuario);
        console.log(`Buscando usuario con rol: ${rolBD}`);

        // Buscar usuario por email Y por rol_principal
        const result = await query(
          `SELECT id_usuario as id, email, nombre, apellido, rol_principal as tipo, password, telefono, email_verificado 
           FROM public.usuarios 
           WHERE LOWER(email) = LOWER($1) AND rol_principal = $2`,
          [email, rolBD]
        );

        // Verificar si el usuario existe CON ESE ROL
        if (result.rows.length === 0) {
          console.log(`Usuario no encontrado con email ${email} y rol ${rolBD}`);
          throw new GraphQLError(`No existe una cuenta de ${tipoUsuario} con ese correo electrónico`, {
            extensions: { 
              code: 'USER_NOT_FOUND',
              http: { status: 404 }
            }
          });
        }

        const user = result.rows[0];
        const tipoGraphQL = tipoBDToGraphQL(user.tipo);

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

        // Ya no necesitamos verificar el tipo porque lo filtramos en la query
        console.log(`Usuario encontrado: ${user.email} (${tipoGraphQL})`);
        
        // Actualizar tipo para respuesta
        user.tipo = tipoGraphQL;

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
          console.log(`Contraseña incorrecta para: ${email}`);
          throw new GraphQLError('Credenciales inválidas', {
            extensions: { 
              code: 'INVALID_CREDENTIALS',
              http: { status: 401 }
            }
          });
        }

        // Crear registro en auditoría
        const auditoriaResult = await query(
          'INSERT INTO public.auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
          [user.id, 'LOGIN', `Login exitoso como ${user.tipo}`]
        );

        console.log(`Auditoría registrada: ${auditoriaResult.rows[0].id_auditoria}`);

        // Generar token JWT
        const token = generateToken({
          id: user.id, 
          email: user.email, 
          tipo: user.tipo 
        });

        // Generar refresh token
        const refreshToken = generateRefreshToken({
          id: user.id, 
          email: user.email, 
          tipo: user.tipo 
        });

        console.log(`Login exitoso para ${user.email}`);

        return {
          token,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            tipo: user.tipo,
            telefono: user.telefono
          }
        };

      } catch (error) {
        console.error('Error en login:', error);
        
        // Si es un GraphQLError, re-lanzarlo
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        // Para otros errores, lanzar error genérico
        throw new GraphQLError('Error al procesar el inicio de sesión. Usuario no existe.', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            details: error.message 
          }
        });
      }
    },

    /**
     * Registro de nuevo usuario
     */
    register: async (_, { input }) => {
      const rolBD = tipoGraphQLToBD(input.tipoUsuario);
      
      console.log(`Intento de registro: ${input.email} como ${input.tipoUsuario} (BD: ${rolBD})`);

      // IMPORTANTE: Verificar email ANTES de iniciar la transacción
      const existingUserCheck = await query(
        'SELECT id_usuario FROM public.usuarios WHERE LOWER(email) = LOWER($1)',
        [input.email]
      );

      if (existingUserCheck.rows.length > 0) {
        console.log(`Email ya registrado: ${input.email}`);
        throw new GraphQLError('Este correo electrónico ya está registrado. Por favor, utilice otro correo o inicie sesión si ya tiene una cuenta.', {
          extensions: { 
            code: 'EMAIL_ALREADY_EXISTS',
            http: { status: 409 }
          }
        });
      }

      const client = await getClient();
      
      try {
        // Iniciar transacción
        await client.query('BEGIN');

        // Generar hash de la contraseña
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Generar token de verificación único
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Crear registro en auditoría primero
        const auditoriaResult = await client.query(
          'INSERT INTO public.auditoria (accion, detalle, fecha_evento) VALUES ($1, $2, NOW()) RETURNING id_auditoria',
          ['REGISTRO_USUARIO', `Registro de nuevo usuario: ${input.email}`]
        );
        const idAuditoria = auditoriaResult.rows[0].id_auditoria;

        // Insertar usuario en la base de datos con email_verificado = FALSE
        // IMPORTANTE: Usar rolBD (enum de BD) en lugar de input.tipoUsuario (GraphQL)
        // CRÍTICO: Usar public.usuarios explícitamente para evitar ambigüedad con postgres.usuarios
        const userResult = await client.query(
          `INSERT INTO public.usuarios (email, password, nombre, apellido, rol_principal, telefono, completitud, email_verificado, token_verificacion, token_verificacion_expira, id_auditoria)
           VALUES ($1, $2, $3, $4, $5, $6, 30, FALSE, $7, $8, $9)
           RETURNING id_usuario as id, email, nombre, apellido, rol_principal as tipo, telefono, email_verificado`,
          [input.email, passwordHash, input.nombre, input.apellido, rolBD, input.telefono, verificationToken, tokenExpiry, idAuditoria]
        );

        const user = userResult.rows[0];
        user.tipo = tipoBDToGraphQL(user.tipo);
        
        console.log(`Usuario creado con ID: ${user.id}, tipo BD: ${rolBD}, tipo GraphQL: ${user.tipo}`);

        // Si es EMPLEADOR, insertar datos de la empresa Y relación empresa_usuario
        if (input.tipoUsuario === 'EMPLEADOR' && input.nombreEmpresa) {
          // Crear auditoría para empresa
          const auditoriaEmpresaResult = await client.query(
            'INSERT INTO public.auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
            [user.id, 'REGISTRO_EMPRESA', `Registro de empresa: ${input.nombreEmpresa}`]
          );
          const idAuditoriaEmpresa = auditoriaEmpresaResult.rows[0].id_auditoria;

          // Insertar empresa con todos los campos requeridos (public.empresas)
          const empresaResult = await client.query(
            `INSERT INTO public.empresas (nombre_empresa, ruc, razon_social, contacto, ubicacion, email, id_auditoria)
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
            'INSERT INTO public.auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
            [user.id, 'VINCULACION_EMPRESA_USUARIO', `Usuario ${user.id} vinculado a empresa ${idEmpresa}`]
          );
          const idAuditoriaRelacion = auditoriaRelacionResult.rows[0].id_auditoria;

          // Insertar relación en empresa_usuario (CRÍTICO: public.empresa_usuario)
          await client.query(
            `INSERT INTO public.empresa_usuario (id_empresa, id_usuario, rol_en_empresa, activo, fecha_alta, id_auditoria)
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
            'INSERT INTO public.auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
            [user.id, 'REGISTRO_ALUMNO', `Registro como alumno`]
          );
          const idAuditoriaAlumno = auditoriaAlumnoResult.rows[0].id_auditoria;

          await client.query(
            'INSERT INTO public.alumnos (id_usuario, id_auditoria) VALUES ($1, $2)',
            [user.id, idAuditoriaAlumno]
          );
          console.log(`Alumno registrado con ID usuario: ${user.id}`);
        }

        // Si es EGRESADO, insertar en tabla egresados
        if (input.tipoUsuario === 'EGRESADO') {
          // Crear auditoría para egresado
          const auditoriaEgresadoResult = await client.query(
            'INSERT INTO public.auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
            [user.id, 'REGISTRO_EGRESADO', `Registro como egresado`]
          );
          const idAuditoriaEgresado = auditoriaEgresadoResult.rows[0].id_auditoria;

          await client.query(
            'INSERT INTO public.egresados (id_usuario, id_auditoria) VALUES ($1, $2)',
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
        
        // Manejar errores específicos con mensajes amigables
        if (error.extensions?.code === 'EMAIL_ALREADY_EXISTS') {
          // Ya se lanzó el error correcto, solo re-lanzarlo
          throw error;
        }
        
        // Error de violación de foreign key
        if (error.code === '23503') {
          console.error('Error de integridad referencial:', error.detail);
          throw new GraphQLError('No se pudo crear la cuenta. Por favor, contacte con el administrador del sistema.', {
            extensions: { 
              code: 'DATABASE_ERROR',
              details: 'Error de integridad referencial en la base de datos'
            }
          });
        }
        
        // Error de violación de constraint único (email duplicado no detectado)
        if (error.code === '23505') {
          throw new GraphQLError('Este correo electrónico ya está registrado. Por favor, utilice otro correo.', {
            extensions: { 
              code: 'EMAIL_ALREADY_EXISTS',
              http: { status: 409 }
            }
          });
        }
        
        // Cualquier otro error de base de datos
        if (error.code) {
          console.error('Error de base de datos:', error.code, error.message);
          throw new GraphQLError('No se pudo crear la cuenta. Por favor, contacte con el administrador del sistema.', {
            extensions: { 
              code: 'DATABASE_ERROR',
              details: error.message
            }
          });
        }
        
        // Error genérico
        throw new GraphQLError('Ocurrió un error inesperado. Por favor, contacte con el administrador del sistema.', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            details: error.message
          }
        });
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
          `UPDATE public.usuarios 
           SET email_verificado = TRUE, 
               token_verificacion = NULL, 
               token_verificacion_expira = NULL 
           WHERE id_usuario = $1`,
          [user.id_usuario]
        );

        // Crear sesión
        await query(
          'INSERT INTO public.sesion (id_usuario, fecha_ini) VALUES ($1, NOW())',
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
          'SELECT id_usuario, email, nombre, email_verificado, token_verificacion FROM public.usuarios WHERE LOWER(email) = LOWER($1)',
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
          `UPDATE public.usuarios 
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
          'INSERT INTO public.auditoria (actor_id, accion, detalle, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING id_auditoria',
          [user.id, 'ACTUALIZAR_EMPRESA', `Actualizacion de datos de empresa ID: ${idEmpresa}`]
        );
        const idAuditoria = auditoriaResult.rows[0].id_auditoria;

        // Actualizar empresa
        await client.query(`
          UPDATE public.empresas 
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
