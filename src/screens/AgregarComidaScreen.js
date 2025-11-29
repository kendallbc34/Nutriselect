import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

const TIEMPOS_COMIDA = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];

export default function AgregarComidaScreen({ navigation }) {
  // Estados para nuevo registro / edición
  const [nombre, setNombre] = useState('');
  const [calorias, setCalorias] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('g');
  const [tiempoComida, setTiempoComida] = useState(TIEMPOS_COMIDA[0]);

  const [unidadSelectorVisible, setUnidadSelectorVisible] = useState(false);
  const [tiempoSelectorVisible, setTiempoSelectorVisible] = useState(false);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [comidas, setComidas] = useState([]);

  // Glow animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowNombre = useRef(new Animated.Value(0)).current;
  const glowCantidad = useRef(new Animated.Value(0)).current;
  const glowCalorias = useRef(new Animated.Value(0)).current;

  const unidadesOpciones = ['g', 'ml', 'u', 'cda', 'taza'];

  // Obtén usuario actual
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado.');
      return;
    }

    // Escuchar cambios en las comidas del usuario
    const comidasRef = collection(db, 'usuarios', user.uid, 'comidas');
    const q = query(comidasRef, orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComidas(lista);
    });

    return () => unsubscribe();
  }, [user]);

  // Animación glow helper
  const animateGlow = (anim, focus) => {
    Animated.timing(anim, {
      toValue: focus ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const inputGlowStyle = (animValue) => ({
    borderColor: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#3b3b3bff', '#002fffff'],
    }),
    shadowColor: '#002fffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: animValue,
    shadowRadius: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
    elevation: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
  });

  const resetCampos = () => {
    setNombre('');
    setCalorias('');
    setCantidad('');
    setUnidad('g');
    setTiempoComida(TIEMPOS_COMIDA[0]);
    setIdEditando(null);
    setModoEdicion(false);
  };

  const guardarComida = async () => {
    if (!nombre.trim() || !calorias.trim() || !cantidad.trim()) {
      Alert.alert('Faltan campos', 'Por favor completa todos los campos');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado.');
      return;
    }

    try {
      const comidasRef = collection(db, 'usuarios', user.uid, 'comidas');

      if (modoEdicion && idEditando) {
        // Editar
        const docRef = doc(comidasRef, idEditando);
        await updateDoc(docRef, {
          nombre: nombre.trim(),
          calorias: Number(calorias),
          cantidad: cantidad.trim(),
          unidad,
          tiempoComida,
          fecha: new Date(),
        });
        Alert.alert('Comida actualizada', `Actualizaste ${nombre}`);
      } else {
        // Registrar nuevo
        await addDoc(comidasRef, {
          nombre: nombre.trim(),
          calorias: Number(calorias),
          cantidad: cantidad.trim(),
          unidad,
          tiempoComida,
          fecha: new Date(),
        });
        Alert.alert('Comida registrada', `Registraste ${nombre}`);
      }

      resetCampos();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la comida.');
    }
  };

  const onEditar = (item) => {
    setNombre(item.nombre);
    setCalorias(String(item.calorias));
    setCantidad(item.cantidad);
    setUnidad(item.unidad);
    setTiempoComida(item.tiempoComida);
    setIdEditando(item.id);
    setModoEdicion(true);
  };

  const onEliminar = (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Seguro que quieres eliminar esta comida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              const comidasRef = collection(db, 'usuarios', user.uid, 'comidas');
              await deleteDoc(doc(comidasRef, id));
              Alert.alert('Comida eliminada');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar la comida.');
            }
          },
        },
      ]
    );
  };

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const renderItem = ({ item }) => (
    <View style={styles.comidaItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.comidaNombre}>{item.nombre}</Text>
        <Text style={styles.comidaDetalle}>
          {item.cantidad} {item.unidad} - {item.calorias} kcal
        </Text>
        <Text style={styles.comidaTiempo}>{item.tiempoComida}</Text>
      </View>
      <View style={styles.botonesFila}>
        <TouchableOpacity onPress={() => onEditar(item)} style={styles.botonIcono}>
          <Text style={{ color: '#ffffffff', fontWeight: '700' }}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEliminar(item.id)} style={styles.botonIcono}>
          <Text style={{ color: '#f44336', fontWeight: '700' }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffffff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Text style={styles.title}>{modoEdicion ? 'Editar Comida' : 'Registrar Comida'}</Text>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowNombre)]}>
              <TextInput
                placeholder="Nombre del alimento"
                placeholderTextColor="#999"
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                onFocus={() => animateGlow(glowNombre, true)}
                onBlur={() => animateGlow(glowNombre, false)}
              />
            </Animated.View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
              <Animated.View style={[styles.inputContainerCantidad, inputGlowStyle(glowCantidad), { flex: 1 }]}>
                <TextInput
                  placeholder="Cantidad"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  style={styles.input}
                  value={cantidad}
                  onChangeText={setCantidad}
                  onFocus={() => animateGlow(glowCantidad, true)}
                  onBlur={() => animateGlow(glowCantidad, false)}
                />
              </Animated.View>

              <TouchableOpacity
                style={styles.unidadSelector}
                onPress={() => setUnidadSelectorVisible(!unidadSelectorVisible)}
              >
                <Text style={{ color: '#070707ff', fontWeight: 'bold' }}>{unidad}</Text>
              </TouchableOpacity>
            </View>

            {unidadSelectorVisible && (
              <View style={styles.unidadPanel}>
                {unidadesOpciones.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={styles.unidadOpcion}
                    onPress={() => {
                      setUnidad(u);
                      setUnidadSelectorVisible(false);
                    }}
                  >
                    <Text style={styles.unidadOpcionTexto}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowCalorias)]}>
              <TextInput
                placeholder="Calorías"
                placeholderTextColor="#000000ff"
                keyboardType="numeric"
                style={styles.input}
                value={calorias}
                onChangeText={setCalorias}
                onFocus={() => animateGlow(glowCalorias, true)}
                onBlur={() => animateGlow(glowCalorias, false)}
              />
            </Animated.View>

            {/* Selector Tiempo Comida */}
            <TouchableOpacity
              style={styles.tiempoSelector}
              onPress={() => setTiempoSelectorVisible(!tiempoSelectorVisible)}
            >
              <Text style={{ color: '#000000ff', fontWeight: '700' }}>Tiempo: {tiempoComida}</Text>
            </TouchableOpacity>

            {tiempoSelectorVisible && (
              <View style={styles.unidadPanel}>
                {TIEMPOS_COMIDA.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.unidadOpcion}
                    onPress={() => {
                      setTiempoComida(t);
                      setTiempoSelectorVisible(false);
                    }}
                  >
                    <Text style={styles.unidadOpcionTexto}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableWithoutFeedback
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={guardarComida}
            >
              <Animated.View style={[styles.button, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.buttonText}>{modoEdicion ? 'Actualizar' : 'Guardar'}</Text>
              </Animated.View>
            </TouchableWithoutFeedback>

            <Text style={[styles.title, { marginTop: 30 }]}>Comidas Registradas</Text>

            {comidas.length === 0 ? (
              <Text style={{ color: '#000000ff', textAlign: 'center', marginTop: 10 }}>
                No has registrado comidas aún
              </Text>
            ) : (
              <FlatList
                data={comidas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                style={{ marginTop: 10 }}
                keyboardShouldPersistTaps="handled"
              />
            )}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Volver al Menú Principal</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Aquí reutiliza tus estilos originales sin cambios:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    padding: 24,
  },
  title: {
    color: '#002fffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    borderWidth: 2,
    borderRadius: 14,
    marginBottom: 18,
    backgroundColor: '#ffffffff',
  },
  inputContainerCantidad: {
    borderWidth: 2,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#ffffffff',
  },
  input: {
    color: '#000000ff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    borderRadius: 14,
  },
  unidadSelector: {
    backgroundColor: '#ffffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#002fffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unidadPanel: {
    backgroundColor: '#242424ff',
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 18,
  },
  unidadOpcion: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  unidadOpcionTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tiempoSelector: {
    backgroundColor: '#ffffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#002fffff',
    alignItems: 'center',
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#010f4dff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#002fffff',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  backButton: {
    marginTop: 24,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#002fffff',
  },
  backButtonText: {
    color: '#002fffff',
    fontWeight: '700',
    fontSize: 16,
  },
  comidaItem: {
    backgroundColor: '#001058ff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  comidaNombre: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  comidaDetalle: {
    color: '#ccc',
    fontSize: 14,
  },
  comidaTiempo: {
    color: '#ffffffff',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  botonesFila: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  botonIcono: {
    marginHorizontal: 8,
  },
});