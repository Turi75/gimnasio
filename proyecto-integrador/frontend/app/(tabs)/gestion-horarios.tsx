import React, { useState, useCallback, useRef } from 'react';
import { 
    View, Text, StyleSheet, TextInput, Button, 
    Alert, ActivityIndicator, ScrollView, Pressable, FlatList
} from 'react-native';
import clienteApi from '../../api/clienteApi';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colores } from '../../constants/theme';
import { CustomConfirmModal } from '../../components/CustomConfirmModal'; // Importamos el modal

// --- Tipos de Datos ---
interface Profesor { id: number; nombre: string; }

// Esta es la "Plantilla" de la nueva tabla
interface Plantilla {
  id: number;
  nombre_clase: string;
  nombre_profesor: string;
  dia_semana: number;
  hora_inicio: string; // "HH:MM:SS"
}

// Opciones para el selector de día
const diasSemana = [
  { label: 'Lunes', value: 2 },
  { label: 'Martes', value: 3 },
  { label: 'Miércoles', value: 4 },
  { label: 'Jueves', value: 5 },
  { label: 'Viernes', value: 6 },
  { label: 'Sábado', value: 7 },
  { label: 'Domingo', value: 1 },
];

// Helper para convertir el número del día (1-7) a texto
const getDiaTexto = (diaNum: number) => {
  return diasSemana.find(d => d.value === diaNum)?.label || 'Día';
};

// Componente simple de Picker (lo copiamos aquí para usarlo)
const CustomPicker = ({ selectedValue, onValueChange, options }: {
  selectedValue: any;
  onValueChange: (value: any) => void;
  options: { label: string; value: any }[];
}) => (
  <View style={estilos.pickerContenedor}>
    {options.map((opcion) => (
      <Pressable
        key={opcion.value}
        style={[estilos.pickerOpcion, opcion.value === selectedValue && estilos.pickerOpcionSeleccionada]}
        onPress={() => onValueChange(opcion.value)}
      >
        <Text style={estilos.pickerTexto}>{opcion.label}</Text>
      </Pressable>
    ))}
  </View>
);
// --- Fin del Picker ---


