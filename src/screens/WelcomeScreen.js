import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import LogoImage from '../../assets/logo-limpio-azul.png';

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Bienvenido a NutriSelect</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonFilled} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.buttonTextFilled}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonOutlined} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonTextOutlined}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    color: '#0a0a0aff',
    fontWeight: '700',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  buttonFilled: {
    backgroundColor: '#2e2c9eff',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
  },
  buttonTextFilled: {
    color: '#ffffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutlined: {
    borderWidth: 2,
    borderColor: '#000000ff',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonTextOutlined: {
    color: '#000000ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
