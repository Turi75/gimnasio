import express from 'express';
// Asegúrate de que el controlador exporte esta función
import { verificarAccesoDNI } from '../controladores/accesoControlador.js';

const router = express.Router();

/**
 * @route   POST /api/acceso/verificar
 * @desc    Verifica si un DNI tiene acceso (suscripción activa)
 * @access  Público
 */
router.post('/verificar', verificarAccesoDNI);

// --- ¡ESTA ES LA LÍNEA QUE FALTABA! ---
export default router;