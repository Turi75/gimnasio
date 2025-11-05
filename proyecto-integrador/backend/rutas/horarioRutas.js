import express from 'express';
import verificarToken from '../middlewares/authMiddleware.js';
import verificarRol from '../middlewares/rolMiddleware.js';
import {
    obtenerPlantillas,
    crearPlantilla,
    eliminarPlantilla,
    generarSemana
} from '../controladores/horarioControlador.js';

const router = express.Router();

// Protegemos TODAS las rutas de horarios (solo Admin y Jefe)
router.use(verificarToken, verificarRol(['jefe', 'administracion']));

// --- Rutas para el "Botón Mágico" ---
/**
 * @route   POST /api/horarios/generar-semana
 * @desc    Genera las clases de los próximos 7 días
 */
router.post('/generar-semana', generarSemana);


// --- Rutas para gestionar las plantillas (el horario fijo) ---
/**
 * @route   GET /api/horarios/plantillas
 * @desc    Obtener todas las plantillas
 */
router.get('/plantillas', obtenerPlantillas);

/**
 * @route   POST /api/horarios/plantillas
 * @desc    Crear una nueva plantilla
 */
router.post('/plantillas', crearPlantilla);

/**
 * @route   DELETE /api/horarios/plantillas/:id
 * @desc    Eliminar una plantilla
 */
router.delete('/plantillas/:id', eliminarPlantilla);


export default router;
