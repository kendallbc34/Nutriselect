import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession(); // Necesario para Expo Auth Session

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // Configuración de Google Auth con scheme
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '714516659695-d6250lmnairlkhkjn55hvb5ktr4tmqu4.apps.googleusercontent.com',
    iosClientId: '714516659695-6if0djbaebgbkh3ncnejo8crpohk9l95.apps.googleusercontent.com', // opcional si no usas iOS
    androidClientId: 'TU_CLIENT_ID_DE_ANDROID', // opcional si no usas Android
    webClientId: 'TU_CLIENT_ID_DE_WEB', // necesario para web
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'nutriselectapp', // Debe coincidir con tu scheme en app.json
    }),
  });

  // Detecta la respuesta de Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('Token de Google:', authentication.accessToken);
      Alert.alert('Login Google', '¡Inicio de sesión con Google exitoso!');
      // Aquí puedes loguear en Firebase usando el token
      // Ejemplo:
      // const credential = GoogleAuthProvider.credential(authentication.idToken);
      // signInWithCredential(auth, credential);
    }
  }, [response]);

  // Login con email y contraseña
  const handleLogin = async () => {
    if (!correo || !contraseña) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, correo, contraseña);
      const user = userCredential.user;

      const docRef = doc(db, 'usuarios', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log('Datos del usuario:', userData);
        Alert.alert('Inicio de sesión', '¡Bienvenido ' + userData.nombre + '!');
        navigation.replace('Home', { user: userData });
      } else {
        Alert.alert('Error', 'No se encontraron los datos del usuario.');
      }
      
    } catch (error) {
      console.error('Error al iniciar sesión:', error.code, error.message);
      let mensaje = 'Ocurrió un error al iniciar sesión.';

      if (error.code === 'auth/user-not-found') mensaje = 'El usuario no existe.';
      else if (error.code === 'auth/wrong-password') mensaje = 'Contraseña incorrecta.';
      else if (error.code === 'auth/invalid-email') mensaje = 'Correo no válido.';

      Alert.alert('Error', mensaje);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Image
        source={require('../../assets/logo-limpio-azul.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={[styles.input, focusedField === 'correo' && styles.inputFocused]}
        placeholder="Correo electrónico"
        placeholderTextColor="#999"
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
        value={correo}
        onFocus={() => setFocusedField('correo')}
        onBlur={() => setFocusedField(null)}
        selectionColor="#2EB86E"
      />

      <TextInput
        style={[styles.input, focusedField === 'contraseña' && styles.inputFocused]}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        onChangeText={setContraseña}
        secureTextEntry
        value={contraseña}
        onFocus={() => setFocusedField('contraseña')}
        onBlur={() => setFocusedField(null)}
        selectionColor="#2EB86E"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={[styles.googleButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
  onPress={() => promptAsync()} // tu función de login
>
  <Image
    source={require('../../assets/google.png')} // ajusta la ruta si es necesario
    style={{ width: 24, height: 24, marginRight: 10 }}
    resizeMode="contain"
  />
  <Text style={[styles.buttonText, { color: '#000', fontWeight: 'bold' }]}>
    Continuar con Google
  </Text>
</TouchableOpacity>


      <TouchableOpacity
        onPress={() =>
          Alert.alert('Recuperar contraseña', 'Funcionalidad aún no implementada')
        }
      >
        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: '#ffffffff',
    flexGrow: 1,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#000000ff',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fffdfdff',
    color: '#030303ff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
    fontSize: 16,
    width: '100%',
    maxWidth: 400,
  },
  inputFocused: {
    borderColor: '#001aafff',
    shadowColor: '#0004ffff',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  button: {
    backgroundColor: '#2e2c9eff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    marginTop: 10,
    elevation: 4,
    borderLeftWidth: 6,
    borderLeftColor: '#4745f0ff',
    borderRightWidth: 6,
    borderRightColor: '#4745f0ff',
    alignItems: 'center',
  },
  googleButton: {
  backgroundColor: '#fff',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  shadowColor: '#0011faff',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 3, // para Android
   marginTop: 16,   // espacio arriba
  marginBottom: 16 // espacio abajo
},
buttonText: {
  fontSize: 16,
},

  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffffff',
    textAlign: 'center',
  },
  forgotText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
