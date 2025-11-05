import React, { useState, useCallback, useRef } from 'react';
import { 
    View, Text, StyleSheet, TextInput, Button, 
    Alert, ActivityIndicator, ScrollView, Pressable, 
    Platform
} from 'react-native';
import clienteApi from '../../api/clienteApi';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colores } from '../../constants/theme';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CustomConfirmModal } from '../../components/CustomConfirmModal';

// (Tipos de datos sin cambios)
interface Profesor { id: number; nombre: string; }
interface Clase {
  id: number; nombre: string; descripcion: string; profesor_id: number;
  fecha_hora: string; duracion_minutos: number; capacidad_maxima: number;
  nombre_profesor: string | null;
}

// --- ¡FUNCIONES HELPER CORREGIDAS! ---
// Usan los componentes LOCALES de la fecha
const toYYYYMMDD = (d: Date) => {
  return [
    d.getFullYear(),
    ('0' + (d.getMonth() + 1)).slice(-2), // +1 porque Enero es 0
    ('0' + d.getDate()).slice(-2)
  ].join('-');
};
const toHHMM = (d: Date) => {
  return [
    ('0' + d.getHours()).slice(-2), // getHours() es la hora local
    ('0' + d.getMinutes()).slice(-2) // getMinutes() es el minuto local
  ].join(':');
};
// ------------------------------------

