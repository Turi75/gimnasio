import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, SafeAreaView, Pressable, ActivityIndicator } from 'react-native';

// --- CORRECCIÓN DE RUTA ---
// (Debe subir 1 nivel: register.tsx -> app -> frontend/)
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { Colores } from '../constants/theme';
// --- FIN DE CORRECCIÓN ---

export default function PantallaRegistro() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    
    const { registrar, estado, mensajeError, limpiarError } = useAuth();

    useEffect(() => {
        limpiarError();
    }, [nombre, email, dni, password]);

    const alPresionarRegistro = async () => {
        await registrar({ nombre, email, password, dni });
    };

    return (
        <SafeAreaView style={estilos.contenedor}>
            <Text style={estilos.titulo}>Crear Cuenta</Text>
            
            <TextInput style={estilos.input} placeholder="Nombre Completo" placeholderTextColor={Colores.textSecondary} value={nombre} onChangeText={setNombre} />
            <TextInput style={estilos.input} placeholder="Correo Electrónico" placeholderTextColor={Colores.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={estilos.input} placeholder="DNI" placeholderTextColor={Colores.textSecondary} value={dni} onChangeText={setDni} keyboardType="numeric" />
            <TextInput style={estilos.input} placeholder="Contraseña" placeholderTextColor={Colores.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
            
            {mensajeError && (
                <View style={estilos.cartelError}>
                    <Text style={estilos.textoError}>{mensajeError}</Text>
                </View>
            )}

            {estado === 'cargando' ? (
                 <ActivityIndicator size="large" color={Colores.text} style={{ marginVertical: 10 }} />
            ) : (
                <Button title="Registrarme" onPress={alPresionarRegistro} color={Colores.primary} />
            )}
            
            <View style={{marginTop: 10}} />

            <Pressable onPress={() => router.back()} disabled={estado === 'cargando'}>
                <Text style={estilos.linkVolver}>Volver al inicio de sesión</Text>
            </Pressable>
            
        </SafeAreaView>
    );
}

// Estilos
const estilos = StyleSheet.create({
    contenedor: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: Colores.background },
    titulo: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: Colores.text },
    input: {
        height: 50,
        borderColor: Colores.inputBorder,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: Colores.inputBackground,
        color: Colores.text,
        fontSize: 16
    },
    linkVolver: {
        textAlign: 'center',
        color: Colores.textSecondary,
        fontSize: 16,
        padding: 10
    },
    cartelError: {
        backgroundColor: '#f8d7da',
        padding: 10,
        marginBottom: 15,
        borderRadius: 8,
    },
    textoError: {
        color: Colores.danger,
        textAlign: 'center',
        fontSize: 14
    }
});