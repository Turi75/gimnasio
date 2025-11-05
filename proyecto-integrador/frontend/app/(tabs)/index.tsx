// app/(tabs)/index.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import clienteApi from '../../api/clienteApi';
import { Colores } from '../../constants/theme';

// --- (Componentes de Home para otros roles - Opcional) ---
// const PantallaHomeProfesor = () => <Text style={estilos.textoContenido}>Hola Profesor. Aquí está tu agenda.</Text>;
// const PantallaHomeAdmin = () => <Text style={estilos.textoContenido}>Hola Admin. Aquí está el panel de gestión.</Text>;

// --- Tipo de dato para una Clase (del backend) ---
interface ClaseDisponible {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_hora: string;
  duracion_minutos: number;
  nombre_profesor: string;
  cupos_disponibles: number;
}

// --- Componente de Home para el Cliente ---
const PantallaHomeCliente = () => {
  const [clases, setClases] = useState<ClaseDisponible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // useFocusEffect se ejecuta cada vez que el usuario entra a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarClases();
    }, [])
  );

  const cargarClases = async () => {
    try {
      // 1. Llamamos al endpoint del cliente para ver clases
      const { data } = await clienteApi.get<ClaseDisponible[]>('/cliente/clases');
      setClases(data);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudieron cargar las clases.");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefrescar = () => {
    setRefrescando(true);
    cargarClases();
  };

  const handleReservar = async (claseId: number) => {
    try {
      // 2. Llamamos al endpoint para reservar
      const { data } = await clienteApi.post('/cliente/reservar', { clase_id: claseId });
      Alert.alert("¡Éxito!", data.msg || "Clase reservada correctamente.");
      // Recargamos las clases para actualizar los cupos
      cargarClases();
    } catch (error: any) {
      // El backend nos avisará si no hay cupo, el plan no lo permite, o si ya reservó
      Alert.alert("No se pudo reservar", error.response?.data?.msg || "Error al procesar la reserva.");
    }
  };

  if (cargando) {
    return <ActivityIndicator size="large" color={Colores.text} style={{ marginTop: 50 }} />;
  }

  return (
    <FlatList
      data={clases}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={estilos.tarjetaClase}>
          <Text style={estilos.tituloClase}>{item.nombre}</Text>
          <Text style={estilos.textoClase}>Profesor: {item.nombre_profesor}</Text>
          <Text style={estilos.textoClase}>
            Cuándo: {new Date(item.fecha_hora).toLocaleString('es-AR')}
          </Text>
          <Text style={estilos.textoClase}>Duración: {item.duracion_minutos} min.</Text>
          <Text style={[estilos.textoClase, { marginBottom: 15, fontStyle: 'italic' }]}>
            {item.descripcion}
          </Text>
          <Text style={estilos.cuposClase}>
            Cupos disponibles: {item.cupos_disponibles}
          </Text>
          <Button
            title="Reservar"
            onPress={() => handleReservar(item.id)}
            disabled={item.cupos_disponibles <= 0}
            color={Colores.primary}
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <Text style={estilos.textoContenido}>No hay clases disponibles en este momento.</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={onRefrescar}
          tintColor={Colores.text}
        />
      }
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// --- Componente Principal (Router de Roles) ---
export default function PantallaPrincipal() {
    const { usuario } = useAuth();

    const renderizarHomePorRol = () => {
        if (!usuario) return <ActivityIndicator color={Colores.text} />;

        switch (usuario.rol) {
            case 'cliente':
                return <PantallaHomeCliente />;
            case 'profesor':
                // return <PantallaHomeProfesor />;
                return <Text style={estilos.textoContenido}>Hola Profesor. Aquí está tu agenda.</Text>;
            case 'administracion':
            case 'jefe':
                // return <PantallaHomeAdmin />;
                return <Text style={estilos.textoContenido}>Hola Admin/Jefe. Aquí está el panel de gestión.</Text>;
            default:
                return <Text style={estilos.textoContenido}>Error: Rol no reconocido.</Text>;
        }
    };

    return (
        <SafeAreaView style={estilos.contenedor}>
            <Text style={estilos.titulo}>
                Bienvenido, {usuario?.nombre}
            </Text>
            {renderizarHomePorRol()}
        </SafeAreaView>
    );
}

// --- Estilos (Dark Mode) ---
const estilos = StyleSheet.create({
    contenedor: { 
        flex: 1, 
        paddingHorizontal: 20, 
        backgroundColor: Colores.background 
    },
    titulo: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        marginBottom: 20, 
        color: Colores.text,
        marginTop: 20,
    },
    textoContenido: { 
        fontSize: 18, 
        color: Colores.textSecondary,
        textAlign: 'center'
    },
    tarjetaClase: {
      backgroundColor: Colores.backgroundSecondary,
      borderRadius: 8,
      padding: 20,
      marginBottom: 15,
    },
    tituloClase: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colores.text,
      marginBottom: 10,
    },
    textoClase: {
      fontSize: 16,
      color: Colores.textSecondary,
      marginBottom: 5,
    },
    cuposClase: {
      fontSize: 16,
      color: Colores.primary,
      fontWeight: 'bold',
      marginBottom: 15,
    }
});