export default function GestionClases() {
  const [cargando, setCargando] = useState(true);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [nombreClase, setNombreClase] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [profesorId, setProfesorId] = useState<number | string | null>(null);
  const [capacidad, setCapacidad] = useState('');
  const [duracion, setDuracion] = useState('60');
  
  const [fecha, setFecha] = useState(new Date()); 
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [mostrarTimePicker, setMostrarTimePicker] = useState(false);
  
  const [webDate, setWebDate] = useState(toYYYYMMDD(new Date()));
  const [webTime, setWebTime] = useState(toHHMM(new Date()));

  const [clasesExistentes, setClasesExistentes] = useState<Clase[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [claseParaBorrar, setClaseParaBorrar] = useState<number | null>(null);

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [respProfesores, respClases] = await Promise.all([
        clienteApi.get<Profesor[]>('/admin/profesores'),
        clienteApi.get<Clase[]>('/admin/clases')
      ]);
      setProfesores(respProfesores.data);
      setClasesExistentes(respClases.data);
      if (respProfesores.data.length > 0 && !profesorId) {
        setProfesorId(respProfesores.data[0].id);
      }
    } catch (error) { 
        console.error("Error cargando datos:", error);
        Alert.alert("Error", "No se pudieron cargar los datos."); 
    }
    finally { setCargando(false); }
  };

  const onFechaChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setMostrarDatePicker(false);
    if (selectedDate) {
      setFecha(selectedDate);
      setWebDate(toYYYYMMDD(selectedDate));
      setWebTime(toHHMM(selectedDate));
    }
  };
  const onHoraChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setMostrarTimePicker(false);
    if (selectedDate) {
      setFecha(selectedDate);
      setWebDate(toYYYYMMDD(selectedDate));
      setWebTime(toHHMM(selectedDate));
    }
  };

  const limpiarFormulario = () => {
    setEditandoId(null); setNombreClase(''); setDescripcion('');
    setCapacidad(''); setDuracion('60'); 
    const now = new Date();
    setFecha(now);
    setWebDate(toYYYYMMDD(now));
    setWebTime(toHHMM(now));
    if (profesores.length > 0) setProfesorId(profesores[0].id);
  };

  // --- LÓGICA DE GUARDAR (handleSubmitClase) CORREGIDA ---
  const handleSubmitClase = async () => {
    if (!nombreClase || !profesorId || !capacidad) {
      Alert.alert("Error", "Todos los campos son obligatorios."); return;
    }
    
    let fechaFinalISO: string;
    
    if (Platform.OS === 'web') {
      if (!webDate || !webTime) {
        Alert.alert("Error", "La fecha y hora son obligatorias."); return;
      }
      
      // --- ¡ESTA ES LA CORRECCIÓN! ---
      // Creamos la fecha manualmente a partir de los strings
      // para forzar a que sea interpretada como HORA LOCAL.
      const dateParts = webDate.split('-').map(Number); // [2025, 11, 3]
      const timeParts = webTime.split(':').map(Number); // [10, 0]
      
      // Creamos la fecha local: new Date(Año, Mes (0-11), Dia, Hora, Minuto)
      const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);
      
      // Ahora sí, convertimos la fecha LOCAL a un string UTC para el backend
      fechaFinalISO = localDate.toISOString();
      // (Ej: 10:00 AM Argentina (UTC-3) -> "2025-11-03T13:00:00.000Z")

    } else {
      // La lógica de móvil ya usa el objeto 'fecha' local
      fechaFinalISO = fecha.toISOString();
    }
    // ----------------------------------------------------

    setCargando(true);
    const datosClase = {
      nombre: nombreClase, descripcion: descripcion, profesor_id: profesorId,
      fecha_hora: fechaFinalISO, // Enviamos el string UTC correcto
      duracion_minutos: parseInt(duracion) || 60,
      capacidad_maxima: parseInt(capacidad)
    };
    try {
      if (editandoId) {
        await clienteApi.put(`/admin/clases/${editandoId}`, datosClase);
      } else {
        await clienteApi.post('/admin/clases', datosClase);
      }
      limpiarFormulario(); cargarDatos();
    } catch (error: any) {
      console.error("Error al guardar:", error.response?.data?.msg);
      Alert.alert("Error", error.response?.data?.msg || "No se pudo guardar la clase.");
    } finally { setCargando(false); }
  };

  const handleEliminar = (claseId: number) => {
    setClaseParaBorrar(claseId);
    setModalVisible(true);
  };

  const ejecutarBorrado = async () => {
    if (!claseParaBorrar) return;
    try {
      await clienteApi.delete(`/admin/clases/${claseParaBorrar}`);
      cargarDatos();
    } catch (error: any) {
      console.error("Error al eliminar la clase:", error.response?.data?.msg);
    } finally {
      setModalVisible(false);     
      setClaseParaBorrar(null); 
    }
  };

  // --- LÓGICA DE EDITAR (iniciarEdicion) CORREGIDA ---
  const iniciarEdicion = (clase: Clase) => {
    setEditandoId(clase.id); setNombreClase(clase.nombre);
    setDescripcion(clase.descripcion || ''); setProfesorId(clase.profesor_id);
    
    // El backend nos da un string UTC (Ej: "...T04:00:00.000Z")
    // new Date() lo convierte a un objeto Date en la HORA LOCAL del navegador
    // (Ej: 1:00 AM en Argentina (UTC-3))
    const fechaDeClase = new Date(clase.fecha_hora);
    
    // Usamos nuestras helpers locales (toHHMM usa .getHours())
    setFecha(fechaDeClase); // Para móvil
    setWebDate(toYYYYMMDD(fechaDeClase)); // Para web (Ej: "2025-11-03")
    setWebTime(toHHMM(fechaDeClase));   // Para web (Ej: "01:00")
    
    setCapacidad(clase.capacidad_maxima.toString());
    setDuracion(clase.duracion_minutos.toString());
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };


  // --- Renderizado (sin cambios) ---
  return (
    <SafeAreaView style={estilos.contenedor}>
      <ScrollView ref={scrollViewRef}>
        <Text style={estilos.titulo}>Gestión de Clases</Text>
        
        {/* Formulario de Creación / Edición */}
        <View style={estilos.seccion}>
          <Text style={estilos.subtitulo}>{editandoId ? "Editando Clase" : "Crear Nueva Clase"}</Text>
          <Text style={estilos.label}>Nombre de la Clase</Text>
          <TextInput style={estilos.input} placeholder="Ej: Yoga Matutino" placeholderTextColor={Colores.textSecondary} value={nombreClase} onChangeText={setNombreClase} />
          <Text style={estilos.label}>Descripción</Text>
          <TextInput style={[estilos.input, {height: 80, textAlignVertical: 'top'}]} placeholder="Pequeña descripción de la clase" placeholderTextColor={Colores.textSecondary} value={descripcion} onChangeText={setDescripcion} multiline />
          <Text style={estilos.label}>Asignar Profesor</Text>
          {profesores.length > 0 ? (
            <View style={estilos.pickerContenedor}>
              {profesores.map((profe) => (
                <Pressable key={profe.id} style={[ estilos.pickerOpcion, profesorId === profe.id && estilos.pickerOpcionSeleccionada ]} onPress={() => setProfesorId(profe.id)}>
                  <Text style={estilos.pickerTexto}>{profe.nombre}</Text>
                </Pressable>
              ))}
            </View>
          ) : ( <ActivityIndicator color={Colores.text} /> )}

          {/* Renderizado condicional de Fecha/Hora */}
          <Text style={estilos.label}>Fecha y Hora</Text>
          
          {Platform.OS === 'web' ? (
            <View style={estilos.webPickerContenedor}>
              <TextInput
                style={[estilos.input, estilos.webDateInput]}
                value={webDate}
                onChangeText={setWebDate}
                // @ts-ignore - 'type' es una prop de input web
                type="date" 
              />
              <TextInput
                style={[estilos.input, estilos.webDateInput]}
                value={webTime}
                onChangeText={setWebTime}
                // @ts-ignore - 'type' es una prop de input web
                type="time"
              />
            </View>
          ) : (
            <>
              <Text style={estilos.textoFecha}>{fecha.toLocaleString('es-AR')}</Text>
              <View style={estilos.botonesFechaContenedor}>
                <Button title="Seleccionar Fecha" onPress={() => setMostrarDatePicker(true)} />
                <Button title="Seleccionar Hora" onPress={() => setMostrarTimePicker(true)} />
              </View>
              {mostrarDatePicker && ( <DateTimePicker value={fecha} mode="date" display="default" onChange={onFechaChange} /> )}
              {mostrarTimePicker && ( <DateTimePicker value={fecha} mode="time" display="default" onChange={onHoraChange} /> )}
            </>
          )}

          <View style={estilos.inputRow}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={estilos.label}>Capacidad</Text>
              <TextInput style={estilos.input} placeholder="Ej: 20" placeholderTextColor={Colores.textSecondary} value={capacidad} onChangeText={setCapacidad} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
              <Text style={estilos.label}>Duración (min)</Text>
              <TextInput style={estilos.input} placeholder="Ej: 60" placeholderTextColor={Colores.textSecondary} value={duracion} onChangeText={setDuracion} keyboardType="numeric" />
            </View>
          </View>
          <Button title={cargando ? "Guardando..." : (editandoId ? "Actualizar Clase" : "Crear Clase")} onPress={handleSubmitClase} disabled={cargando} color={editandoId ? Colores.success : Colores.primary} />
          {editandoId && (
            <View style={{marginTop: 10}}>
              <Button title="Cancelar Edición" onPress={limpiarFormulario} color={Colores.textSecondary} />
            </View>
          )}
        </View>

        <View style={estilos.separador} />
        
        {/* Lista de Clases Existentes */}
        <Text style={estilos.subtitulo}>Clases Programadas</Text>
        {cargando && <ActivityIndicator color={Colores.text} />}
        {clasesExistentes.length === 0 && !cargando ? (
           <Text style={estilos.textoVacio}>No hay clases programadas.</Text>
        ) : (
          clasesExistentes.map((item) => (
            <View key={item.id} style={estilos.itemClase}>
              <View style={{flex: 1}}>
                <Text style={estilos.itemTitulo}>{item.nombre}</Text>
                <Text style={estilos.itemTexto}>Prof: {item.nombre_profesor || 'N/A'}</Text>
                {/* Mostramos la hora local correcta */}
                <Text style={estilos.itemTexto}>{new Date(item.fecha_hora).toLocaleString('es-AR')}</Text>
              </View>
              <View style={estilos.botonesItem}>
                <Pressable onPress={() => iniciarEdicion(item)} style={[estilos.botonItem, {backgroundColor: Colores.primary}]}>
                  <Text style={estilos.botonItemTexto}>Editar</Text>
                </Pressable>
                <Pressable onPress={() => handleEliminar(item.id)} style={[estilos.botonItem, {backgroundColor: Colores.danger}]}>
                  <Text style={estilos.botonItemTexto}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de Confirmación */}
      <CustomConfirmModal
        visible={modalVisible}
        titulo="Confirmar Eliminación"
        mensaje="¿Estás seguro de que quieres eliminar esta clase? Esta acción no se puede deshacer."
        textoAceptar="Eliminar"
        onCancelar={() => {
          setModalVisible(false);
          setClaseParaBorrar(null);
        }}
        onAceptar={ejecutarBorrado}
      />
    </SafeAreaView>
  );
}

// --- Estilos (sin cambios) ---
const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.background },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.text, marginBottom: 10, paddingHorizontal: 20, marginTop: 20 },
  subtitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.text, marginBottom: 20, paddingHorizontal: 20 },
  seccion: { backgroundColor: Colores.backgroundSecondary, borderRadius: 8, padding: 20, marginHorizontal: 20, marginBottom: 20 },
  label: { fontSize: 16, color: Colores.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colores.inputBackground, color: Colores.text, borderRadius: 5, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  textoFecha: { fontSize: 18, color: Colores.text, marginBottom: 10, alignSelf: 'center' },
  botonesFechaContenedor: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  separador: { height: 2, backgroundColor: Colores.backgroundSecondary, marginVertical: 10 },
  textoVacio: { fontSize: 16, color: Colores.textSecondary, textAlign: 'center', marginHorizontal: 20 },
  itemClase: { backgroundColor: Colores.backgroundSecondary, borderRadius: 8, padding: 15, marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitulo: { fontSize: 18, fontWeight: 'bold', color: Colores.text },
  itemTexto: { fontSize: 14, color: Colores.textSecondary },
  botonesItem: { flexDirection: 'column', gap: 8 },
  botonItem: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, alignItems: 'center' },
  botonItemTexto: { color: Colores.text, fontWeight: 'bold', fontSize: 12 },
  pickerContenedor: { borderWidth: 1, borderColor: Colores.inputBorder, borderRadius: 5, marginBottom: 20, backgroundColor: Colores.inputBackground },
  pickerOpcion: { padding: 15, borderBottomWidth: 1, borderBottomColor: Colores.inputBorder },
  pickerOpcionSeleccionada: { backgroundColor: Colores.primary },
  pickerTexto: { color: Colores.text, fontSize: 16 },
  webPickerContenedor: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  webDateInput: { flex: 1, paddingVertical: 8 }
});