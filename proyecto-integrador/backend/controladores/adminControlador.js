import pool from '../config/db.js';

export const crearClase = async (req, res) => {
  const { nombre, descripcion, profesor_id, fecha_hora, duracion_minutos, capacidad_maxima } = req.body;
  if (!nombre || !profesor_id || !fecha_hora || !capacidad_maxima) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1, { rows }, RETURNING id) ---
    const { rows: profesor } = await pool.query(
      "SELECT r.nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1 AND r.nombre = 'profesor'", 
      [profesor_id]
    );
    if (profesor.length === 0) { /* ... */ }
    
    const sql = 'INSERT INTO clases (nombre, descripcion, profesor_id, fecha_hora, duracion_minutos, capacidad_maxima) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
    const valores = [nombre, descripcion, profesor_id, fecha_hora, duracion_minutos || 60, capacidad_maxima];
    
    const resultado = await pool.query(sql, valores);
    res.status(201).json({ msg: 'Clase creada exitosamente.', id: resultado.rows[0].id });
    // --- FIN DE CORRECCIÓN ---
  } catch (error) {
    console.error('Error en crearClase:', error);
    res.status(500).json({ msg: 'Error del servidor.' });
  }
};

export const obtenerTodasLasClases = async (req, res) => {
  try {
    // --- CORRECCIÓN POSTGRESQL ({ rows }) ---
    const { rows: clases } = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.profesor_id, c.fecha_hora, c.duracion_minutos, c.capacidad_maxima, u.nombre AS nombre_profesor 
       FROM clases c
       LEFT JOIN usuarios u ON c.profesor_id = u.id
       ORDER BY c.fecha_hora DESC`
    );
    res.json(clases);
  } catch (error) { /* ... */ }
};

export const eliminarClase = async (req, res) => {
  const { id } = req.params;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y rowCount) ---
    const resultado = await pool.query('DELETE FROM clases WHERE id = $1', [id]);
    if (resultado.rowCount === 0) { // Se usa rowCount
      return res.status(404).json({ msg: 'Clase no encontrada.' });
    }
    res.json({ msg: 'Clase eliminada exitosamente.' });
  } catch (error) { /* ... */ }
};

export const obtenerSuscripciones = async (req, res) => {
  try {
    // --- CORRECCIÓN POSTGRESQL ({ rows } y ORDER BY) ---
    // FIELD() no existe en Postgres, usamos un simple ORDER BY
    const { rows: suscripciones } = await pool.query(
      `SELECT s.id, s.fecha_inicio, s.fecha_fin, s.estado_pago, 
              u.nombre AS nombre_cliente, u.email AS email_cliente, 
              p.nombre AS nombre_plan
       FROM suscripciones s
       JOIN usuarios u ON s.cliente_id = u.id
       JOIN planes p ON s.plan_id = p.id
       ORDER BY s.estado_pago, s.fecha_inicio DESC` // FIELD() reemplazado
    );
    res.json(suscripciones);
  } catch (error) { /* ... */ }
};

export const actualizarEstadoSuscripcion = async (req, res) => {
  const { id } = req.params;
  const { nuevo_estado } = req.body;
  if (!nuevo_estado || !['pagado', 'vencido'].includes(nuevo_estado)) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1, $2 y rowCount) ---
    const resultado = await pool.query(
      'UPDATE suscripciones SET estado_pago = $1 WHERE id = $2',
      [nuevo_estado, id]
    );
    if (resultado.rowCount === 0) { // Se usa rowCount
      return res.status(404).json({ msg: 'Suscripción no encontrada.' });
    }
    res.json({ msg: 'Estado de la suscripción actualizado.' });
  } catch (error) { /* ... */ }
};

export const obtenerTodosLosUsuarios = async (req, res) => {
  const rolPeticionario = req.usuario.rol;
  let sql;
  if (rolPeticionario === 'jefe') {
    sql = 'SELECT u.id, u.nombre, u.email, u.dni, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id';
  } else {
    sql = 'SELECT u.id, u.nombre, u.email, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id';
  }
  try {
    // --- CORRECCIÓN POSTGRESQL ({ rows }) ---
    const { rows: usuarios } = await pool.query(sql);
    res.json(usuarios);
  } catch (error) { /* ... */ }
};

export const obtenerTodosLosProfesores = async (req, res) => {
    try {
      // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
      const { rows: rol } = await pool.query("SELECT id FROM roles WHERE nombre = 'profesor'");
      if (rol.length === 0) { /* ... */ }
      const { rows: profesores } = await pool.query(
            "SELECT id, nombre FROM usuarios WHERE rol_id = $1",
            [rol[0].id]
      );
      res.json(profesores);
    } catch (error) { /* ... */ }
};

export const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  const id_peticionario = req.usuario.id;
  const rol_peticionario = req.usuario.rol;
  if (parseInt(id) === id_peticionario) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: usuarios } = await pool.query(
        'SELECT r.nombre AS rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1', 
        [id]
    );
    if (usuarios.length === 0) { /* ... */ }
    if (usuarios[0].rol === 'jefe' && rol_peticionario !== 'jefe') { /* ... */ }
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ msg: `Usuario y todos sus datos han sido eliminados.` });
  } catch (error) { /* ... */ }
};

export const actualizarClase = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, profesor_id, fecha_hora, duracion_minutos, capacidad_maxima } = req.body;
  if (!nombre || !profesor_id || !fecha_hora || !capacidad_maxima) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1..$7, { rows }, rowCount) ---
    const { rows: profesor } = await pool.query(
      "SELECT r.nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1 AND r.nombre = 'profesor'", 
      [profesor_id]
    );
    if (profesor.length === 0) { /* ... */ }
    const resultado = await pool.query(
      `UPDATE clases SET nombre = $1, descripcion = $2, profesor_id = $3, fecha_hora = $4, duracion_minutos = $5, capacidad_maxima = $6 WHERE id = $7`,
      [nombre, descripcion, profesor_id, fecha_hora, duracion_minutos, capacidad_maxima, id]
    );
    if (resultado.rowCount === 0) { // Se usa rowCount
      return res.status(404).json({ msg: 'Clase no encontrada.' });
    }
    res.json({ msg: 'Clase actualizada exitosamente.' });
  } catch (error) { /* ... */ }
};