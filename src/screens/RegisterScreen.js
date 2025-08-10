import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';

const opcionesSexo = ['Hombre', 'Mujer', 'Otro'];
const opcionesActividad = [
  'Sedentario (0-1 días por semana)',
  'Ligero (1-3 días por semana)',
  'Moderado (3-5 días por semana)',
  'Intenso (6-7 días por semana)',
];
const opcionesObjetivo = ['Perder peso', 'Mantener peso', 'Ganar peso'];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    sexo: '',
    edad: '',
    peso: '',
    altura: '',
    nivel_actividad: '',
    objetivo: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalField, setModalField] = useState('');
  const [modalOptions, setModalOptions] = useState([]);
  const [step, setStep] = useState(1);

  // Control de foco para destacar input/select
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const openModal = (field, options) => {
    setModalField(field);
    setModalOptions(options);
    setModalVisible(true);
    setFocusedField(field);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFocusedField(null);
  };

  const handleSubmit = async () => {
  const camposIncompletos = Object.entries(form)
    .filter(([_, value]) => !value)
    .map(([key]) => key.replace('_', ' '));

  if (camposIncompletos.length > 0) {
    Alert.alert(
      '⚠️ Campos incompletos',
      'Por favor completa: ' + camposIncompletos.join(', ')
    );
    return;
  }

  try {
    // 1. Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      form.correo,
      form.contraseña
    );
    const user = userCredential.user;

    // 2. Guardar información adicional en Firestore
    await setDoc(doc(db, 'usuarios', user.uid), {
      nombre: form.nombre,
      correo: form.correo,
      sexo: form.sexo,
      edad: form.edad,
      peso: form.peso,
      altura: form.altura,
      nivel_actividad: form.nivel_actividad,
      objetivo: form.objetivo,
    });

    Alert.alert('✅ Registro exitoso', 'Tu cuenta ha sido creada con éxito.');
    navigation.navigate('Home', { user: form });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    Alert.alert('❌ Error', error.message || 'No se pudo registrar el usuario.');
  }
};

const edades = Array.from({ length: 83 }, (_, i) => `${i + 18} años`);
const pesos = Array.from({ length: 151 }, (_, i) => `${i + 30} kg`);
const alturas = Array.from({ length: 101 }, (_, i) => `${i + 100} cm`);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#121212' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Registro de Usuario</Text>

          {step === 1 && (
            <>
              <Text style={styles.section}>Datos básicos</Text>

              <TextInput
                style={[
                  styles.input,
                  focusedField === 'nombre' && styles.inputFocused,
                ]}
                placeholder="Nombre"
                placeholderTextColor="#999"
                onChangeText={text => handleChange('nombre', text)}
                onFocus={() => setFocusedField('nombre')}
                onBlur={() => setFocusedField(null)}
                value={form.nombre}
                selectionColor="#ffee00ff"
              />

              <TextInput
                style={[
                  styles.input,
                  focusedField === 'correo' && styles.inputFocused,
                ]}
                placeholder="Correo"
                placeholderTextColor="#999"
                onChangeText={text => handleChange('correo', text)}
                keyboardType="email-address"
                onFocus={() => setFocusedField('correo')}
                onBlur={() => setFocusedField(null)}
                value={form.correo}
                autoCapitalize="none"
                selectionColor="#ffee00ff"
              />

              <TextInput
                style={[
                  styles.input,
                  focusedField === 'contraseña' && styles.inputFocused,
                ]}
                placeholder="Contraseña"
                placeholderTextColor="#999"
                onChangeText={text => handleChange('contraseña', text)}
                secureTextEntry
                onFocus={() => setFocusedField('contraseña')}
                onBlur={() => setFocusedField(null)}
                value={form.contraseña}
                selectionColor="#ffee00ff"
              />

              <TouchableOpacity style={styles.button} onPress={() => setStep(2)}>
                <Text style={styles.buttonText}>Siguiente</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.section}>Datos personales</Text>

              {/* Selects con fondo oscuro y borde verde al seleccionar o enfocar */}
              <TouchableOpacity
                style={[
                  styles.select,
                  (focusedField === 'sexo' || form.sexo) && styles.inputFocused,
                ]}
                onPress={() => openModal('sexo', opcionesSexo)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectText, form.sexo ? { color: '#fff' } : null]}>
                  {form.sexo || 'Seleccionar sexo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.select,
                  (focusedField === 'edad' || form.edad) && styles.inputFocused,
                ]}
                onPress={() => openModal('edad', edades)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectText, form.edad ? { color: '#fff' } : null]}>
                  {form.edad || 'Seleccionar edad'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.select,
                  (focusedField === 'peso' || form.peso) && styles.inputFocused,
                ]}
                onPress={() => openModal('peso', pesos)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectText, form.peso ? { color: '#fff' } : null]}>
                  {form.peso || 'Seleccionar peso'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.select,
                  (focusedField === 'altura' || form.altura) && styles.inputFocused,
                ]}
                onPress={() => openModal('altura', alturas)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectText, form.altura ? { color: '#fff' } : null]}>
                  {form.altura || 'Seleccionar altura'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={() => setStep(3)}>
                <Text style={styles.buttonText}>Siguiente</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.section}>Preferencias</Text>

              <TouchableOpacity
                style={[
                  styles.select,
                  (focusedField === 'nivel_actividad' || form.nivel_actividad) &&
                    styles.inputFocused,
                ]}
                onPress={() => openModal('nivel_actividad', opcionesActividad)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.selectText,
                    form.nivel_actividad ? { color: '#fff' } : null,
                  ]}
                >
                  {form.nivel_actividad || 'Nivel de actividad'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.select,
                  (focusedField === 'objetivo' || form.objetivo) && styles.inputFocused,
                ]}
                onPress={() => openModal('objetivo', opcionesObjetivo)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.selectText, form.objetivo ? { color: '#fff' } : null]}
                >
                  {form.objetivo || 'Seleccionar objetivo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Registrarse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#444', marginTop: 10 }]}
                onPress={() => setStep(2)}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Volver</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={modalOptions}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      handleChange(modalField, item);
                      closeModal();
                    }}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#ccc', marginTop: 10 }]}
                onPress={closeModal}
              >
                <Text style={[styles.buttonText, { color: '#333' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 50,
    backgroundColor: '#121212',
  },
  innerContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#ffffffff',
    textAlign: 'center',
  },
  section: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#ffee00ff',
    shadowColor: '#ffee00ff',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  select: {
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#999',
  },
  button: {
    backgroundColor: '#ffffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000000ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
  },
});