export default function GestionHorarios() {
  const [cargando, setCargando] = useState(true);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  
  // --- Estados del Formulario ---
  const [nombreClase, setNombreClase] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [profesorId, setProfesorId] = useState<number | string | null>(null);
  const [diaSemana, setDiaSemana] = useState<number>(2); // 2 = Lunes
  const [horaInicio, setHoraInicio] = useState('09:00'); // Formato HH:MM
  const [capacidad, setCapacidad] = useState('20');
  const [duracion, setDuracion] = useState('60');
  
  // --- Estados para Modales de Confirmación ---
  const [modalGenerarVisible, setModalGenerarVisible] = useState(false);
  const [modalBorrarVisible, setModalBorrarVisible] = useState(false);
  const [plantillaParaBorrar, setPlantillaParaBorrar] = useState<number | null>(null);

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const cargarDatos = async () => {
    try {
      setCargando(true);
      // Traemos profesores y plantillas existentes
      const [respProfesores, respPlantillas] = await Promise.all([
        clienteApi.get<Profesor[]>('/admin/profesores'),
        clienteApi.get<Plantilla[]>('/horarios/plantillas')
      ]);
      
      setProfesores(respProfesores.data);
      setPlantillas(respPlantillas.data);

      if (respProfesores.data.length > 0 && !profesorId) {
        setProfesorId(respProfesores.data[0].id);
      }
    } catch (error) { Alert.alert("Error", "No se pudieron cargar los datos."); }
    finally { setCargando(false); }
  };

  const limpiarFormulario = () => {
    setNombreClase(''); setDescripcion(''); setHoraInicio('09:00');
    setCapacidad('20'); setDuracion('60'); setDiaSemana(2);
  };

  // --- Lógica del Formulario ---
  const handleCrearPlantilla = async () => {
    if (!nombreClase || !profesorId || !horaInicio || !capacidad) {
      Alert.alert("Error", "Todos los campos son obligatorios."); return;
    }
    setCargando(true);
    try {
      await clienteApi.post('/horarios/plantillas', {
        nombre_clase: nombreClase,
        descripcion: descripcion,
        profesor_id: profesorId,
        dia_semana: diaSemana,
        hora_inicio: `${horaInicio}:00`, // Convertir HH:MM a HH:MM:SS
        duracion_minutos: parseInt(duracion) || 60,
        capacidad_maxima: parseInt(capacidad) || 20
      });
      limpiarFormulario();
      cargarDatos(); // Recarga la lista de plantillas
    } catch (error: any) {
      console.error("Error al crear plantilla:", error.response?.data);
      Alert.alert("Error", error.response?.data?.msg || "No se pudo crear la plantilla.");
    } finally { setCargando(false); }
  };

  // --- Lógica de Borrar Plantilla ---
  const handleEliminar = (plantillaId: number) => {
    setPlantillaParaBorrar(plantillaId);
    setModalBorrarVisible(true);
  };

  const ejecutarBorrado = async () => {
    if (!plantillaParaBorrar) return;
    try {
      await clienteApi.delete(`/horarios/plantillas/${plantillaParaBorrar}`);
      cargarDatos(); // Recarga la lista
    } catch (error: any) {
      console.error("Error al eliminar plantilla:", error.response?.data);
    } finally {
      setModalBorrarVisible(false);
      setPlantillaParaBorrar(null);
    }
  };

  // --- Lógica del "Botón Mágico" ---
  const ejecutarGenerarSemana = async () => {
    setModalGenerarVisible(false); // Cierra el modal de confirmación
    setCargando(true);
    try {
      // Llamamos al endpoint que crea las clases de los próximos 7 días
      const { data } = await clienteApi.post('/horarios/generar-semana');
      // Mostramos un Alert (simple, de OK) con el resultado
      Alert.alert("Generación Completa", data.msg || "Proceso finalizado.");
    } catch (error: any) {
      console.error("Error al generar la semana:", error.response?.data);
      Alert.alert("Error", error.response?.data?.msg || "No se pudo generar la semana.");
    } finally {
      setCargando(false);
    }
  };

  // --- Opciones para los Pickers ---
  const opcionesProfesores = profesores.map(p => ({ label: p.nombre, value: p.id }));

  return (
    <SafeAreaView style={estilos.contenedor}>
      <ScrollView>
        <Text style={estilos.titulo}>Gestión de Horario Fijo</Text>
        
        {/* --- 1. El Botón Mágico --- */}
        <View style={[estilos.seccion, {backgroundColor: Colores.primary}]}>
          <Text style={estilos.tituloBotonMagico}>Generar Clases</Text>
          <Text style={estilos.subtituloBotonMagico}>
            Presiona este botón 1 vez por semana (ej. los Domingos) para crear
            automáticamente todas las clases de los próximos 7 días en base a tus plantillas.
          </Text>
          <Button 
            title={cargando ? "Generando..." : "Generar Clases de la Próxima Semana"}
            onPress={() => setModalGenerarVisible(true)}
            disabled={cargando}
            color={Colores.success} // Botón verde
          />
        </View>

        {/* --- 2. Formulario de Creación de Plantilla --- */}
        <View style={estilos.seccion}>
          <Text style={estilos.subtitulo}>Crear Nueva Plantilla Semanal</Text>
          
          <Text style={estilos.label}>Nombre de la Clase</Text>
          <TextInput style={estilos.input} placeholder="Ej: Yoga para Principiantes" placeholderTextColor={Colores.textSecondary} value={nombreClase} onChangeText={setNombreClase} />
          <Text style={estilos.label}>Descripción</Text>
          <TextInput style={[estilos.input, {height: 80, textAlignVertical: 'top'}]} placeholder="Pequeña descripción" placeholderTextColor={Colores.textSecondary} value={descripcion} onChangeText={setDescripcion} multiline />
          
          <Text style={estilos.label}>Profesor</Text>
          <CustomPicker selectedValue={profesorId} onValueChange={setProfesorId} options={opcionesProfesores} />

          <Text style={estilos.label}>Día de la Semana</Text>
          <CustomPicker selectedValue={diaSemana} onValueChange={setDiaSemana} options={diasSemana} />

          <Text style={estilos.label}>Hora de Inicio (Formato 24hs: HH:MM)</Text>
          <TextInput style={estilos.input} placeholder="Ej: 09:00 o 18:30" placeholderTextColor={Colores.textSecondary} value={horaInicio} onChangeText={setHoraInicio} maxLength={5} />

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
          <Button title={cargando ? "Guardando..." : "Guardar Plantilla"} onPress={handleCrearPlantilla} disabled={cargando} color={Colores.primary} />
        </View>

        <View style={estilos.separador} />
        
        {/* --- 3. Lista de Plantillas Existentes --- */}
        <Text style={estilos.subtitulo}>Horario Semanal Programado</Text>
        {cargando && <ActivityIndicator color={Colores.text} />}
        {plantillas.length === 0 && !cargando ? (
           <Text style={estilos.textoVacio}>Aún no has creado ninguna plantilla de horario.</Text>
        ) : (
          plantillas.map((item) => (
            <View key={item.id} style={estilos.itemClase}>
              <View style={{flex: 1}}>
                <Text style={estilos.itemTitulo}>{item.nombre_clase}</Text>
                <Text style={estilos.itemTexto}>Prof: {item.nombre_profesor}</Text>
                <Text style={estilos.itemTexto}>
                  Cada {getDiaTexto(item.dia_semana)} a las {item.hora_inicio.substring(0, 5)} hs
                </Text>
              </View>
              <View style={estilos.botonesItem}>
                <Pressable onPress={() => handleEliminar(item.id)} style={[estilos.botonItem, {backgroundColor: Colores.danger}]}>
                  <Text style={estilos.botonItemTexto}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* --- Modales de Confirmación --- */}
      <CustomConfirmModal
        visible={modalGenerarVisible}
        titulo="Generar Semana"
        mensaje="¿Estás seguro de que quieres generar todas las clases para los próximos 7 días? Esto creará las clases individuales que los clientes podrán reservar."
        textoAceptar="Sí, Generar"
        onCancelar={() => setModalGenerarVisible(false)}
        onAceptar={ejecutarGenerarSemana}
      />
      <CustomConfirmModal
        visible={modalBorrarVisible}
        titulo="Eliminar Plantilla"
        mensaje="¿Estás seguro de que quieres eliminar esta plantilla del horario? Esto no afectará a las clases ya generadas."
        textoAceptar="Eliminar"
        onCancelar={() => {
          setModalBorrarVisible(false);
          setPlantillaParaBorrar(null);
        }}
        onAceptar={ejecutarBorrado}
      />
    </SafeAreaView>
  );
}

// --- Estilos ---
const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.background },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.text, marginBottom: 10, paddingHorizontal: 20, marginTop: 20 },
  subtitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.text, marginBottom: 20, paddingHorizontal: 20 },
  seccion: {
    backgroundColor: Colores.backgroundSecondary,
    borderRadius: 8,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  label: { fontSize: 16, color: Colores.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colores.inputBackground, color: Colores.text, borderRadius: 5, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  separador: { height: 2, backgroundColor: Colores.backgroundSecondary, marginVertical: 10 },
  textoVacio: { fontSize: 16, color: Colores.textSecondary, textAlign: 'center', marginHorizontal: 20 },
  
  // Botón Mágico
  tituloBotonMagico: { fontSize: 22, fontWeight: 'bold', color: Colores.text, marginBottom: 10 },
  subtituloBotonMagico: { fontSize: 15, color: Colores.text, marginBottom: 20, lineHeight: 22 },

  // Lista de plantillas
  itemClase: { backgroundColor: Colores.backgroundSecondary, borderRadius: 8, padding: 15, marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitulo: { fontSize: 18, fontWeight: 'bold', color: Colores.text },
  itemTexto: { fontSize: 14, color: Colores.textSecondary },
  botonesItem: { flexDirection: 'column', gap: 8 },
  botonItem: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, alignItems: 'center' },
  botonItemTexto: { color: Colores.text, fontWeight: 'bold', fontSize: 12 },
  
  // Picker simple
  pickerContenedor: { borderWidth: 1, borderColor: Colores.inputBorder, borderRadius: 5, marginBottom: 20, backgroundColor: Colores.inputBackground },
  pickerOpcion: { padding: 15, borderBottomWidth: 1, borderBottomColor: Colores.inputBorder },
  pickerOpcionSeleccionada: { backgroundColor: Colores.primary },
  pickerTexto: { color: Colores.text, fontSize: 16 },
});
