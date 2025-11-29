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
    // 1️⃣ Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      form.correo,
      form.contraseña
    );
    const user = userCredential.user;

    // 2️⃣ Calcular macros automáticamente
    const calcularMacros = ({ edad, peso, altura, sexo, actividad }) => {
      // Convertir strings con unidades a números
      const edadNum = parseInt(edad);
      const pesoNum = parseInt(peso);
      const alturaNum = parseInt(altura);

      let bmr;
      if (sexo.toLowerCase() === 'hombre') {
        bmr = 10 * pesoNum + 6.25 * alturaNum - 5 * edadNum + 5;
      } else {
        bmr = 10 * pesoNum + 6.25 * alturaNum - 5 * edadNum - 161;
      }

      const factoresActividad = {
        'sedentario (0-1 días por semana)': 1.2,
        'ligero (1-3 días por semana)': 1.375,
        'moderado (3-5 días por semana)': 1.55,
        'intenso (6-7 días por semana)': 1.725,
      };

      const tdee = bmr * (factoresActividad[actividad.toLowerCase()] || 1.2);

      const proteinaGr = pesoNum * 1.8;
      const proteinaKcal = proteinaGr * 4;

      const grasaKcal = tdee * 0.3;
      const grasaGr = grasaKcal / 9;

      const carboKcal = tdee - (proteinaKcal + grasaKcal);
      const carboGr = carboKcal / 4;

      return {
        calorias: Math.round(tdee),
        proteinas: Math.round(proteinaGr),
        grasas: Math.round(grasaGr),
        carbohidratos: Math.round(carboGr),
      };
    };

    const macros = calcularMacros({
      edad: form.edad,
      peso: form.peso,
      altura: form.altura,
      sexo: form.sexo,
      actividad: form.nivel_actividad,
    });

    // 3️⃣ Guardar información adicional en Firestore (incluyendo macros)
    await setDoc(
      doc(db, 'usuarios', user.uid),
      {
        nombre: form.nombre,
        correo: form.correo,
        sexo: form.sexo,
        edad: form.edad,
        peso: form.peso,
        altura: form.altura,
        nivel_actividad: form.nivel_actividad,
        objetivo: form.objetivo,
        ...macros, // agrega calorías y macros
      },
      { merge: true }
    );

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
                placeholderTextColor="#777777ff"
                onChangeText={text => handleChange('nombre', text)}
                onFocus={() => setFocusedField('nombre')}
                onBlur={() => setFocusedField(null)}
                value={form.nombre}
                selectionColor="#2600fdff"
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
                selectionColor="#2600fdff"
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
                selectionColor="#2600fdff"
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
                <Text style={[styles.selectText, form.sexo ? { color: '#000000ff' } : null]}>
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
                <Text style={[styles.selectText, form.edad ? { color: '#000000ff' } : null]}>
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
                <Text style={[styles.selectText, form.peso ? { color: '#000000ff' } : null]}>
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
                <Text style={[styles.selectText, form.altura ? { color: '#000000ff' } : null]}>
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
                    form.nivel_actividad ? { color: '#000000ff' } : null,
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
                  style={[styles.selectText, form.objetivo ? { color: '#070707ff' } : null]}
                >
                  {form.objetivo || 'Seleccionar objetivo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Registrarse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#000000ff', marginTop: 10 }]}
                onPress={() => setStep(2)}
              >
                <Text style={[styles.buttonText, { color: '#ffffffff' }]}>Volver</Text>
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
    backgroundColor: '#ffffffff',
  },
  innerContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#000000ff',
    textAlign: 'center',
  },
  section: {
    fontSize: 18,
    color: '#000000ff',
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#ffffffff',
    color: '#000000ff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#001aafff',
    shadowColor: '#001aafff',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  select: {
    backgroundColor: '#ffffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#000000ff',
  },
  button: {
    backgroundColor: '#2e2c9eff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffffff',
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