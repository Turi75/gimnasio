import React from 'react';
import { Modal, View, Text, Button, StyleSheet, Pressable } from 'react-native';
import { Colores } from '../constants/theme'; // Importamos nuestros colores

interface Props {
  visible: boolean;
  titulo: string;
  mensaje: string;
  textoCancelar?: string;
  textoAceptar?: string;
  onCancelar: () => void;
  onAceptar: () => void;
}

/**
 * Este es nuestro propio modal de confirmación "dentro de la página"
 * que reemplaza los 'Alert' y 'window.confirm'.
 */
export const CustomConfirmModal = ({ 
  visible, 
  titulo, 
  mensaje,
  textoCancelar = "Cancelar",
  textoAceptar = "Aceptar", // Usamos 'Aceptar' como en tu captura
  onCancelar, 
  onAceptar 
}: Props) => {
  return (
    <Modal
      animationType="fade"
      transparent={true} // El fondo es semi-transparente
      visible={visible}
      onRequestClose={onCancelar} // Permite cerrar con 'Esc' o botón atrás
    >
      {/* Overlay oscuro */}
      <Pressable style={estilos.modalOverlay} onPress={onCancelar}>
        <Pressable style={estilos.modalContenido} onPress={() => {}}>
          {/* Contenido del Modal (evita que el clic se propague) */}
          <Text style={estilos.modalTitulo}>{titulo}</Text>
          <Text style={estilos.modalMensaje}>{mensaje}</Text>
          
          {/* Botones */}
          <View style={estilos.modalBotones}>
            <Pressable 
              style={[estilos.boton, estilos.botonCancelar]} 
              onPress={onCancelar}
            >
              <Text style={estilos.textoBoton}>{textoCancelar}</Text>
            </Pressable>
            <Pressable 
              style={[estilos.boton, estilos.botonAceptar]} 
              onPress={onAceptar}
            >
              <Text style={estilos.textoBoton}>{textoAceptar}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const estilos = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', // Fondo negro semi-transparente
  },
  modalContenido: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colores.backgroundSecondary, // Color de tarjeta oscuro
    borderRadius: 8,
    padding: 25,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colores.text,
    marginBottom: 10,
  },
  modalMensaje: {
    fontSize: 16,
    color: Colores.textSecondary,
    marginBottom: 30,
    lineHeight: 24,
  },
  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Botones a la derecha
    gap: 15,
  },
  boton: {
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  botonCancelar: {
    backgroundColor: Colores.inputBackground, // Gris
  },
  botonAceptar: {
    backgroundColor: Colores.danger, // Rojo (como en tu captura)
  },
  textoBoton: {
    color: Colores.text,
    fontWeight: 'bold',
  }
});