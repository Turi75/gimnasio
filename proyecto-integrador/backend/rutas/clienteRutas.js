import express from 'express';
import verificarToken from '../middlewares/authMiddleware.js';
import verificarRol from '../middlewares/rolMiddleware.js';
import { 
    obtenerClasesDisponibles, 
    reservarClase, 
    misReservas, 
    cancelarReserva,
    misRutinas,
    enviarConsulta,
    obtenerPlanes,
    miSuscripcion,
    inscribirseAPlan,
    notificarPago,
    misConsultas,
    obtenerClasesParaConsultar
} from '../controladores/clienteControlador.js';

const router = express.Router();

// Protegemos TODAS las rutas de cliente
router.use(verificarToken, verificarRol(['jefe', 'cliente']));

// --- Clases y Reservas ---
router.get('/clases', obtenerClasesDisponibles);
router.post('/reservar', reservarClase);
router.get('/mis-reservas', misReservas);
router.delete('/reservar/:id', cancelarReserva);

// --- Rutinas y Consultas ---
router.get('/mis-rutinas', misRutinas);
router.post('/consultas', enviarConsulta);
router.get('/mis-consultas', misConsultas);
router.get('/clases-para-consultar', obtenerClasesParaConsultar);

// --- Pagos y Planes ---
router.get('/planes', obtenerPlanes);
router.get('/mi-suscripcion', miSuscripcion);
router.post('/inscribirse', inscribirseAPlan);
router.post('/notificar-pago', notificarPago);

export default router;