import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import clienteApi from '../../api/clienteApi';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colores } from '../../constants/theme'; // Asegúrate de tener este archivo de estilos

// Tipos de datos que recibimos del backend (de la tabla suscripciones)
type EstadoPago = 'pagado' | 'pendiente' | 'vencido' | 'en_revision';

interface SuscripcionAdmin {
  id: number; // ID de la suscripción
  nombre_cliente: string;
  email_cliente: string;
  nombre_plan: string;
  estado_pago: EstadoPago;
}

export default function GestionPagos() {
  const [suscripciones, setSuscripciones] = useState<SuscripcionAdmin[]>([]);
  const [cargando, setCargando] = useState(true);

  // useFocusEffect recarga los datos cada vez que entras a la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarSuscripciones();
    }, [])
  );

  const cargarSuscripciones = async () => {
    setCargando(true);
    try {
      // 1. Esta pantalla debe llamar a /admin/suscripciones (no /admin/usuarios)
      const { data } = await clienteApi.get<SuscripcionAdmin[]>('/admin/suscripciones');
      setSuscripciones(data);
    } catch (error) {
      console.error("Error al cargar suscripciones:", error);
      Alert.alert("Error", "No se pudo cargar la lista de suscripciones.");
    } finally {
      setCargando(false);
    }
  };

  // Función para aprobar (pagado) o rechazar (vencido)
  const handleActualizarEstado = async (suscripcionId: number, nuevoEstado: 'pagado' | 'vencido') => {
    try {
      // 2. Llamamos a la ruta PUT para actualizar el estado
      await clienteApi.put(`/admin/suscripciones/${suscripcionId}/estado`, {
        nuevo_estado: nuevoEstado
      });
      Alert.alert("Éxito", `Pago ${nuevoEstado === 'pagado' ? 'aprobado' : 'rechazado'}.`);
      
      // Actualizamos la lista localmente
      setSuscripciones(prev => 
        prev.map(s => 
          s.id === suscripcionId ? { ...s, estado_pago: nuevoEstado } : s
        )
      );
    } catch (error) {
      console.error("Error al actualizar pago:", error);
      Alert.alert("Error", "No se pudo actualizar el pago.");
    }
  };

  // Esta función renderiza la lista de SUSCRIPCIONES
  const renderItemSuscripcion = ({ item }: { item: SuscripcionAdmin }) => {
    
    // Este código ahora es seguro, porque 'item.estado_pago' SÍ existe en las suscripciones
    const estadoTexto = item.estado_pago.charAt(0).toUpperCase() + item.estado_pago.slice(1);
    let colorEstadoResaltado = Colores.backgroundSecondary;
    if (item.estado_pago === 'en_revision') colorEstadoResaltado = Colores.warning;
    if (item.estado_pago === 'pendiente') colorEstadoResaltado = Colores.warning;
    if (item.estado_pago === 'vencido') colorEstadoResaltado = Colores.danger;
    if (item.estado_pago === 'pagado') colorEstadoResaltado = Colores.success;
    
    return (
      <View style={estilos.itemUsuario}>
        <View style={[estilos.colorBar, { backgroundColor: colorEstadoResaltado }]} />
        <View style={estilos.infoUsuario}>
          <Text style={estilos.nombreUsuario}>{item.nombre_cliente}</Text>
          <Text style={estilos.emailUsuario}>{item.email_cliente} ({item.nombre_plan})</Text>
          <Text style={estilos.estadoActual}>
            Estado Actual: 
            <Text style={{ color: colorEstadoResaltado, fontWeight: 'bold' }}>
              {` ${estadoTexto.replace('_', ' ')}`}
            </Text>
          </Text>
        </View>
        <View style={estilos.accionesPago}>
          <Pressable 
            style={[estilos.botonAccion, estilos.botonAlDia]}
            onPress={() => handleActualizarEstado(item.id, 'pagado')}>
            <Text style={estilos.textoBoton}>Aprobar</Text>
          </Pressable>
          <Pressable 
            style={[estilos.botonAccion, estilos.botonVencido]}
            onPress={() => handleActualizarEstado(item.id, 'vencido')}>
            <Text style={estilos.textoBoton}>Rechazar</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <Text style={estilos.titulo}>Gestión de Pagos</Text>
      <Text style={estilos.subtitulo}>
        Aprobar o rechazar los pagos pendientes o en revisión.
      </Text>
      {cargando ? (
        <ActivityIndicator size="large" color={Colores.text} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={suscripciones}
          renderItem={renderItemSuscripcion} // ¡Ahora usamos la función correcta!
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
             <Text style={estilos.textoVacio}>No hay suscripciones para gestionar.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

// --- Estilos (Dark Mode) ---
const estilos = StyleSheet.create({
  contenedor: { flex: 1, paddingHorizontal: 20, backgroundColor: Colores.background },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.text, marginTop: 20, marginBottom: 10 },
  subtitulo: { fontSize: 16, color: Colores.textSecondary, marginBottom: 20 },
  textoVacio: { fontSize: 16, color: Colores.textSecondary, textAlign: 'center', marginTop: 30 },
  itemUsuario: { backgroundColor: Colores.backgroundSecondary, borderRadius: 8, marginBottom: 15, flexDirection: 'row', overflow: 'hidden' },
  colorBar: { width: 8 },
  infoUsuario: { flex: 1, padding: 15 },
  nombreUsuario: { fontSize: 18, fontWeight: 'bold', color: Colores.text },
  emailUsuario: { fontSize: 14, color: Colores.textSecondary, marginBottom: 10 },
  estadoActual: { fontSize: 14, color: Colores.text },
  accionesPago: { justifyContent: 'center', padding: 10, gap: 10 },
  botonAccion: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5, alignItems: 'center' },
  textoBoton: { color: Colores.text, fontWeight: 'bold', fontSize: 12 },
  botonAlDia: { backgroundColor: Colores.success },
  botonVencido: { backgroundColor: Colores.danger },
});