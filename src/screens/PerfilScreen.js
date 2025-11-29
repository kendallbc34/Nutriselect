import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase';

export default function PerfilScreen({ navigation }) {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagenPerfil, setImagenPerfil] = useState(null);

  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    edad: '',
    altura: '',
    peso: '',
    grasa: '',
    musculo: '',
  });

  const user = auth.currentUser;

  const subirImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setImagenPerfil(imageUri);

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `perfil/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'usuarios', user.uid), { fotoPerfil: downloadURL });

      Alert.alert('✅ Imagen de perfil actualizada');
    }
  };

  useEffect(() => {
    if (!user) return;

    const cargarDatos = async () => {
      try {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDatos(data);

          if (data.fotoPerfil) {
            setImagenPerfil(data.fotoPerfil);
          }
        } else {
          Alert.alert('No se encontraron los datos del usuario.');
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        Alert.alert('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    const pedirPermisos = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para cambiar tu foto.');
      }
    };

    pedirPermisos();
    cargarDatos();
  }, [user]);

  const handleChange = (campo, valor) => {
    setDatos(prev => ({ ...prev, [campo]: valor }));
  };

  const guardarCambios = async () => {
    try {
      await setDoc(doc(db, 'usuarios', user.uid), datos, { merge: true });
      Alert.alert('✅ Cambios guardados');
      setModoEdicion(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('❌ Error al guardar los cambios');
    }
  };

  const cerrarSesion = async () => {
    try {
      await auth.signOut();
      navigation.navigate('Welcome');
    } catch (error) {
      Alert.alert('Error al cerrar sesión');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={modoEdicion ? subirImagen : null}>
          <Image
            source={
              imagenPerfil
                ? { uri: imagenPerfil }
                : require('../../assets/perfil-azul.png')
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={{ fontSize: 12, color: '#001368ff' }}>
          {modoEdicion ? 'Toca para cambiar foto' : ''}
        </Text>

        {modoEdicion ? (
          <>
            <TextInput
              style={styles.input}
              value={datos.nombre}
              onChangeText={(text) => handleChange('nombre', text)}
              placeholder="Nombre"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              value={datos.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="Correo"
              placeholderTextColor="#888"
            />
          </>
        ) : (
          <>
            <Text style={styles.nombre}>{datos.nombre}</Text>
            <Text style={styles.email}>{datos.email}</Text>
          </>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Datos físicos</Text>

        {modoEdicion ? (
          <>
            <Campo label="Edad" valor={datos.edad} onChange={(v) => handleChange('edad', v)} />
            <Campo label="Altura" valor={datos.altura} onChange={(v) => handleChange('altura', v)} />
            <Campo label="Peso" valor={datos.peso} onChange={(v) => handleChange('peso', v)} />
            <Campo label="Grasa corporal" valor={datos.grasa} onChange={(v) => handleChange('grasa', v)} />
            <Campo label="Masa muscular" valor={datos.musculo} onChange={(v) => handleChange('musculo', v)} />
          </>
        ) : (
          <>
            <Text style={styles.infoText}>Edad: {datos.edad} </Text>
            <Text style={styles.infoText}>Altura: {datos.altura}</Text>
            <Text style={styles.infoText}>Peso: {datos.peso} </Text>
            <Text style={styles.infoText}>Grasa corporal: {datos.grasa}%</Text>
            <Text style={styles.infoText}>Masa muscular: {datos.musculo}%</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={modoEdicion ? guardarCambios : () => setModoEdicion(true)}
      >
        <Text style={styles.editButtonText}>
          {modoEdicion ? 'Guardar cambios' : 'Editar perfil'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: '#f44336', marginTop: 16 }]}
        onPress={cerrarSesion}
      >
        <Text style={styles.editButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const Campo = ({ label, valor, onChange }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={styles.infoText}>{label}:</Text>
    <TextInput
      style={styles.input}
      value={valor}
      onChangeText={onChange}
      placeholder={label}
      placeholderTextColor="#888"
      keyboardType="default"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#001368ff',
  },
  email: {
    fontSize: 14,
    color: '#020202ff',
  },
  infoCard: {
    backgroundColor: '#001368ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  editButton: {
    backgroundColor: '#001368ff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#ffffffff',
    color: '#000000ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    width: '100%',
    marginTop: 4,
  },
});
