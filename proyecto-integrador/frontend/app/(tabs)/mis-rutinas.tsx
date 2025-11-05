// app/(tabs)/mis-rutinas.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import clienteApi from '../../api/clienteApi';
import { Colores } from '../../constants/theme';

// Tipo de dato para una Rutina (del backend)
interface MiRutina {
  titulo: string;
  descripcion: string;
  fecha_creacion: string;
  nombre_profesor: string;
}

export default function MisRutinas() {
  const [rutinas, setRutinas] = useState<MiRutina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarRutinas();
    }, [])
  );

  const cargarRutinas = async () => {
    try {
      // 1. Llamamos al endpoint del cliente para ver sus rutinas
      const { data } = await clienteApi.get<MiRutina[]>('/cliente/mis-rutinas');
      setRutinas(data);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudieron cargar tus rutinas.");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefrescar = () => {
    setRefrescando(true);
    cargarRutinas();
  };

  if (cargando) {
    return (
      <SafeAreaView style={estilos.contenedorCargando}>
        <ActivityIndicator size="large" color={Colores.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.contenedor}>
      <Text style={estilos.titulo}>Mis Rutinas</Text>
      
      <FlatList
        data={rutinas}
        keyExtractor={(item, index) => `${item.titulo}-${index}`}
        renderItem={({ item }) => (
          <View style={estilos.tarjetaRutina}>
            <Text style={estilos.tituloRutina}>{item.titulo}</Text>
            <Text style={estilos.infoRutina}>
              Asignada por: {item.nombre_profesor}
            </Text>
            <Text style={estilos.infoRutina}>
              Fecha: {new Date(item.fecha_creacion).toLocaleDateString('es-AR')}
            </Text>
            <View style={estilos.separador} />
            <Text style={estilos.descripcionRutina}>{item.descripcion}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={estilos.textoVacio}>Aún no tienes rutinas asignadas.</Text>
            <Text style={estilos.textoVacio}>Habla con tu profesor.</Text>
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
    contenedorCargando: { 
        flex: 1, 
        backgroundColor: Colores.background, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    titulo: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        marginBottom: 20, 
        color: Colores.text,
        marginTop: 20,
    },
    textoVacio: { 
        fontSize: 16, 
        color: Colores.textSecondary,
        textAlign: 'center',
    },
    tarjetaRutina: {
      backgroundColor: Colores.backgroundSecondary,
      borderRadius: 8,
      padding: 20,
      marginBottom: 15,
    },
    tituloRutina: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colores.text,
      marginBottom: 10,
    },
    infoRutina: {
      fontSize: 14,
      color: Colores.textSecondary,
      marginBottom: 2,
    },
    separador: {
      height: 1,
      backgroundColor: Colores.inputBackground,
      marginVertical: 15,
    },
    descripcionRutina: {
      fontSize: 16,
      color: Colores.text,
      lineHeight: 24,
    }
});