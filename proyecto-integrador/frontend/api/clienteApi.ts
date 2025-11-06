import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * [CORRECCIÓN PARA APK Y RENDER]
 * Esta es la URL pública y permanente de tu backend en Render.
 * La app móvil (APK) SIEMPRE usará esta dirección
 * para conectarse, sin importar la IP de tu celular.
 */
const baseURL = 'https://gimnasio-api-turi.onrender.com/api';


// Creamos una 'instancia' de Axios con esa configuración
const clienteApi = axios.create({ baseURL });

/**
 * Interceptor de Axios (Middleware para peticiones).
 * Adjunta el token de autenticación a todas las peticiones.
 */
clienteApi.interceptors.request.use(
  async (config) => {
    // Leemos el token que guardamos
    const token = await AsyncStorage.getItem('token');
    
    if (token) {
      // Si existe un token, lo agregamos al header 'Authorization'
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default clienteApi;