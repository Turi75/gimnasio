import express from 'express';
import verificarToken from '../middlewares/authMiddleware.js';
import verificarRol from '../middlewares/rolMiddleware.js';
import {
    crearClase,
    obtenerTodasLasClases,
    eliminarClase,
    actualizarClase, // --- 1. IMPORTAR LA NUEVA FUNCIÓN ---
    obtenerSuscripciones,
    actualizarEstadoSuscripcion,
    obtenerTodosLosUsuarios,
    obtenerTodosLosProfesores,
    eliminarUsuario
} from '../controladores/adminControlador.js';

const router = express.Router();

// Protegemos TODAS las rutas de admin
router.use(verificarToken, verificarRol(['jefe', 'administracion']));

// --- Rutas de Clases ---
router.post('/clases', crearClase);
router.get('/clases', obtenerTodasLasClases);
router.delete('/clases/:id', eliminarClase);
router.put('/clases/:id', actualizarClase); // --- 2. AÑADIR LA RUTA PUT ---

// --- Rutas de Pagos (Suscripciones) ---
router.get('/suscripciones', obtenerSuscripciones);
router.put('/suscripciones/:id/estado', actualizarEstadoSuscripcion);

// --- Rutas de Gestión de Usuarios ---
router.get('/usuarios', obtenerTodosLosUsuarios);
router.get('/profesores', obtenerTodosLosProfesores);
router.delete('/usuarios/:id', eliminarUsuario);

export default router;