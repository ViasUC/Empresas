import { query } from './db.js';

async function inspectDatabase() {
  try {
    console.log('========================================');
    console.log('INSPECCION DE BASE DE DATOS');
    console.log('========================================\n');

    // Listar todas las tablas
    console.log('1. TABLAS EN LA BASE DE DATOS:');
    console.log('----------------------------');
    const tables = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    tables.rows.forEach(row => console.log(`  - ${row.tablename}`));

    // Describir tabla usuarios
    console.log('\n2. ESTRUCTURA TABLA: usuarios');
    console.log('----------------------------');
    const usuarios = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position
    `);
    if (usuarios.rows.length > 0) {
      usuarios.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  Tabla no existe');
    }

    // Describir tabla empresas (plural)
    console.log('\n3. ESTRUCTURA TABLA: empresas');
    console.log('----------------------------');
    const empresas = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'empresas'
      ORDER BY ordinal_position
    `);
    if (empresas.rows.length > 0) {
      empresas.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  Tabla no existe');
    }

    // Describir tabla empresa (singular)
    console.log('\n4. ESTRUCTURA TABLA: empresa');
    console.log('----------------------------');
    const empresa = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'empresa'
      ORDER BY ordinal_position
    `);
    if (empresa.rows.length > 0) {
      empresa.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  Tabla no existe');
    }

    // Describir tabla empresa_usuario
    console.log('\n5. ESTRUCTURA TABLA: empresa_usuario');
    console.log('----------------------------');
    const empresaUsuario = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'empresa_usuario'
      ORDER BY ordinal_position
    `);
    if (empresaUsuario.rows.length > 0) {
      empresaUsuario.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  Tabla no existe');
    }

    // Describir tabla auditoria
    console.log('\n6. ESTRUCTURA TABLA: auditoria');
    console.log('----------------------------');
    const auditoria = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'auditoria'
      ORDER BY ordinal_position
    `);
    if (auditoria.rows.length > 0) {
      auditoria.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  Tabla no existe');
    }

    // Describir tabla sesion
    console.log('\n7. ESTRUCTURA TABLA: sesion');
    console.log('----------------------------');
    const sesion = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sesion'
      ORDER BY ordinal_position
    `);
    if (sesion.rows.length > 0) {
      sesion.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  Tabla no existe');
    }

    console.log('\n========================================');
    console.log('INSPECCION COMPLETADA');
    console.log('========================================');

  } catch (error) {
    console.error('Error al inspeccionar BD:', error);
  } finally {
    process.exit(0);
  }
}

inspectDatabase();
