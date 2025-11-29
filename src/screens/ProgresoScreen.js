import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { auth, db } from '../firebase'; // ajusta la ruta si es necesario
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

export default function ProgresoScreen() {
  const [registros, setRegistros] = useState([]);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [registroActual, setRegistroActual] = useState({ id: null, peso: '', fecha: '' });

  const glowAnim = useRef(new Animated.Value(0)).current;

  const [inputFocus, setInputFocus] = useState({ peso: false, fecha: false });
  const inputGlowPeso = useRef(new Animated.Value(0)).current;
  const inputGlowFecha = useRef(new Animated.Value(0)).current;

  // Referencia a la colección de progreso para el usuario actual
  const user = auth.currentUser;
  const progresoCollectionRef = user
    ? collection(db, 'usuarios', user.uid, 'progreso')
    : null;

  // Escuchar cambios en Firestore en tiempo real
  useEffect(() => {
    if (!progresoCollectionRef) return;

    const q = query(progresoCollectionRef, orderBy('fecha', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const registrosFirestore = [];
        querySnapshot.forEach((doc) => {
          registrosFirestore.push({ id: doc.id, ...doc.data() });
        });
        setRegistros(registrosFirestore);
      },
      (error) => {
        console.error('Error leyendo progreso:', error);
        Alert.alert('Error', 'No se pudo cargar el progreso.');
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (registroSeleccionado !== null) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [registroSeleccionado]);

  useEffect(() => {
    Animated.timing(inputGlowPeso, {
      toValue: inputFocus.peso ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [inputFocus.peso]);

  useEffect(() => {
    Animated.timing(inputGlowFecha, {
      toValue: inputFocus.fecha ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [inputFocus.fecha]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setRegistroActual({ id: null, peso: '', fecha: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (registro) => {
    const date = new Date(registro.fecha);
    // Ajustamos a formato DD-MM-YYYY
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    setModoEdicion(true);
    setRegistroActual({
      id: registro.id,
      peso: registro.peso.toString(),
      fecha: `${dd}-${mm}-${yyyy}`,
    });
    setModalVisible(true);
  };

  const guardarRegistro = async () => {
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado.');
      return;
    }

    const pesoNum = parseFloat(registroActual.peso);

    if (!registroActual.peso || isNaN(pesoNum) || pesoNum <= 0) {
      Alert.alert('Error', 'Ingresa un peso válido mayor que 0.');
      return;
    }

    if (!registroActual.fecha.trim()) {
      Alert.alert('Error', 'Ingresa la fecha (DD-MM-YYYY).');
      return;
    }

    if (!/^\d{2}-\d{2}-\d{4}$/.test(registroActual.fecha.trim())) {
      Alert.alert('Error', 'La fecha debe tener el formato DD-MM-YYYY.');
      return;
    }

    const [dd, mm, yyyy] = registroActual.fecha.trim().split('-');
    // Fecha en formato ISO para Firestore
    const fechaISO = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);

    try {
      if (modoEdicion) {
        // Actualizar documento existente
        const docRef = doc(db, 'usuarios', user.uid, 'progreso', registroActual.id);
        await updateDoc(docRef, {
          peso: pesoNum,
          fecha: fechaISO,
        });
        Alert.alert('Éxito', 'Registro actualizado correctamente.');
      } else {
        // Crear nuevo documento
        await addDoc(progresoCollectionRef, {
          peso: pesoNum,
          fecha: fechaISO,
        });
        Alert.alert('Éxito', 'Registro guardado correctamente.');
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error guardando registro:', error);
      Alert.alert('Error', 'No se pudo guardar el registro.');
    }
  };

  const eliminarRegistro = async (id) => {
    Alert.alert(
      'Confirmar',
      '¿Eliminar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(db, 'usuarios', user.uid, 'progreso', id);
              await deleteDoc(docRef);
              Alert.alert('Éxito', 'Registro eliminado.');
              if (registroSeleccionado === id) setRegistroSeleccionado(null);
            } catch (error) {
              console.error('Error eliminando registro:', error);
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          },
        },
      ]
    );
  };

  const seleccionarRegistro = (id) => {
    setRegistroSeleccionado((prev) => (prev === id ? null : id));
  };

  const glowInterpolation = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(76, 86, 175, 0.6)', 'rgba(38, 0, 255, 1)'],
  });

  const inputGlowStyle = (animValue) => ({
    borderColor: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#444', '#ffffffff'],
    }),
    shadowColor: '#001368ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: animValue,
    shadowRadius: 12,
    elevation: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    }),
  });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Registrar Progreso</Text>

      <TouchableOpacity style={styles.botonCrear} onPress={abrirModalCrear}>
        <Text style={styles.botonCrearTexto}>+ Agregar Registro</Text>
      </TouchableOpacity>

      {registros.length === 0 && <Text style={styles.sinRegistros}>No hay registros aún.</Text>}

      {registros.map((r) => {
        const date = r.fecha.toDate ? r.fecha.toDate() : new Date(r.fecha);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();

        const seleccionado = registroSeleccionado === r.id;

        return (
          <Animated.View
            key={r.id}
            style={[
              styles.registroContainer,
              seleccionado && {
                borderWidth: 2,
                borderColor: glowInterpolation,
                shadowColor: '#001368ff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.85,
                shadowRadius: 18,
                elevation: 14,
                backgroundColor: '#ffffffff',
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => seleccionarRegistro(r.id)}
              style={{ paddingVertical: 12 }}
            >
              <View style={styles.row}>
                <Text style={styles.pesoTexto}>{r.peso} kg</Text>
                <Text style={styles.fechaTexto}>{`${dd}/${mm}/${yyyy}`}</Text>
              </View>
            </TouchableOpacity>

            {seleccionado && (
              <View style={styles.botonesRegistro}>
                <TouchableOpacity
                  style={[styles.botonAccion, styles.editar]}
                  onPress={() => abrirModalEditar(r)}
                >
                  <Text style={styles.botonAccionTexto}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.botonAccion, styles.eliminar]}
                  onPress={() => eliminarRegistro(r.id)}
                >
                  <Text style={styles.botonAccionTexto}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        );
      })}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>
              {modoEdicion ? 'Editar Registro' : 'Nuevo Registro'}
            </Text>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(inputGlowPeso)]}>
              <TextInput
                style={styles.input}
                placeholder="Peso en kg"
                keyboardType="numeric"
                value={registroActual.peso}
                onChangeText={(text) =>
                  setRegistroActual((prev) => ({ ...prev, peso: text }))
                }
                onFocus={() => setInputFocus((prev) => ({ ...prev, peso: true }))}
                onBlur={() => setInputFocus((prev) => ({ ...prev, peso: false }))}
                placeholderTextColor="#999"
              />
            </Animated.View>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(inputGlowFecha)]}>
              <TextInput
                style={styles.input}
                placeholder="Fecha (DD-MM-YYYY)"
                value={registroActual.fecha}
                onChangeText={(text) =>
                  setRegistroActual((prev) => ({ ...prev, fecha: text }))
                }
                onFocus={() => setInputFocus((prev) => ({ ...prev, fecha: true }))}
                onBlur={() => setInputFocus((prev) => ({ ...prev, fecha: false }))}
                placeholderTextColor="#999"
              />
            </Animated.View>

            <View style={styles.botonesModal}>
              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: '#0c8b00ff' }]}
                onPress={guardarRegistro}
              >
                <Text style={styles.botonModalTexto}>Guardar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: '#f44336' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.botonModalTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... tus estilos actuales, sin cambios ...
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#ffffffff',
    flexGrow: 1,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#001368ff',
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 1,
  },
  botonCrear: {
    backgroundColor: '#001368ff',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 25,
    alignItems: 'center',
    elevation: 3,
  },
  botonCrearTexto: {
    color: '#ffffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  sinRegistros: {
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 25,
  },
  registroContainer: {
    backgroundColor: '#001368ff',
    borderRadius: 14,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pesoTexto: {
    color: '#8a8a8aff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  fechaTexto: {
    color: '#969595ff',
    fontSize: 16,
    fontWeight: '600',
  },
  botonesRegistro: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    //paddingRight: 10,   // ✅ Nuevo
    marginBottom: 10,
  },
  botonAccion: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginLeft: 12,
    elevation: 2,
  },
  editar: {
    backgroundColor: '#088d03ff',
  },
  eliminar: {
    backgroundColor: '#f44336',
  },
  botonAccionTexto: {
    color: '#fff',
    fontWeight: '700',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(31, 31, 31, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalContenido: {
    backgroundColor: '#001368ff',
    borderRadius: 14,
    padding: 24,
    elevation: 6,
  },
  modalTitulo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffffff',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: '#ffffffff',
    borderRadius: 10,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fdfcfcff',
    color: '#030303ff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 17,
  },
  botonesModal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  botonModal: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 3,
  },
  botonModalTexto: {
    color: '#ffffffff',
    fontWeight: 'bold',
    fontSize: 17,
  },
});
