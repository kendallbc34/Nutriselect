import React, { useState } from 'react';
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

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
  if (!correo || !contraseña) {
    Alert.alert('Error', 'Por favor completa todos los campos.');
    return;
  }

  try {
    // Iniciar sesión con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, correo, contraseña);
    const user = userCredential.user;

    // Obtener datos desde Firestore
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
      {/* Logo centrado opcional */}
      <Image
        source={require('../../assets/logo-limpio.png')}
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
    backgroundColor: '#121212',
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
    color: '#ffffffff',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
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
    borderColor: '#ffee00ff',
    shadowColor: '#ffee00ff',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  button: {
    backgroundColor: '#ffffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    marginTop: 10,
    elevation: 4,
    borderLeftWidth: 6,
    borderLeftColor: '#4d4d4dff',
    borderRightWidth: 6,
    borderRightColor: '#4d4d4dff',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000ff',
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
