import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Colores } from '../../constants/theme';
// import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabsLayout() {
  const { usuario, estado } = useAuth();

  if (estado === 'cargando' || !usuario) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colores.background }}>
        <ActivityIndicator size="large" color={Colores.text} />
      </View>
    );
  }

  // --- Lógica de Roles ---
  const esCliente = usuario.rol === 'cliente';
  const esProfesor = usuario.rol === 'profesor';
  const esAdmin = usuario.rol === 'administracion';
  const esJefe = usuario.rol === 'jefe';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colores.text,
        tabBarInactiveTintColor: Colores.textSecondary,
        tabBarStyle: {
          backgroundColor: Colores.backgroundSecondary,
          borderTopColor: Colores.backgroundSecondary,
        },
      }}
    >
      {/* Pestaña "Inicio" (Visible para todos) */}
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      
      {/* --- PESTAÑAS DE CLIENTE --- */}
      <Tabs.Screen
        name="mis-reservas"
        options={{
          title: 'Mis Reservas',
          href: esCliente || esJefe ? 'mis-reservas' : null,
        }}
      />
      <Tabs.Screen
        name="mis-rutinas" 
        options={{
          title: 'Mis Rutinas',
          href: esCliente || esJefe ? 'mis-rutinas' : null, 
        }}
      />
      <Tabs.Screen
        name="pagar"
        options={{
          title: 'Inscribirse',
          href: esCliente || esJefe ? 'pagar' : null, 
        }}
      />

      {/* --- PESTAÑAS DE PROFESOR --- */}
      <Tabs.Screen
        name="asignar-rutinas"
        options={{
          title: 'Asignar Rutinas',
          href: esProfesor || esJefe ? 'asignar-rutinas' : null, 
        }}
      />
      
      {/* --- PESTAÑAS COMUNES (Cliente y Profesor) --- */}
      <Tabs.Screen
        name="consultas"
        options={{
          title: 'Consultas',
          href: (esProfesor || esCliente || esJefe) ? 'consultas' : null, 
        }}
      />
      
      {/* --- PESTAÑAS DE ADMIN / JEFE --- */}
      
      {/* 1. ¡NUEVA PANTALLA! */}
      <Tabs.Screen
        name="gestion-horarios" // (El archivo que acabamos de crear)
        options={{
          title: 'Gestión Horario', // Este es el horario fijo semanal
          href: esAdmin || esJefe ? 'gestion-horarios' : null, 
        }}
      />
      
      {/* 2. ¡PANTALLA ANTIGUA RENOMBRADA! */}
      <Tabs.Screen
        name="gestion-clases" // (El archivo que edita clases individuales)
        options={{
          title: 'Editar Clases', // Para editar/borrar eventos únicos (feriados, etc.)
          href: esAdmin || esJefe ? 'gestion-clases' : null, 
        }}
      />
      
      <Tabs.Screen
        name="gestion-pagos"
        options={{
          title: 'Gestión Pagos',
          href: esAdmin || esJefe ? 'gestion-pagos' : null, 
        }}
      />

      {/* Pestaña "Perfil" (Visible para todos) */}
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Mi Perfil' }}
      />

    </Tabs>
  );
}
