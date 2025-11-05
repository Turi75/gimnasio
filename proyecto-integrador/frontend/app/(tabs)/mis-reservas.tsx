// app/(tabs)/mis-reservas.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import clienteApi from '../../api/clienteApi';
import { Colores } from '../../constants/theme';

// Tipo de dato para una Reserva (del backend)
interface MiReserva {
  reserva_id: number;
  clase_nombre: string;
  fecha_hora: string;
  profesor_nombre: string;
  asistio: boolean;
}

export default function MisReservas() {
  const [reservas, setReservas] = useState<MiReserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [])
  );

  const cargarReservas = async () => {
    try {
      // 1. Llamamos al endpoint del cliente para ver sus reservas
      const { data } = await clienteApi.get<MiReserva[]>('/cliente/mis-reservas');
      setReservas(data);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudieron cargar tus reservas.");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefrescar = () => {
    setRefrescando(true);
    cargarReservas();
  };

  const handleCancelar = async (reservaId: number) => {
    Alert.alert(
      "Cancelar Reserva",
      "¿Estás seguro de que quieres cancelar esta reserva?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí, Cancelar", 
          style: "destructive",
          onPress: async () => {
            try {
              // 2. Llamamos al endpoint para cancelar
              const { data } = await clienteApi.delete(`/cliente/reservar/${reservaId}`);
              Alert.alert("¡Éxito!", data.msg || "Reserva cancelada.");
              // Recargamos la lista
              cargarReservas();
            } catch (error: any) {
              Alert.alert("Error", error.response?.data?.msg || "No se pudo cancelar la reserva.");
            }
          }
        }
      ]
    );
  };

  if (cargando) {
    return (
      <SafeAreaView style={estilos.contenedor}>
        <ActivityIndicator size="large" color={Colores.text} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  // Separamos futuras de pasadas
  const reservasFuturas = reservas.filter(r => new Date(r.fecha_hora) > new Date());
  const reservasPasadas = reservas.filter(r => new Date(r.fecha_hora) <= new Date());

  return (
    <SafeAreaView style={estilos.contenedor}>
      <Text style={estilos.titulo}>Mis Reservas</Text>
      
      <FlatList
        data={reservasFuturas}
        keyExtractor={(item) => item.reserva_id.toString()}
        ListHeaderComponent={<Text style={estilos.subtitulo}>Próximas Clases</Text>}
        renderItem={({ item }) => (
          <View style={estilos.tarjetaReserva}>
            <Text style={estilos.tituloClase}>{item.clase_nombre}</Text>
            <Text style={estilos.textoClase}>Profesor: {item.profesor_nombre}</Text>
            <Text style={estilos.textoClase}>
              Cuándo: {new Date(item.fecha_hora).toLocaleString('es-AR')}
            </Text>
            <Button
              title="Cancelar Reserva"
              onPress={() => handleCancelar(item.reserva_id)}
              color={Colores.danger} // Botón de cancelar en rojo
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={estilos.textoVacio}>No tienes reservas para clases futuras.</Text>
        }
        // También mostramos las clases pasadas
        ListFooterComponent={
          <>
            <Text style={[estilos.subtitulo, {marginTop: 30}]}>Historial de Clases</Text>
            {reservasPasadas.length === 0 ? (
              <Text style={estilos.textoVacio}>No tienes un historial de clases.</Text>
            ) : (
              reservasPasadas.map(item => (
                <View key={item.reserva_id} style={[estilos.tarjetaReserva, {opacity: 0.6}]}>
                  <Text style={estilos.tituloClase}>{item.clase_nombre}</Text>
                  <Text style={estilos.textoClase}>
                    Fecha: {new Date(item.fecha_hora).toLocaleDateString('es-AR')}
                  </Text>
                  <Text style={estilos.textoClase}>
                    Asistencia: {item.asistio ? 'Presente' : 'Ausente'}
                  </Text>
                </View>
              ))
            )}
          </>
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
    titulo: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        marginBottom: 10, 
        color: Colores.text,
        marginTop: 20,
    },
    subtitulo: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colores.text,
      marginBottom: 15,
    },
    textoVacio: { 
        fontSize: 16, 
        color: Colores.textSecondary,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    tarjetaReserva: {
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
});