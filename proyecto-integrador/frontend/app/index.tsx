import { Redirect } from 'expo-router';

/**
 * Este es el archivo "portero" de la aplicación.
 * * Su único trabajo es redirigir al usuario a la sección principal de la app "(tabs)".
 * El AuthProvider y el _layout.tsx (que ya tenemos) interceptarán
 * esta redirección. Al ver que el usuario NO está autenticado,
 * lo desviarán automáticamente a la pantalla de /login.
 * * Esto fuerza al router a moverse y no quedarse "congelado".
 */
export default function RootIndex() {
  
  // Redirige inmediatamente a la pantalla de inicio (que está dentro de 'tabs')
  // El _layout.tsx se encargará de frenar esto y enviarlo al login si es necesario.
  return <Redirect href="/(tabs)" />;
}