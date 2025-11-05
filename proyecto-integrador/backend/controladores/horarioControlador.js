import pool from '../config/db.js';

export const obtenerPlantillas = async (req, res) => {
  try {
    // --- CORRECCIÓN POSTGRESQL ({ rows }) ---
    const { rows: plantillas } = await pool.query(
      `SELECT p.*, u.nombre AS nombre_profesor 
       FROM plantillas_horarios p
       JOIN usuarios u ON p.profesor_id = u.id
       ORDER BY p.dia_semana, p.hora_inicio`
    );
    res.json(plantillas);
  } catch (error) { /* ... */ }
};

export const crearPlantilla = async (req, res) => {
  const { 
    nombre_clase, descripcion, profesor_id, 
    dia_semana, hora_inicio, duracion_minutos, capacidad_maxima 
  } = req.body;
  if (!nombre_clase || !profesor_id || !dia_semana || !hora_inicio) { /* ... */ }
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1...$7) ---
    await pool.query(
      `INSERT INTO plantillas_horarios (nombre_clase, descripcion, profesor_id, dia_semana, hora_inicio, duracion_minutos, capacidad_maxima) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nombre_clase, descripcion, profesor_id, dia_semana, hora_inicio, duracion_minutos || 60, capacidad_maxima || 20]
    );
    res.status(201).json({ msg: 'Plantilla de horario creada.' });
  } catch (error) { /* ... */ }
};

export const eliminarPlantilla = async (req, res) => {
  const { id } = req.params;
  try {
    // --- CORRECCIÓN POSTGRESQL (Sintaxis $1 y rowCount) ---
    const resultado = await pool.query('DELETE FROM plantillas_horarios WHERE id = $1', [id]);
    if (resultado.rowCount === 0) { // Se usa rowCount
      return res.status(404).json({ msg: 'Plantilla no encontrada.' });
    }
    res.json({ msg: 'Plantilla de horario eliminada.' });
  } catch (error) { /* ... */ }
};

export const generarSemana = async (req, res) => {
  try {
    // --- CORRECCIÓN POSTGRESQL ({ rows }) ---
    const { rows: plantillas } = await pool.query('SELECT * FROM plantillas_horarios');
    if (plantillas.length === 0) { /* ... */ }
    let clasesCreadas = 0;
    const hoy = new Date();
    
    for (let i = 0; i < 7; i++) {
      const fechaActual = new Date();
      fechaActual.setDate(hoy.getDate() + i);
      const anio = fechaActual.getFullYear();
      const mes = fechaActual.getMonth() + 1;
      const dia = fechaActual.getDate();
      
      // La lógica de getDay() + 1 (1=Dom, 2=Lun) coincide con tu esquema
      const diaDeLaSemanaActual = fechaActual.getDay() + 1; 

      const plantillasParaHoy = plantillas.filter(p => p.dia_semana === diaDeLaSemanaActual);
      if (plantillasParaHoy.length === 0) { continue; }

      for (const plantilla of plantillasParaHoy) {
        const [hora, minuto] = plantilla.hora_inicio.split(':');
        const fechaHoraClase = `${anio}-${mes}-${dia} ${hora}:${minuto}:00`;

        // --- CORRECCIÓN POSTGRESQL (Sintaxis $1...$3 y { rows }) ---
        const { rows: existente } = await pool.query(
          'SELECT id FROM clases WHERE profesor_id = $1 AND fecha_hora = $2 AND nombre = $3',
          [plantilla.profesor_id, fechaHoraClase, plantilla.nombre_clase]
        );

        if (existente.length === 0) {
          // --- CORRECCIÓN POSTGRESQL (Sintaxis $1...$6) ---
          await pool.query(
            `INSERT INTO clases (nombre, descripcion, profesor_id, fecha_hora, duracion_minutos, capacidad_maxima)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              plantilla.nombre_clase, 
              plantilla.descripcion, 
              plantilla.profesor_id, 
              fechaHoraClase, 
              plantilla.duracion_minutos, 
              plantilla.capacidad_maxima
            ]
          );
          clasesCreadas++;
        }
      }
    }
    res.status(201).json({ msg: `Generación completada. Se crearon ${clasesCreadas} nuevas clases.` });
  } catch (error) { /* ... */ }
};