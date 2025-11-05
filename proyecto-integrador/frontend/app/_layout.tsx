import React, { useEffect } from 'react';

// --- CORRECCIÓN DE IMPORTACIÓN ---
// 1. Importar el AuthProvider y useAuth desde el archivo de contexto
// (Debe subir 1 nivel: _layout.tsx -> app -> frontend/)
import { AuthProvider, useAuth } from '../context/AuthContext';
// --- FIN DE CORRECCIÓN ---

import { Slot, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colores } from '../constants/theme'; // Importamos los colores para el fondo

/**
 * Este componente es el "corazón" de la navegación.
 * Decide qué grupo de rutas mostrar (auth o tabs).
 */
const LayoutInicial = () => {
  const { estado } = useAuth();
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (estado !== 'cargando') {
      const enGrupoAutenticado = segmentos[0] === '(tabs)';
      
      // 1. Si está autenticado pero NO está en (tabs), lo mandamos a (tabs)
      if (estado === 'autenticado' && !enGrupoAutenticado) {
        router.replace('/(tabs)');
      } 
      // 2. Si NO está autenticado pero ESTÁ en (tabs), lo mandamos al login
      else if (estado === 'no-autenticado' && enGrupoAutenticado) {
        router.replace('/login');
      }
    }
  }, [estado, segmentos, router]);

  // Muestra un spinner mientras el AuthContext verifica el token
  if (estado === 'cargando') {
    return (
      <View style={styles.contenedorCarga}>
        <ActivityIndicator size="large" color={Colores.text} />
      </View>
    );
  }

  // Cuando termina de cargar, <Slot> renderiza la pantalla correcta (login o tabs)
  return <Slot />;
};

/**
 * Este es el Layout Raíz (RootLayout)
 * Envuelve TODA la aplicación en el AuthProvider.
 */
export default function RootLayout() {
  // --- CORRECCIÓN DE ESTRUCTURA ---
  // Aquí es donde se USA el AuthProvider, no donde se define
  return (
    <AuthProvider>
      <LayoutInicial />
    </AuthProvider>
  );
  // --- FIN DE CORRECCIÓN ---
}

const styles = StyleSheet.create({
  contenedorCarga: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colores.background // Fondo oscuro
  },
});