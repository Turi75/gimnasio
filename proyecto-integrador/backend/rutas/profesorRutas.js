import express from 'express';
import verificarToken from '../middlewares/authMiddleware.js';
import verificarRol from '../middlewares/rolMiddleware.js';
import { 
    asignarRutina, 
    responderConsulta, 
    crearAviso,
    obtenerClientesDeMisClases,
    obtenerConsultasPendientes
} from '../controladores/profesorControlador.js';

const router = express.Router();

// Protegemos TODAS las rutas de profesor
router.use(verificarToken, verificarRol(['jefe', 'profesor']));

router.post('/rutinas', asignarRutina);
router.post('/consultas/:id/responder', responderConsulta);
router.post('/avisos', crearAviso);
router.get('/mis-clientes', obtenerClientesDeMisClases);
router.get('/consultas-pendientes', obtenerConsultasPendientes);

export default router;