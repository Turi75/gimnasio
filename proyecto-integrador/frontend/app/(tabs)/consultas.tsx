import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TextInput, Button, 
    Alert, ActivityIndicator, ScrollView, Pressable, FlatList, Modal 
} from 'react-native';
import clienteApi from '../../api/clienteApi';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colores } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

// --- Tipos de Datos ---
interface Consulta {
  id: number;
  cliente_id: number;
  profesor_id: number;
  clase_id: number;
  mensaje: string;
  respuesta: string | null;
  fecha_consulta: string;
  fecha_respuesta: string | null;
  // (Campos extra añadidos por los JOINs)
  nombre_clase: string;
  nombre_profesor?: string; // Para el cliente
  nombre_cliente?: string; // Para el profesor
}
interface ClaseParaConsultar {
  id: number;
  nombre: string;
}

// ----------------------------------------------
// ---     COMPONENTE PARA EL PROFESOR        ---
// ----------------------------------------------
const VistaProfesorConsultas = () => {
  const [cargando, setCargando] = useState(true);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [consultaActual, setConsultaActual] = useState<Consulta | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarConsultasPendientes();
    }, [])
  );

  const cargarConsultasPendientes = async () => {
    setCargando(true);
    try {
      // 1. Traemos las consultas PENDIENTES (del backend que ya existía)
      const { data } = await clienteApi.get<Consulta[]>('/profesor/consultas-pendientes');
      setConsultas(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las consultas pendientes.");
    } finally {
      setCargando(false);
    }
  };

  const abrirModalRespuesta = (consulta: Consulta) => {
    setConsultaActual(consulta);
    setTextoRespuesta('');
    setModalVisible(true);
  };

  const handleResponder = async () => {
    if (!textoRespuesta || !consultaActual) return;
    
    try {
      // 2. Enviamos la respuesta (del backend que ya existía)
      await clienteApi.post(`/profesor/consultas/${consultaActual.id}/responder`, {
        respuesta: textoRespuesta
      });
      
      Alert.alert("Éxito", "Respuesta enviada.");
      setModalVisible(false);
      // Recargamos la lista para que desaparezca la consulta respondida
      cargarConsultasPendientes();

    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudo enviar la respuesta.");
    }
  };

  return (
    <>
      <FlatList
        data={consultas}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<Text style={estilos.subtitulo}>Consultas Pendientes de Alumnos</Text>}
        renderItem={({ item }) => (
          <Pressable style={estilos.tarjeta} onPress={() => abrirModalRespuesta(item)}>
            <Text style={estilos.textoNombre}>{item.nombre_cliente} (Clase: {item.nombre_clase})</Text>
            <Text style={estilos.textoFecha}>{new Date(item.fecha_consulta).toLocaleString('es-AR')}</Text>
            <Text style={estilos.textoMensaje}>" {item.mensaje} "</Text>
            <Text style={estilos.textoResponder}>Tocar para responder...</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          cargando ? <ActivityIndicator color={Colores.text} /> :
          <Text style={estilos.textoVacio}>No tienes consultas pendientes.</Text>
        }
      />

      {/* Modal para responder */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContenido}>
            <Text style={estilos.modalTitulo}>Responder a {consultaActual?.nombre_cliente}</Text>
            <Text style={estilos.modalMensajeOriginal}>"{consultaActual?.mensaje}"</Text>
            <TextInput
              style={[estilos.input, {height: 150, textAlignVertical: 'top'}]}
              placeholder="Escribe tu respuesta aquí..."
              placeholderTextColor={Colores.textSecondary}
              value={textoRespuesta}
              onChangeText={setTextoRespuesta}
              multiline
            />
            <View style={estilos.modalBotones}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} color={Colores.textSecondary} />
              <Button title="Enviar Respuesta" onPress={handleResponder} color={Colores.primary} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};


