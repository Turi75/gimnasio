import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * [CORRECCIÓN PARA RENDER Y LOCAL]
 * 1. Lee la variable 'EXPO_PUBLIC_API_URL' que Render proveerá.
 * 2. Si no existe (local), usa la lógica de Platform.OS para
 * decidir entre 'localhost' (para web) o tu IP (para móvil).
 */
const IP_DE_TU_PC = '192.168.0.144'; // Tu IP local
const PUERTO_BACKEND = '3000';

const baseURL_local = `http://localhost:${PUERTO_BACKEND}/api`;
const baseURL_movil = `http://${IP_DE_TU_PC}:${PUERTO_BACKEND}/api`;

const localApiUrl = Platform.OS === 'web' ? baseURL_local : baseURL_movil;

const baseURL = process.env.EXPO_PUBLIC_API_URL || localApiUrl;

// Creamos la instancia de Axios con la URL correcta
const clienteApi = axios.create({ baseURL });


// Interceptor (sin cambios)
clienteApi.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default clienteApi;