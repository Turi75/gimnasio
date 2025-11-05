import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import clienteApi from '../api/clienteApi';
import { router, useSegments } from 'expo-router';

// 1. Definimos los tipos de datos
type RolUsuario = 'cliente' | 'profesor' | 'administracion' | 'jefe';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  dni: string;
  rol: RolUsuario;
}

type AuthStatus = 'cargando' | 'autenticado' | 'no-autenticado';

// 2. Definimos la interfaz del Contexto
interface AuthContextProps {
  usuario: Usuario | null;
  estado: AuthStatus;
  mensajeError: string | null;
  iniciarSesion: (datosLogin: any) => Promise<void>;
  registrar: (datosRegistro: any) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  limpiarError: () => void;
  iniciarSesionGoogle: (accessToken: string) => Promise<void>;
}

const AuthContext = createContext({} as AuthContextProps);

// Hook personalizado
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Definimos el Proveedor
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [estado, setEstado] = useState<AuthStatus>('cargando');
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Efecto para verificar el token guardado al abrir la app
  useEffect(() => {
    const verificarToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setEstado('no-autenticado');
          return;
        }
        const respuesta = await clienteApi.get<Usuario>('/auth/perfil');
        setUsuario(respuesta.data);
        setEstado('autenticado');
      } catch (error) {
        console.log('Token no válido, limpiando...');
        await AsyncStorage.removeItem('token');
        setEstado('no-autenticado');
      }
    };
    verificarToken();
  }, []);

  // Función de Iniciar Sesión (Email/Pass)
  const iniciarSesion = async ({ email, password }: any) => {
    if (!email || !password) {
        setMensajeError('Email y contraseña son obligatorios.');
        return;
    }
    try {
      setEstado('cargando');
      const respuesta = await clienteApi.post('/auth/login', { email, password });
      const { usuario, token } = respuesta.data;
      await AsyncStorage.setItem('token', token);
      setUsuario(usuario);
      setEstado('autenticado');
      setMensajeError(null);
      router.replace('/(tabs)'); 
    } catch (error: any) {
      const msg = error.response?.data?.msg || 'Error al iniciar sesión';
      setMensajeError(msg);
      setEstado('no-autenticado');
    }
  };

  // Función de Registrar (Email/Pass)
  const registrar = async ({ nombre, email, password, dni }: any) => {
    try {
      setEstado('cargando');
      const respuesta = await clienteApi.post('/auth/registrar', { nombre, email, password, dni });
      const { usuario, token } = respuesta.data;
      await AsyncStorage.setItem('token', token);
      setUsuario(usuario);
      setEstado('autenticado');
      setMensajeError(null);
      router.replace('/(tabs)');
    
    // --- CORRECCIÓN AQUÍ ---
    // Se eliminó la 'C' mayúscula que causaba el error
    } catch (error: any) { 
    // --- FIN DE CORRECCIÓN ---
      const msg = error.response?.data?.msg || 'Error al registrar';
      setMensajeError(msg);
      setEstado('no-autenticado');
    }
  };

  // Función de Iniciar Sesión (Google)
  const iniciarSesionGoogle = async (accessToken: string) => {
    try {
      setEstado('cargando');
      const respuesta = await clienteApi.post('/auth/google', { accessToken });
      const { usuario, token } = respuesta.data;
      await AsyncStorage.setItem('token', token);
      setUsuario(usuario);
      setEstado('autenticado');
      setMensajeError(null);
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error.response?.data?.msg || 'Error al iniciar sesión con Google';
      setMensajeError(msg);
      setEstado('no-autenticado');
    }
  };

  // --- CORRECCIÓN AQUÍ ---
  // Se agregaron las funciones 'cerrarSesion' y 'limpiarError' completas
  // para solucionar el error de 'setEstado' flotante
  const cerrarSesion = async () => {
    await AsyncStorage.removeItem('token');
    setUsuario(null);
    setEstado('no-autenticado');
    router.replace('/login'); // Redirige al login
  };

  const limpiarError = () => {
    setMensajeError(null);
  };
  // --- FIN DE CORRECCIÓN ---

  // --- CORRECCIÓN AQUÍ ---
  // Se agregó el 'return' que faltaba
  return (
    <AuthContext.Provider value={{
      usuario,
      estado,
      mensajeError,
      iniciarSesion,
      registrar,
      cerrarSesion,
      limpiarError,
      iniciarSesionGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
  // --- FIN DE CORRECCIÓN ---
};