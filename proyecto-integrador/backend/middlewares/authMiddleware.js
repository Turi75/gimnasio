import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import dotenv from 'dotenv';

// Importamos y cargamos dotenv aquí mismo
// para asegurar que process.env.JWT_SECRETO esté disponible.
dotenv.config();

/**
 * Middleware para verificar el Token (JWT)
 */
const verificarToken = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const decodificado = jwt.verify(token, process.env.JWT_SECRETO);

      const { rows } = await pool.query(
        'SELECT u.id, u.nombre, u.email, u.dni, r.nombre AS rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1',
        [decodificado.id]
      );
      // --- FIN DE CORRECCIÓN ---

      if (rows.length === 0) {
        return res.status(404).json({ msg: 'Usuario no encontrado.' });
      }

      req.usuario = rows[0]; // Adjuntamos el usuario (con su rol) a la petición
      return next();

    } catch (error) {
      console.error('Error de autenticación:', error.message);
      return res.status(401).json({ msg: 'Token no válido o expirado.' });
    }
  }

  if (!token) {
    return res.status(401).json({ msg: 'No se proporcionó un token. Acceso denegado.' });
  }
};

export default verificarToken;