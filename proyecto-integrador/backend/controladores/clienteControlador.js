import pool from '../config/db.js';
import { format } from 'date-fns';

// --- Clases y Reservas ---
export const obtenerClasesDisponibles = async (req, res) => {
  try {
    // --- CORRECCIÓN POSTGRESQL ({ rows }) ---
    const { rows: clases } = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.fecha_hora, c.duracion_minutos, u.nombre AS nombre_profesor,
       (c.capacidad_maxima - (SELECT COUNT(*) FROM reservas r WHERE r.clase_id = c.id)) AS cupos_disponibles
       FROM clases c
       JOIN usuarios u ON c.profesor_id = u.id
       WHERE c.fecha_hora > NOW()
       ORDER BY c.fecha_hora ASC`
    );
    res.json(clases);
  } catch (error) { /* ... */ }
};

export const reservarClase = async (req, res) => {
  const { clase_id } = req.body;
  const cliente_id = req.usuario.id;
  if (!clase_id) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1, $2 y { rows }) ---
    const hoy = new Date().toISOString().slice(0, 10);
    const { rows: suscripcionActiva } = await pool.query(
      `SELECT p.max_clases_semana, p.max_clases_simultaneas, p.nombre as nombre_plan
       FROM suscripciones s
       JOIN planes p ON s.plan_id = p.id
       WHERE s.cliente_id = $1 AND s.estado_pago = 'pagado' AND s.fecha_fin >= $2`,
      [cliente_id, hoy]
    );
    if (suscripcionActiva.length === 0) { /* ... */ }
    const plan = suscripcionActiva[0];
    if (plan.max_clases_simultaneas !== null) {
      const { rows: reservasActuales } = await pool.query(
          'SELECT COUNT(DISTINCT r.clase_id) AS total FROM reservas r JOIN clases c ON r.clase_id = c.id WHERE r.cliente_id = $1 AND c.fecha_hora > NOW()',
          [cliente_id]
      );
      if (reservasActuales[0].total >= plan.max_clases_simultaneas) { /* ... */ }
    }
    if (plan.max_clases_semana !== null) {
        // --- CORRECCIÓN POSTGRESQL (Sintaxis de Fecha) ---
        const { rows: lunes } = await pool.query("SELECT CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1 || ' days')::interval AS lunes");
        const inicioSemana = lunes[0].lunes;
        const { rows: reservasSemana } = await pool.query(
            'SELECT COUNT(r.id) AS total FROM reservas r JOIN clases c ON r.clase_id = c.id WHERE r.cliente_id = $1 AND c.fecha_hora >= $2',
            [cliente_id, inicioSemana]
        );
        if (reservasSemana[0].total >= plan.max_clases_semana) { /* ... */ }
    }
    const { rows: clase } = await pool.query('SELECT capacidad_maxima FROM clases WHERE id = $1', [clase_id]);
    const { rows: cuposOcupados } = await pool.query('SELECT COUNT(*) AS total FROM reservas WHERE clase_id = $1', [clase_id]);
    if (cuposOcupados[0].total >= clase[0].capacidad_maxima) { /* ... */ }
    
    await pool.query(
      'INSERT INTO reservas (cliente_id, clase_id) VALUES ($1, $2)',
      [cliente_id, clase_id]
    );
    res.status(201).json({ msg: 'Reserva realizada exitosamente.' });
  } catch (error) {
    // --- CORRECCIÓN POSTGRESQL (Error Code) ---
    if (error.code === '23505') { // 23505 es unique_violation
      return res.status(409).json({ msg: 'Ya tienes una reserva para esta clase.' });
    }
    console.error('Error en reservarClase:', error);
    res.status(500).json({ msg: 'Error del servidor.' });
  }
};

export const misReservas = async (req, res) => {
  const cliente_id = req.usuario.id;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: reservas } = await pool.query(
      `SELECT r.id AS reserva_id, c.nombre AS clase_nombre, c.fecha_hora, u.nombre AS profesor_nombre, r.asistio
       FROM reservas r
       JOIN clases c ON r.clase_id = c.id
       JOIN usuarios u ON c.profesor_id = u.id
       WHERE r.cliente_id = $1
       ORDER BY c.fecha_hora DESC`,
      [cliente_id]
    );
    res.json(reservas);
  } catch (error) { /* ... */ }
};

export const cancelarReserva = async (req, res) => {
  const { id } = req.params;
  const cliente_id = req.usuario.id;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1, $2 y rowCount) ---
    const resultado = await pool.query(
      'DELETE FROM reservas WHERE id = $1 AND cliente_id = $2',
      [id, cliente_id]
    );
    if (resultado.rowCount === 0) { // Se usa rowCount
      return res.status(404).json({ msg: 'Reserva no encontrada o no te pertenece.' });
    }
    res.json({ msg: 'Reserva cancelada exitosamente.' });
  } catch (error) { /* ... */ }
};

// --- Rutinas y Consultas ---
export const misRutinas = async (req, res) => {
  const cliente_id = req.usuario.id;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: rutinas } = await pool.query(
      `SELECT r.titulo, r.descripcion, r.fecha_creacion, u.nombre AS nombre_profesor
       FROM rutinas r
       JOIN usuarios u ON r.profesor_id = u.id
       WHERE r.cliente_id = $1
       ORDER BY r.fecha_creacion DESC`,
      [cliente_id]
    );
    res.json(rutinas);
  } catch (error) { /* ... */ }
};

export const enviarConsulta = async (req, res) => {
  const { clase_id, mensaje } = req.body;
  const cliente_id = req.usuario.id;
  if (!clase_id || !mensaje) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: clase } = await pool.query('SELECT profesor_id FROM clases WHERE id = $1', [clase_id]);
    if (clase.length === 0) { /* ... */ }
    const profesor_id = clase[0].profesor_id;
    await pool.query(
      'INSERT INTO consultas (cliente_id, profesor_id, clase_id, mensaje) VALUES ($1, $2, $3, $4)',
      [cliente_id, profesor_id, clase_id, mensaje]
    );
    res.status(201).json({ msg: 'Consulta enviada exitosamente.' });
  } catch (error) { /* ... */ }
};

// --- Pagos y Planes ---
export const obtenerPlanes = async (req, res) => {
  try {
    // --- CORRECCIÓN POSTGRESQL ({ rows }) ---
    const { rows: planes } = await pool.query('SELECT * FROM planes ORDER BY precio ASC');
    res.json(planes);
  } catch (error) { /* ... */ }
};

export const miSuscripcion = async (req, res) => {
    const cliente_id = req.usuario.id;
    try {
      // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
      const { rows: suscripcion } = await pool.query(
        `SELECT s.id, s.fecha_inicio, s.fecha_fin, s.estado_pago, p.nombre AS nombre_plan
         FROM suscripciones s
         JOIN planes p ON s.plan_id = p.id
         WHERE s.cliente_id = $1
         ORDER BY s.fecha_fin DESC
         LIMIT 1`,
        [cliente_id]
      );
      if (suscripcion.length === 0) { /* ... */ }
      res.json(suscripcion[0]);
    } catch (error) { /* ... */ }
};

export const inscribirseAPlan = async (req, res) => {
  const { plan_id } = req.body;
  const cliente_id = req.usuario.id;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: plan } = await pool.query('SELECT * FROM planes WHERE id = $1', [plan_id]);
    if (plan.length === 0) { /* ... */ }
    const { rows: existente } = await pool.query(
      "SELECT * FROM suscripciones WHERE cliente_id = $1 AND estado_pago IN ('pagado', 'en_revision')",
      [cliente_id]
    );
    if (existente.length > 0) { /* ... */ }
    const fecha_inicio = format(new Date(), 'yyyy-MM-dd');
    const fecha_fin = format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd');
    
    // --- CORRECCIÓN POSTGRESQL (ON CONFLICT) ---
    // ON DUPLICATE KEY UPDATE -> ON CONFLICT (columna_unica) DO UPDATE SET...
    const sql = `
      INSERT INTO suscripciones (cliente_id, plan_id, fecha_inicio, fecha_fin, estado_pago) 
      VALUES ($1, $2, $3, $4, 'pendiente') 
      ON CONFLICT (cliente_id) 
      DO UPDATE SET 
        plan_id = $2, 
        fecha_inicio = $3, 
        fecha_fin = $4, 
        estado_pago = 'pendiente'
    `;
    await pool.query(sql, [cliente_id, plan_id, fecha_inicio, fecha_fin]);
    // --- FIN DE CORRECCIÓN ---
    res.status(201).json({ msg: 'Inscripción registrada. Realiza el pago y notifícalo.' });
  } catch (error) { /* ... */ }
};

export const notificarPago = async (req, res) => {
  const cliente_id = req.usuario.id;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: suscripcion } = await pool.query(
      "SELECT * FROM suscripciones WHERE cliente_id = $1 AND estado_pago = 'pendiente' ORDER BY fecha_inicio DESC LIMIT 1",
      [cliente_id]
    );
    if (suscripcion.length === 0) { /* ... */ }
    await pool.query(
      "UPDATE suscripciones SET estado_pago = 'en_revision' WHERE id = $1",
      [suscripcion[0].id]
    );
    res.json({ msg: 'Notificación enviada. Un administrador revisará tu pago.' });
  } catch (error) { /* ... */ }
};

export const misConsultas = async (req, res) => {
  const cliente_id = req.usuario.id;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: consultas } = await pool.query(
      `SELECT c.*, cl.nombre AS nombre_clase, u.nombre AS nombre_profesor
       FROM consultas c
       JOIN clases cl ON c.clase_id = c.id
       JOIN usuarios u ON c.profesor_id = u.id
       WHERE c.cliente_id = $1
       ORDER BY c.fecha_consulta DESC`,
      [cliente_id]
    );
    res.json(consultas);
  } catch (error) { /* ... */ }
};

export const obtenerClasesParaConsultar = async (req, res) => {
  const cliente_id = req.usuario.id;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: clases } = await pool.query(
      `SELECT DISTINCT c.id, c.nombre
       FROM clases c
       JOIN reservas r ON c.id = r.clase_id
       WHERE r.cliente_id = $1 AND c.fecha_hora > NOW()`,
      [cliente_id]
    );
    res.json(clases);
  } catch (error) { /* ... */ }
};