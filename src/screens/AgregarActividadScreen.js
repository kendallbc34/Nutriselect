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
import { AppContext } from '../context/AppContext';

export default function AgregarActividadScreen({ navigation }) {
  //const { restarCaloriasActividad } = useContext(AppContext);

  // Estados
  const [actividad, setActividad] = useState('');
  const [minutos, setMinutos] = useState('');
  const [calorias, setCalorias] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const { actividades, registrarActividad, editarActividad, eliminarActividad } = useContext(AppContext);

  //const [actividades, setActividades] = useState([]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowActividad = useRef(new Animated.Value(0)).current;
  const glowMinutos = useRef(new Animated.Value(0)).current;
  const glowCalorias = useRef(new Animated.Value(0)).current;

  const user = auth.currentUser;

  /*  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado.');
      return;
    }

    const actividadesRef = collection(db, 'usuarios', user.uid, 'actividades');
    const q = query(actividadesRef, orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setActividades(lista);
    });

    return () => unsubscribe();
  }, [user]); */ 

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
      outputRange: ['#444', '#002fffff'],
    }),
    shadowColor: '#002fffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: animValue,
    shadowRadius: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
    elevation: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
  });

  const resetCampos = () => {
    setActividad('');
    setMinutos('');
    setCalorias('');
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarActividad = async () => {
    if (!actividad.trim() || !minutos.trim()) {
      Alert.alert('Faltan campos', 'Por favor completa la actividad y los minutos');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado.');
      return;
    }

    const caloriasNum = calorias.trim() ? Number(calorias) : 0;

    try {
      const actividadesRef = collection(db, 'usuarios', user.uid, 'actividades');

      if (modoEdicion && idEditando) {
        const docRef = doc(actividadesRef, idEditando);
        await updateDoc(docRef, {
          actividad: actividad.trim(),
          minutos,
          calorias: caloriasNum,
          fecha: new Date(),
        });
        Alert.alert('Actividad actualizada', `Actualizaste ${actividad}`);
      } else {
        await addDoc(actividadesRef, {
          actividad: actividad.trim(),
          minutos,
          calorias: caloriasNum,
          fecha: new Date(),
        });
        Alert.alert('Actividad registrada', `Registraste ${actividad}`);

        // 🔥 RESTA calorías del contexto global
        //if (restarCaloriasActividad && caloriasNum > 0) {
          //restarCaloriasActividad(caloriasNum);
        //}
      }

      resetCampos();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la actividad.');
    }
  };

  const onEditar = (item) => {
    setActividad(item.actividad);
    setMinutos(String(item.minutos));
    setCalorias(String(item.calorias));
    setIdEditando(item.id);
    setModoEdicion(true);
  };

  const onEliminar = (id) => {
    Alert.alert('Confirmar eliminación', '¿Seguro que quieres eliminar esta actividad?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          try {
            const actividadesRef = collection(db, 'usuarios', user.uid, 'actividades');
            await deleteDoc(doc(actividadesRef, id));
            Alert.alert('Actividad eliminada');
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo eliminar la actividad.');
          }
        },
      },
    ]);
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
    <View style={styles.itemContainer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.actividad}</Text>
        <Text style={styles.itemDetail}>
          {item.minutos} min - {item.calorias} kcal
        </Text>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity onPress={() => onEditar(item)} style={styles.buttonAction}>
          <Text style={{ color: '#ffffffff', fontWeight: '700' }}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEliminar(item.id)} style={styles.buttonAction}>
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
            <Text style={styles.title}>
              {modoEdicion ? 'Editar Actividad' : 'Registrar Actividad'}
            </Text>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowActividad)]}>
              <TextInput
                placeholder="Tipo de actividad (caminar, correr...)"
                placeholderTextColor="#999"
                style={styles.input}
                value={actividad}
                onChangeText={setActividad}
                onFocus={() => animateGlow(glowActividad, true)}
                onBlur={() => animateGlow(glowActividad, false)}
              />
            </Animated.View>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowMinutos)]}>
              <TextInput
                placeholder="Duración (minutos)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                style={styles.input}
                value={minutos}
                onChangeText={setMinutos}
                onFocus={() => animateGlow(glowMinutos, true)}
                onBlur={() => animateGlow(glowMinutos, false)}
              />
            </Animated.View>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowCalorias)]}>
              <TextInput
                placeholder="Calorías quemadas (opcional)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                style={styles.input}
                value={calorias}
                onChangeText={setCalorias}
                onFocus={() => animateGlow(glowCalorias, true)}
                onBlur={() => animateGlow(glowCalorias, false)}
              />
            </Animated.View>

            <TouchableWithoutFeedback
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={guardarActividad}
            >
              <Animated.View style={[styles.button, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.buttonText}>
                  {modoEdicion ? 'Actualizar' : 'Guardar'}
                </Text>
              </Animated.View>
            </TouchableWithoutFeedback>

            <Text style={[styles.title, { marginTop: 30 }]}>Actividades Registradas</Text>

            {actividades.length === 0 ? (
              <Text style={{ color: '#999', textAlign: 'center', marginTop: 10 }}>
                No has registrado actividades aún
              </Text>
            ) : (
              <FlatList
                data={actividades}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff', padding: 24 },
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
  input: {
    color: '#0a0a0aff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    borderRadius: 14,
  },
  button: {
    backgroundColor: '#000d46ff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#002fffff',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: { color: '#ffffffff', fontWeight: '700', fontSize: 18 },
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
  itemContainer: {
    backgroundColor: '#000d46ff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  itemDetail: { color: '#ccc', fontSize: 14 },
  buttonsRow: { flexDirection: 'row', marginLeft: 12 },
  buttonAction: { marginHorizontal: 8 },
});
