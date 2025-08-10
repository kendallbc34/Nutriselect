import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Text } from 'react-native';
import LogoImage from '../../assets/logo-limpio.png';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY }],
          alignItems: 'center',
        }}
      >
        <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>NutriSelect</Text>
      </Animated.View>

      <Animated.Text style={[styles.slogan, { opacity: fadeAnim }]}>
        Tu mejor aliado para alcanzar tus objetivos
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 120,
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginTop: 8,
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 15,
    color: '#cccccc',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
