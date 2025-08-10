import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Alert,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback as TouchableOutside,
} from 'react-native';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
} from 'firebase/firestore';

export default function AgregarActividadScreen({ navigation }) {
  const [actividades, setActividades] = useState([]);
  const [actividad, setActividad] = useState('');
  const [minutos, setMinutos] = useState('');
  const [calorias, setCalorias] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [inputFocused, setInputFocused] = useState(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      cargarActividades();
    }
  }, [user]);

  const cargarActividades = async () => {
    try {
      const q = query(collection(db, 'usuarios', user.uid, 'actividades'));
      const querySnapshot = await getDocs(q);
      const lista = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() });
      });
      setActividades(lista);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      Alert.alert('Error al cargar actividades');
    }
  };

  const resetCampos = () => {
    setActividad('');
    setMinutos('');
    setCalorias('');
    setModoEdicion(false);
    setIdEditando(null);
    setInputFocused(null);
  };

  const onGuardar = async () => {
    if (!actividad.trim() || !minutos.trim()) {
      Alert.alert('Faltan campos', 'Por favor completa al menos actividad y minutos');
      return;
    }

    const caloriasNum = calorias.trim() ? Number(calorias) : 0;

    try {
      if (modoEdicion && idEditando) {
        await updateDoc(doc(db, 'usuarios', user.uid, 'actividades', idEditando), {
          actividad: actividad.trim(),
          minutos: minutos.trim(),
          calorias: caloriasNum,
        });
        Alert.alert('Actividad actualizada', `Actualizaste ${actividad}`);
      } else {
        await addDoc(collection(db, 'usuarios', user.uid, 'actividades'), {
          actividad: actividad.trim(),
          minutos: minutos.trim(),
          calorias: caloriasNum,
          fecha: new Date().toISOString(),
        });
        Alert.alert('Actividad registrada', `Registraste ${actividad}`);
      }

      cargarActividades();
      resetCampos();
    } catch (error) {
      console.error('Error al guardar actividad:', error);
      Alert.alert('Error al guardar la actividad');
    }
  };

  const onEditar = (item) => {
    setActividad(item.actividad);
    setMinutos(item.minutos);
    setCalorias(String(item.calorias));
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const onEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Seguro que quieres eliminar esta actividad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'usuarios', user.uid, 'actividades', id));
              cargarActividades();
            } catch (error) {
              Alert.alert('Error al eliminar actividad');
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
    <View style={styles.itemContainer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.actividad}</Text>
        <Text style={styles.itemDetail}>
          {item.minutos} min - {item.calorias} kcal
        </Text>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity onPress={() => onEditar(item)} style={styles.buttonAction}>
          <Text style={{ color: '#ffee00ff', fontWeight: '700' }}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEliminar(item.id)} style={styles.buttonAction}>
          <Text style={{ color: '#f44336', fontWeight: '700' }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <TouchableOutside style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <Text style={styles.title}>{modoEdicion ? 'Editar Actividad' : 'Registrar Actividad'}</Text>

        <TextInput
          placeholder="Tipo de actividad (caminar, correr...)"
          placeholderTextColor="#999"
          style={[styles.input, inputFocused === 'actividad' && styles.inputFocused]}
          value={actividad}
          onChangeText={setActividad}
          onFocus={() => setInputFocused('actividad')}
          onBlur={() => setInputFocused(null)}
        />

        <TextInput
          placeholder="Duración (minutos)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          style={[styles.input, inputFocused === 'minutos' && styles.inputFocused]}
          value={minutos}
          onChangeText={setMinutos}
          onFocus={() => setInputFocused('minutos')}
          onBlur={() => setInputFocused(null)}
        />

        <TextInput
          placeholder="Calorías quemadas (opcional)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          style={[styles.input, inputFocused === 'calorias' && styles.inputFocused]}
          value={calorias}
          onChangeText={setCalorias}
          onFocus={() => setInputFocused('calorias')}
          onBlur={() => setInputFocused(null)}
        />

        <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut} onPress={onGuardar}>
          <Animated.View style={[styles.button, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.buttonText}>{modoEdicion ? 'Actualizar' : 'Guardar'}</Text>
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
          />
        )}
      </View>
    </TouchableOutside>
  );
}

// Tus mismos estilos originales
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    paddingTop: 70,
  },
  title: {
    color: '#ffee00ff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1f1f1f',
    color: '#eee',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    fontSize: 16,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#444',
  },
  inputFocused: {
    borderColor: '#ffee00ff',
    shadowColor: '#ffee00ff',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    backgroundColor: '#998f03ff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#ffee00ff',
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
  itemContainer: {
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  itemDetail: {
    color: '#ccc',
    fontSize: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  buttonAction: {
    marginHorizontal: 8,
  },
});

