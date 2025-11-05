// app/(tabs)/asignar-rutinas.tsx
import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TextInput, Button, 
    Alert, ActivityIndicator, ScrollView, Pressable 
} from 'react-native';
import clienteApi from '../../api/clienteApi';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colores } from '../../constants/theme';

// Tipo de dato para el cliente (del backend)
interface ClienteProfesor {
  id: number;
  nombre: string;
}

export default function AsignarRutinas() {
  const [cargando, setCargando] = useState(true);
  const [clientes, setClientes] = useState<ClienteProfesor[]>([]);
  
  // --- Estados del formulario ---
  const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState<number | null>(null);
  const [tituloRutina, setTituloRutina] = useState('');
  const [descripcionRutina, setDescripcionRutina] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarClientes();
    }, [])
  );

  // 1. Cargar los clientes que tiene este profesor
  const cargarClientes = async () => {
    try {
      setCargando(true);
      // Este endpoint (que ya creamos) solo trae los clientes de las clases del profesor logueado
      const { data } = await clienteApi.get<ClienteProfesor[]>('/profesor/mis-clientes');
      setClientes(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar tus clientes.");
    } finally {
      setCargando(false);
    }
  };

  // 2. Enviar la rutina al backend
  const handleAsignarRutina = async () => {
    if (!clienteIdSeleccionado || !tituloRutina || !descripcionRutina) {
      Alert.alert("Error", "Debes seleccionar un cliente y completar todos los campos.");
      return;
    }
    
    try {
      setCargando(true); // Bloqueamos la UI
      
      // Este endpoint (que ya creamos) asigna la rutina
      await clienteApi.post('/profesor/rutinas', {
        cliente_id: clienteIdSeleccionado,
        titulo: tituloRutina,
        descripcion: descripcionRutina
      });
      
      Alert.alert("Éxito", "Rutina asignada correctamente.");
      
      // Limpiamos el formulario
      setClienteIdSeleccionado(null);
      setTituloRutina('');
      setDescripcionRutina('');

    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudo asignar la rutina.");
    } finally {
      setCargando(false);
    }
  };

  if (cargando && !clientes.length) {
    return (
      <SafeAreaView style={estilos.contenedorCargando}>
        <ActivityIndicator size="large" color={Colores.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.contenedor}>
      <ScrollView>
        <Text style={estilos.titulo}>Asignar Rutina</Text>
        
        <View style={estilos.seccion}>
          <Text style={estilos.label}>1. Seleccionar Cliente</Text>
          {cargando && <ActivityIndicator color={Colores.text} />}
          
          {clientes.length === 0 && !cargando ? (
            <Text style={estilos.pickerTexto}>No tienes clientes en tus clases actualmente.</Text>
          ) : (
            <View style={estilos.pickerContenedor}>
              {clientes.map((cliente) => (
                <Pressable
                  key={cliente.id}
                  style={[
                    estilos.pickerOpcion,
                    clienteIdSeleccionado === cliente.id && estilos.pickerOpcionSeleccionada
                  ]}
                  onPress={() => setClienteIdSeleccionado(cliente.id)}
                >
                  <Text style={estilos.pickerTexto}>{cliente.nombre}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={estilos.label}>2. Título de la Rutina</Text>
          <TextInput
            style={estilos.input}
            placeholder="Ej: Rutina de Pecho - Lunes"
            placeholderTextColor={Colores.textSecondary}
            value={tituloRutina}
            onChangeText={setTituloRutina}
          />
          
          <Text style={estilos.label}>3. Descripción (Ejercicios)</Text>
          <TextInput
            style={[estilos.input, {height: 200, textAlignVertical: 'top'}]}
            placeholder="Ej: 
- Press de banca: 4 series x 10 reps
- Aperturas con mancuerna: 3 series x 12 reps
..."
            placeholderTextColor={Colores.textSecondary}
            value={descripcionRutina}
            onChangeText={setDescripcionRutina}
            multiline
          />

          <Button 
            title={cargando ? "Asignando..." : "Asignar Rutina"}
            onPress={handleAsignarRutina} 
            disabled={cargando}
            color={Colores.primary}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Estilos (Dark Mode) ---
const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.background },
  contenedorCargando: { flex: 1, backgroundColor: Colores.background, justifyContent: 'center', alignItems: 'center'},
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.text, marginBottom: 10, paddingHorizontal: 20, marginTop: 20 },
  seccion: {
    backgroundColor: Colores.backgroundSecondary,
    borderRadius: 8,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  label: { fontSize: 16, color: Colores.textSecondary, marginBottom: 10, fontWeight: 'bold' },
  input: {
    backgroundColor: Colores.inputBackground,
    color: Colores.text,
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  // Picker simple
  pickerContenedor: { borderWidth: 1, borderColor: Colores.inputBorder, borderRadius: 5, marginBottom: 20, backgroundColor: Colores.inputBackground },
  pickerOpcion: { padding: 15, borderBottomWidth: 1, borderBottomColor: Colores.inputBorder },
  pickerOpcionSeleccionada: { backgroundColor: Colores.primary },
  pickerTexto: { color: Colores.text, fontSize: 16 }
});