import express from 'express';
// Asegúrate de que estas funciones estén exportadas con 'export const' en el controlador
import { registrarUsuario, loginUsuario, obtenerPerfil } from '../controladores/authControlador.js';
import verificarToken from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/registrar
 * @desc    Registra un nuevo usuario (cliente por defecto)
 * @access  Público
 */
router.post('/registrar', registrarUsuario);

/**
 * @route   POST /api/auth/login
 * @desc    Inicia sesión y devuelve un token
 * @access  Público
 */
router.post('/login', loginUsuario);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtiene el perfil del usuario autenticado
 * @access  Privado (requiere token)
 */
router.get('/perfil', verificarToken, obtenerPerfil);

// --- ¡ESTA ES LA LÍNEA QUE FALTABA! ---
export default router;