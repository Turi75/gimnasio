import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, SafeAreaView, Pressable, ActivityIndicator } from 'react-native';

// --- RUTAS DE IMPORTACIÓN CORRECTAS ---
// (Suben 1 nivel: login.tsx -> app -> frontend/)
import { useAuth } from '../context/AuthContext';
import { Link } from 'expo-router';
import { Colores } from '../constants/theme';
// --- FIN DE RUTAS ---

import { Ionicons } from '@expo/vector-icons'; 

// --- ¡NUEVAS IMPORTACIONES PARA GOOGLE! ---
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Asegura que el pop-up de Google se pueda abrir
WebBrowser.maybeCompleteAuthSession();
// --- FIN DE NUEVAS IMPORTACIONES ---

export default function PantallaLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // --- ACTUALIZACIÓN DEL CONTEXT ---
    // ¡Ahora también traemos 'iniciarSesionGoogle'!
    const { 
      iniciarSesion, 
      estado, 
      mensajeError, 
      limpiarError, 
      iniciarSesionGoogle 
    } = useAuth();
    // --- FIN DE ACTUALIZACIÓN ---


    // --- ¡NUEVO HOOK DE GOOGLE! ---
    // Usamos el ID de cliente que generaste
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '685546139975-c8s95t92sie1hf8ihp2mqagoo5q07ajo.apps.googleusercontent.com',
    });

    // Este useEffect se activa cuando Google responde
    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                // Si Google nos da un token, se lo enviamos a nuestro backend
                // (El backend lo valida, busca el usuario, lo crea si es nuevo, y nos da nuestro propio token JWT)
                iniciarSesionGoogle(authentication.accessToken);
            }
        }
    }, [response]);
    // --- FIN DE HOOK DE GOOGLE ---


    useEffect(() => {
        if (email || password) {
            limpiarError();
        }
    }, [email, password]);

    const alPresionarLogin = async () => {
        await iniciarSesion({ email, password });
    };

    // --- ACTUALIZACIÓN DE BOTÓN ---
    const handleLoginGoogle = () => {
      // 'promptAsync' abre el pop-up de inicio de sesión de Google
      promptAsync();
    };
    
    const handleLoginFacebook = () => {
      alert("Inicio de sesión con Facebook (aún no implementado)");
    };
    // --- FIN DE ACTUALIZACIÓN ---

    return (
        <SafeAreaView style={estilos.contenedor}>
            <Text style={estilos.titulo}>Gimnasio App</Text>
            
            <TextInput
                style={estilos.input}
                placeholder="Correo Electrónico"
                placeholderTextColor={Colores.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={estilos.input}
                placeholder="Contraseña"
                placeholderTextColor={Colores.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            
            {mensajeError && (
                <View style={estilos.cartelError}>
                    <Text style={estilos.textoError}>{mensajeError}</Text>
                </View>
            )}

            {estado === 'cargando' ? (
                <ActivityIndicator size="large" color={Colores.text} style={{ marginVertical: 10 }} />
            ) : (
                // Deshabilitamos el botón si el hook de Google aún no está listo
                <Button 
                  title="Iniciar Sesión" 
                  onPress={alPresionarLogin} 
                  color={Colores.primary} 
                  disabled={!request}
                />
            )}
            
            <Link href="/register" asChild>
                <Pressable>
                    <Text style={estilos.linkRegistro}>
                        ¿No tienes cuenta? Regístrate aquí
                    </Text>
                </Pressable>
            </Link>
            
            <Text style={estilos.textoO}>o</Text>
            
            <Pressable 
              style={[estilos.botonSocial, { backgroundColor: '#DB4437' }]} 
              onPress={handleLoginGoogle}
              disabled={!request || estado === 'cargando'} // Deshabilitar si se está cargando
            >
              <Ionicons name="logo-google" size={20} color="white" style={estilos.iconoSocial} />
              <Text style={estilos.textoBotonSocial}>Continuar con Google</Text>
            </Pressable>
            
            <Pressable 
              style={[estilos.botonSocial, { backgroundColor: '#4267B2' }]} 
              onPress={handleLoginFacebook}
              disabled={estado === 'cargando'}
            >
              <Ionicons name="logo-facebook" size={20} color="white" style={estilos.iconoSocial} />
              <Text style={estilos.textoBotonSocial}>Continuar con Facebook</Text>
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
    linkRegistro: {
        textAlign: 'center',
        color: Colores.primary,
        marginTop: 20,
        fontSize: 16
    },
    cartelError: {
        backgroundColor: '#8b0000',
        borderColor: Colores.danger,
        borderWidth: 1,
        padding: 10,
        marginBottom: 15,
        borderRadius: 8,
    },
    textoError: {
        color: Colores.text,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
    },
    textoO: {
      color: Colores.textSecondary,
      textAlign: 'center',
      fontSize: 16,
      marginVertical: 20,
    },
    botonSocial: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
      borderRadius: 8,
      marginBottom: 15,
    },
    iconoSocial: {
      marginRight: 10,
    },
    textoBotonSocial: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    }
});