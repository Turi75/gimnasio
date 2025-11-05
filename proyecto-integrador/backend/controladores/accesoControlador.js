import pool from '../config/db.js';

/**
 * @desc    Verifica el DNI para el acceso al gimnasio.
 * @route   POST /api/acceso/verificar
 */
export const verificarAccesoDNI = async (req, res) => {
  const { dni } = req.body;

  if (!dni) {
    return res.status(400).json({ msg: 'Se requiere el DNI.' });
  }

  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: usuarios } = await pool.query(
      'SELECT id, nombre FROM usuarios WHERE dni = $1',
      [dni]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        acceso: false,
        msg: 'DNI no encontrado en el sistema.'
      });
    }

    const cliente = usuarios[0];
    const hoy = new Date().toISOString().slice(0, 10);

    const { rows: suscripciones } = await pool.query(
      "SELECT * FROM suscripciones WHERE cliente_id = $1 AND estado_pago = 'pagado' AND fecha_fin >= $2",
      [cliente.id, hoy]
    );
    // --- FIN DE CORRECCIÓN ---

    if (suscripciones.length === 0) {
      return res.status(403).json({
        acceso: false,
        msg: `Acceso denegado. ${cliente.nombre}, tu suscripción no está activa o ha vencido.`
      });
    }

    return res.json({
      acceso: true,
      msg: `¡Bienvenido, ${cliente.nombre}! Acceso concedido.`
    });

  } catch (error) {
    console.error('Error en verificarAccesoDNI:', error);
    res.status(500).json({ msg: 'Error del servidor al verificar el acceso.' });
  }
};