import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// Render nos da la URL de la base de datos en esta variable de entorno
const connectionString = process.env.DATABASE_URL;

// --- CORRECCIÓN PARA DESPLIEGUE Y LOCAL ---
// Hacemos que la conexión funcione tanto en Render como en tu PC
const pool = new Pool({
  // Si 'connectionString' existe (en Render), la usa.
  // Si no (en local), usa tu .env de MySQL (¡Ups! Debemos usar PG local)
  // Para simplificar, usaremos la de Render.
  connectionString: connectionString,
  // Esta configuración es OBLIGATORIA para que Render se conecte
  ssl: connectionString ? { rejectUnauthorized: false } : false
});

// Función para probar la conexión
export const probarConexion = async () => {
  if (!connectionString) {
    console.warn("ADVERTENCIA: No se encontró DATABASE_URL. El backend fallará en Render.");
    console.warn("Continuando con la configuración local (si está disponible)...");
    // Aquí fallará si no tienes PostgreSQL local, pero funcionará en Render
  }
  try {
    const time = await pool.query('SELECT NOW()');
    console.log('🚀 Base de Datos (PostgreSQL) conectada exitosamente:', time.rows[0].now);
  } catch (error) {
    console.error('Error al conectar con la Base de Datos (PostgreSQL):', error.message);
  }
};

export default pool;