// ----------------------------------------------
// ---      COMPONENTE PARA EL CLIENTE        ---
// ----------------------------------------------
const VistaClienteConsultas = () => {
  const [cargando, setCargando] = useState(true);
  const [historial, setHistorial] = useState<Consulta[]>([]);
  const [clases, setClases] = useState<ClaseParaConsultar[]>([]);
  
  // --- Formulario ---
  const [claseId, setClaseId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarDatosCliente();
    }, [])
  );

  const cargarDatosCliente = async () => {
    setCargando(true);
    try {
      // 1. Traemos el historial y las clases para consultar (con los nuevos endpoints)
      const [respHistorial, respClases] = await Promise.all([
        clienteApi.get<Consulta[]>('/cliente/mis-consultas'),
        clienteApi.get<ClaseParaConsultar[]>('/cliente/clases-para-consultar')
      ]);
      setHistorial(respHistorial.data);
      setClases(respClases.data);
      // Seleccionamos la primera clase por defecto si existe
      if (respClases.data.length > 0 && !claseId) {
        setClaseId(respClases.data[0].id);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la información de consultas.");
    } finally {
      setCargando(false);
    }
  };

  const handleEnviarConsulta = async () => {
    if (!claseId || !mensaje) {
      Alert.alert("Error", "Debes seleccionar una clase y escribir un mensaje.");
      return;
    }
    
    try {
      // 2. Enviamos la nueva consulta (endpoint que ya existía)
      await clienteApi.post('/cliente/consultas', {
        clase_id: claseId,
        mensaje: mensaje
      });
      Alert.alert("Éxito", "Consulta enviada al profesor.");
      setMensaje(''); // Limpiamos
      cargarDatosCliente(); // Recargamos el historial
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudo enviar la consulta.");
    }
  };

  return (
    <ScrollView>
      {/* Sección 1: Enviar Nueva Consulta */}
      <View style={estilos.seccion}>
        <Text style={estilos.subtitulo}>Enviar Nueva Consulta</Text>
        
        <Text style={estilos.label}>Selecciona la clase:</Text>
        {clases.length === 0 ? (
          <Text style={estilos.pickerTexto}>Reserva una clase primero para poder enviar consultas.</Text>
        ) : (
          <View style={estilos.pickerContenedor}>
            {clases.map((clase) => (
              <Pressable
                key={clase.id}
                style={[
                  estilos.pickerOpcion,
                  claseId === clase.id && estilos.pickerOpcionSeleccionada
                ]}
                onPress={() => setClaseId(clase.id)}
              >
                <Text style={estilos.pickerTexto}>{clase.nombre}</Text>
              </Pressable>
            ))}
          </View>
        )}
        
        <Text style={estilos.label}>Tu mensaje para el profesor:</Text>
        <TextInput
          style={[estilos.input, {height: 100, textAlignVertical: 'top'}]}
          placeholder="Ej: ¿Qué ejercicio puedo hacer si me duele el hombro?"
          placeholderTextColor={Colores.textSecondary}
          value={mensaje}
          onChangeText={setMensaje}
          multiline
        />
        <Button 
          title="Enviar Consulta" 
          onPress={handleEnviarConsulta} 
          disabled={cargando || clases.length === 0} 
          color={Colores.primary}
        />
      </View>
      
      <View style={estilos.separador} />
      
      {/* Sección 2: Historial de Consultas */}
      <Text style={estilos.subtitulo}>Historial de Consultas</Text>
      {cargando && <ActivityIndicator color={Colores.text} />}
      {historial.length === 0 && !cargando ? (
        <Text style={estilos.textoVacio}>No tienes consultas anteriores.</Text>
      ) : (
        historial.map(item => (
          <View key={item.id} style={estilos.tarjetaHistorial}>
            <Text style={estilos.textoNombre}>Consulta sobre: {item.nombre_clase}</Text>
            <Text style={estilos.textoFecha}>{new Date(item.fecha_consulta).toLocaleString('es-AR')}</Text>
            <Text style={estilos.textoMensaje}>Tú: "{item.mensaje}"</Text>
            
            <View style={estilos.respuestaContenedor}>
              {item.respuesta ? (
                <>
                  <Text style={estilos.textoFecha}>{new Date(item.fecha_respuesta!).toLocaleString('es-AR')}</Text>
                  <Text style={estilos.textoMensaje}>Prof. {item.nombre_profesor}: "{item.respuesta}"</Text>
                </>
              ) : (
                <Text style={estilos.textoSinRespuesta}>El profesor aún no ha respondido.</Text>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};


// ----------------------------------------------
// ---      COMPONENTE PRINCIPAL (ROUTER)     ---
// ----------------------------------------------
export default function Consultas() {
    const { usuario } = useAuth();

    return (
      <SafeAreaView style={estilos.contenedor}>
        <Text style={estilos.titulo}>Consultas</Text>
        {
          !usuario ? <ActivityIndicator color={Colores.text} /> :
          usuario.rol === 'profesor' ? <VistaProfesorConsultas /> :
          <VistaClienteConsultas />
          // (Admin y Jefe no ven esta pantalla, ya la ocultamos en _layout.tsx)
        }
      </SafeAreaView>
    );
}

// --- Estilos (Dark Mode) ---
const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.background, paddingHorizontal: 20 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.text, marginTop: 20, marginBottom: 20 },
  subtitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.text, marginBottom: 15 },
  seccion: { backgroundColor: Colores.backgroundSecondary, borderRadius: 8, padding: 20, marginBottom: 20 },
  label: { fontSize: 16, color: Colores.textSecondary, marginBottom: 10 },
  input: {
    backgroundColor: Colores.inputBackground, color: Colores.text, borderRadius: 5,
    paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 20,
  },
  separador: { height: 1, backgroundColor: Colores.backgroundSecondary, marginVertical: 10, marginBottom: 20 },
  textoVacio: { fontSize: 16, color: Colores.textSecondary, textAlign: 'center', marginTop: 30 },
  
  // Picker simple
  pickerContenedor: { borderWidth: 1, borderColor: Colores.inputBorder, borderRadius: 5, marginBottom: 20, backgroundColor: Colores.inputBackground },
  pickerOpcion: { padding: 15, borderBottomWidth: 1, borderBottomColor: Colores.inputBorder },
  pickerOpcionSeleccionada: { backgroundColor: Colores.primary },
  pickerTexto: { color: Colores.text, fontSize: 16 },

  // --- Estilos Profesor ---
  tarjeta: {
    backgroundColor: Colores.backgroundSecondary, borderRadius: 8, padding: 15, marginBottom: 15,
  },
  textoNombre: { fontSize: 16, fontWeight: 'bold', color: Colores.text },
  textoFecha: { fontSize: 12, color: Colores.textSecondary, marginVertical: 5 },
  textoMensaje: { fontSize: 15, color: Colores.text, fontStyle: 'italic' },
  textoResponder: { fontSize: 14, color: Colores.primary, fontWeight: 'bold', marginTop: 10 },

  // --- Estilos Cliente (Historial) ---
  tarjetaHistorial: {
    backgroundColor: Colores.backgroundSecondary, borderRadius: 8, padding: 15, marginBottom: 15,
  },
  respuestaContenedor: {
    borderTopWidth: 1, borderColor: Colores.inputBackground, marginTop: 15, paddingTop: 15,
  },
  textoSinRespuesta: { fontSize: 15, color: Colores.textSecondary, fontStyle: 'italic' },
  
  // --- Estilos Modal ---
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContenido: {
    width: '90%', backgroundColor: Colores.backgroundSecondary, borderRadius: 10, padding: 20,
  },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: Colores.text, marginBottom: 10 },
  modalMensajeOriginal: {
    fontSize: 14, color: Colores.textSecondary, fontStyle: 'italic', marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: Colores.primary, paddingLeft: 10,
  },
  modalBotones: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
});