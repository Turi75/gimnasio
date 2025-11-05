import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { probarConexion } from './config/db.js';

// --- Importación de TODAS las rutas ---
import authRutas from './rutas/authRutas.js';
import accesoRutas from './rutas/accesoRutas.js';
import adminRutas from './rutas/adminRutas.js';
import profesorRutas from './rutas/profesorRutas.js';
import clienteRutas from './rutas/clienteRutas.js';
import horarioRutas from './rutas/horarioRutas.js';

dotenv.config();
const aplicacion = express();

aplicacion.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization']
}));

aplicacion.use(express.json());
probarConexion();

const API_PREFIX = '/api';

// --- Definición de Rutas ---
aplicacion.use(`${API_PREFIX}/auth`, authRutas);
aplicacion.use(`${API_PREFIX}/acceso`, accesoRutas);
aplicacion.use(`${API_PREFIX}/admin`, adminRutas);
aplicacion.use(`${API_PREFIX}/profesor`, profesorRutas);
aplicacion.use(`${API_PREFIX}/cliente`, clienteRutas);
aplicacion.use(`${API_PREFIX}/horarios`, horarioRutas);

aplicacion.get(API_PREFIX, (peticion, respuesta) => {
    respuesta.json({ mensaje: 'API del Gimnasio funcionando correctamente.' });
});

// Manejador de errores
aplicacion.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal en el servidor!');
});

// --- ¡CORRECCIÓN PARA RENDER! ---
// 1. Render usa la variable 'PORT'
const puerto = process.env.PORT || 3000;
// 2. Escuchamos en '0.0.0.0' para aceptar conexiones externas
const HOST = '0.0.0.0';

aplicacion.listen(puerto, HOST, () => {
    console.log(`🚀 Servidor API escuchando en http://${HOST}:${puerto}`);
});
// --- FIN DE CORRECCIÓN ---