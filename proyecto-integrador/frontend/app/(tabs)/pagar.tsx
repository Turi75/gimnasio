import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import clienteApi from '../../api/clienteApi';
import { Colores } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';

// Tipos para los datos que SÍ vamos a usar
type EstadoPago = 'pagado' | 'pendiente' | 'vencido' | 'en_revision';

interface Suscripcion {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado_pago: EstadoPago;
  nombre_plan: string;
}

interface Plan {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

export default function PantallaPagar() {
  // El 'usuario' del context solo lo usamos para saber QUIÉN es
  const { usuario } = useAuth();
  
  // Estados locales para esta pantalla
  const [cargandoPagina, setCargandoPagina] = useState(true);
  const [cargandoAccion, setCargandoAccion] = useState(false);
  
  // Esta es la información "fresca" que traemos de la API
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);

  // useFocusEffect se ejecuta CADA VEZ que entras a esta pestaña
  useFocusEffect(
    useCallback(() => {
      cargarDatosDePago();
    }, [usuario]) // Se vuelve a ejecutar si el usuario cambia
  );

  const cargarDatosDePago = async () => {
    if (!usuario) return;

    setCargandoPagina(true);
    try {
      // 1. Intentamos obtener la suscripción actual del cliente
      const { data } = await clienteApi.get<Suscripcion>('/cliente/mi-suscripcion');
      setSuscripcion(data);
    } catch (error) {
      // 2. Si da error 404 (no tiene suscripción), traemos los planes
      console.log('No se encontró suscripción, cargando planes...');
      setSuscripcion(null);
      try {
        const { data } = await clienteApi.get<Plan[]>('/cliente/planes');
        setPlanes(data);
      } catch (errorPlanes) {
        console.error("Error al cargar planes:", errorPlanes);
        Alert.alert("Error", "No se pudieron cargar los planes de inscripción.");
      }
    } finally {
      setCargandoPagina(false);
    }
  };

  // --- Acciones del Cliente ---

  const handleInscribirse = async (plan_id: number) => {
    setCargandoAccion(true);
    try {
      // Llamamos a la NUEVA ruta del backend
      const { data } = await clienteApi.post('/cliente/inscribirse', { plan_id });
      Alert.alert("Inscripción Exitosa", data.msg);
      // Volvemos a cargar los datos para que muestre la suscripción 'pendiente'
      cargarDatosDePago();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudo completar la inscripción.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleNotificarPago = async () => {
    setCargandoAccion(true);
    try {
      // Llamamos a la NUEVA ruta del backend
      const { data } = await clienteApi.post('/cliente/notificar-pago');
      Alert.alert("Notificación Enviada", data.msg);
      // Volvemos a cargar los datos para que muestre 'en_revision'
      cargarDatosDePago();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudo enviar la notificación.");
    } finally {
      setCargandoAccion(false);
    }
  };

  // --- Renderizado de Contenido ---

  const renderContenido = () => {
    if (cargandoPagina) {
      return <ActivityIndicator size="large" color={Colores.text} />;
    }

    // --- VISTA 1: El usuario TIENE una suscripción ---
    if (suscripcion) {
      switch (suscripcion.estado_pago) {
        case 'pagado':
          return (
            <View>
              <Text style={estilos.estadoVerde}>Tu pago está al día.</Text>
              <Text style={estilos.subtitulo}>Plan: {suscripcion.nombre_plan}</Text>
              <Text style={estilos.subtitulo}>Vence: {new Date(suscripcion.fecha_fin).toLocaleDateString()}</Text>
            </View>
          );
        case 'en_revision':
          return (
            <View>
              <Text style={estilos.estadoAmarillo}>Tu pago está siendo revisado.</Text>
              <Text style={estilos.subtitulo}>Un administrador confirmará tu pago pronto.</Text>
            </View>
          );
        case 'pendiente':
        case 'vencido':
          return (
            <View>
              <Text style={estilos.estadoRojo}>
                Tu suscripción al plan "{suscripcion.nombre_plan}" está {suscripcion.estado_pago}.
              </Text>
              <Text style={estilos.subtitulo}>
                Por favor, realiza una transferencia a [CBU/Alias del Gimnasio] y luego presiona el botón para notificar.
              </Text>
              <Button 
                title="Ya pagué, notificar al administrador" 
                onPress={handleNotificarPago} 
                disabled={cargandoAccion}
                color={Colores.warning}
              />
            </View>
          );
      }
    }

    // --- VISTA 2: El usuario NO TIENE suscripción (muestra planes) ---
    return (
      <View>
        <Text style={estilos.subtitulo}>No tienes una suscripción activa. Elige un plan para inscribirte:</Text>
        <FlatList
          data={planes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={estilos.tarjetaPlan}>
              <Text style={estilos.tituloPlan}>{item.nombre}</Text>
              <Text style={estilos.descripcionPlan}>{item.descripcion}</Text>
              <Text style={estilos.precioPlan}>${item.precio} / mes</Text>
              <Button
                title={cargandoAccion ? "Procesando..." : "Inscribirme a este Plan"}
                onPress={() => handleInscribirse(item.id)}
                disabled={cargandoAccion}
                color={Colores.primary}
              />
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <Text style={estilos.titulo}>Inscripciones y Pagos</Text>
      {renderContenido()}
    </SafeAreaView>
  );
}

// --- ESTILOS (Dark Mode) ---
const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, backgroundColor: Colores.background },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.text, marginBottom: 20 },
  subtitulo: { fontSize: 16, color: Colores.textSecondary, marginBottom: 30, lineHeight: 24 },
  
  // Estados
  estadoVerde: { fontSize: 18, fontWeight: 'bold', color: Colores.success, marginBottom: 10 },
  estadoAmarillo: { fontSize: 18, fontWeight: 'bold', color: Colores.warning, marginBottom: 10 },
  estadoRojo: { fontSize: 18, fontWeight: 'bold', color: Colores.danger, marginBottom: 10 },
  
  // Tarjeta de Planes
  tarjetaPlan: {
    backgroundColor: Colores.backgroundSecondary,
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
  },
  tituloPlan: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colores.text,
    marginBottom: 10,
  },
  descripcionPlan: {
    fontSize: 16,
    color: Colores.textSecondary,
    marginBottom: 15,
  },
  precioPlan: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colores.text,
    marginBottom: 20,
  },
});