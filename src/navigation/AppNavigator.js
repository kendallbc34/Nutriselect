import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProgresoScreen from '../screens/ProgresoScreen';
import RecetasScreen from '../screens/RecetasScreen';
import AgregarComidaScreen from '../screens/AgregarComidaScreen';
import AgregarActividadScreen from '../screens/AgregarActividadScreen';
import PlanificacionScreen from '../screens/PlanificacionScreen';
import PerfilScreen from '../screens/PerfilScreen'; // Asegúrate de este
import NutrigiaScreen from '../screens/NutrigiaScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Progreso" component={ProgresoScreen} />
        <Stack.Screen name="Recetas" component={RecetasScreen} />
        <Stack.Screen name="AgregarComida" component={AgregarComidaScreen} />
        <Stack.Screen name="AgregarActividad" component={AgregarActividadScreen} />
        <Stack.Screen name="Planificacion" component={PlanificacionScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="NutrigIA" component={NutrigiaScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}






