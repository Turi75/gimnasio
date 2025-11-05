import pool from '../config/db.js';

export const asignarRutina = async (req, res) => {
  const { cliente_id, titulo, descripcion } = req.body;
  const profesor_id = req.usuario.id; 
  if (!cliente_id || !titulo || !descripcion) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1...$4) ---
    await pool.query(
      'INSERT INTO rutinas (profesor_id, cliente_id, titulo, descripcion) VALUES ($1, $2, $3, $4)',
      [profesor_id, cliente_id, titulo, descripcion]
    );
    res.status(201).json({ msg: 'Rutina asignada exitosamente.' });
  } catch (error) { /* ... */ }
};

export const responderConsulta = async (req, res) => {
  const { id } = req.params;
  const { respuesta } = req.body;
  const profesor_id = req.usuario.id; 
  if (!respuesta) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1...$3 y rowCount) ---
    const resultado = await pool.query(
      'UPDATE consultas SET respuesta = $1, fecha_respuesta = CURRENT_TIMESTAMP WHERE id = $2 AND profesor_id = $3',
      [respuesta, id, profesor_id]
    );
    if (resultado.rowCount === 0) { // Se usa rowCount
      return res.status(404).json({ msg: 'Consulta no encontrada o no te pertenece.' });
    }
    res.json({ msg: 'Consulta respondida exitosamente.' });
  } catch (error) { /* ... */ }
};

export const crearAviso = async (req, res) => {
  const { mensaje, clase_id } = req.body;
  const profesor_id = req.usuario.id;
  if (!mensaje) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1...$3) ---
    const idClase = clase_id ? clase_id : null; 
    await pool.query(
      'INSERT INTO avisos (profesor_id, clase_id, mensaje) VALUES ($1, $2, $3)',
      [profesor_id, idClase, mensaje]
    );
    res.status(201).json({ msg: 'Aviso creado exitosamente.' });
  } catch (error) { /* ... */ }
};

export const obtenerClientesDeMisClases = async (req, res) => {
  const profesor_id = req.usuario.id;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
    const { rows: misClases } = await pool.query('SELECT id FROM clases WHERE profesor_id = $1', [profesor_id]);
    if (misClases.length === 0) { return res.json([]); }
    
    const idsMisClases = misClases.map(c => c.id); 
    
    // --- CORRECCIÓN POSTGRESQL (Sintaxis IN) ---
    // En lugar de IN (?), usamos = ANY($1) para un array en Postgres
    const { rows: clientes } = await pool.query(
      `SELECT DISTINCT u.id, u.nombre, u.email, u.dni 
       FROM usuarios u
       JOIN reservas r ON u.id = r.cliente_id
       WHERE r.clase_id = ANY($1)`,
      [idsMisClases]
    );
    res.json(clientes);
  } catch (error) { /* ... */ }
};

export const obtenerConsultasPendientes = async (req, res) => {
    const profesor_id = req.usuario.id;
    try {
      // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y { rows }) ---
      const { rows: consultas } = await pool.query(
        `SELECT c.*, u.nombre AS nombre_cliente, cl.nombre AS nombre_clase
         FROM consultas c
         JOIN usuarios u ON c.cliente_id = u.id
         JOIN clases cl ON c.clase_id = cl.id
         WHERE c.profesor_id = $1 AND c.respuesta IS NULL
         ORDER BY c.fecha_consulta ASC`,
        [profesor_id]
      );
      res.json(consultas);
    } catch (error) { /* ... */ }
  };