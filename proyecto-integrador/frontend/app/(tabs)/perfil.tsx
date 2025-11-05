import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colores } from '../../constants/theme'; // Importamos el tema

export default function PantallaPerfil() {
    const { usuario, cerrarSesion } = useAuth();

    if (!usuario) {
        return (
            <SafeAreaView style={estilos.contenedor}>
                <ActivityIndicator color={Colores.text} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={estilos.contenedor}>
            <Text style={estilos.titulo}>Mi Perfil</Text>
            
            <View style={estilos.tarjeta}>
                <Text style={estilos.linea}><Text style={estilos.label}>Nombre:</Text> {usuario.nombre}</Text>
                <Text style={estilos.linea}><Text style={estilos.label}>Email:</Text> {usuario.email}</Text>
                <Text style={estilos.linea}><Text style={estilos.label}>DNI:</Text> {usuario.dni}</Text>
                <Text style={estilos.linea}><Text style={estilos.label}>Rol:</Text> {usuario.rol}</Text>
                {/* Quitamos el estado_pago de aquí. 
                  Lo mejor es hacer una llamada API separada en esta pantalla
                  para obtener el estado de pago y no sobrecargar el AuthContext.
                */}
            </View>
            
            <Button title="Cerrar Sesión" onPress={cerrarSesion} color={Colores.danger} />
        </SafeAreaView>
    );
}

// --- ESTILOS DARK MODE (Como tu captura) ---
const estilos = StyleSheet.create({
    contenedor: { 
        flex: 1, 
        padding: 20, 
        backgroundColor: Colores.background 
    },
    titulo: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        marginBottom: 20,
        color: Colores.text
    },
    tarjeta: {
        backgroundColor: Colores.backgroundSecondary,
        borderRadius: 8,
        padding: 20,
        marginBottom: 30,
    },
    linea: { 
        fontSize: 18, 
        marginBottom: 12,
        color: Colores.text
    },
    label: { 
        fontWeight: 'bold',
        color: Colores.textSecondary
    }
});