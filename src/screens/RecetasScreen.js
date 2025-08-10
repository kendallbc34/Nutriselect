import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Alert,
  Image,
} from 'react-native';
import { auth, db } from '../firebase'; // Ajusta la ruta según tu proyecto
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

export default function RecetasScreen() {
  const [recetas, setRecetas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [recetaActual, setRecetaActual] = useState({ id: null, nombre: '', ingredientes: [] });

  const [ingNombre, setIngNombre] = useState('');
  const [ingTipo, setIngTipo] = useState('');
  const [ingCantidad, setIngCantidad] = useState('');
  const [ingUnidad, setIngUnidad] = useState('g');

  const [ingredienteEditando, setIngredienteEditando] = useState(null);

  const unidadesOpciones = ['g', 'ml', 'u', 'cda', 'taza'];
  const [unidadSelectorVisible, setUnidadSelectorVisible] = useState(false);

  // Glow anims
  const glowNombre = useRef(new Animated.Value(0)).current;
  const glowTipo = useRef(new Animated.Value(0)).current;
  const glowCantidad = useRef(new Animated.Value(0)).current;
  const glowReceta = useRef(new Animated.Value(0)).current;

  const animateGlow = (anim, focus) => {
    Animated.timing(anim, {
      toValue: focus ? 1 : 0,
      duration: 500,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const inputGlowStyle = (animValue) => ({
    borderColor: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#444', '#ffee00ff'],
    }),
    shadowColor: '#ffee00ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: animValue,
    shadowRadius: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }),
    elevation: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
  });

  // --- Firestore references ---
  const user = auth.currentUser;
  const recetasRef = user
    ? collection(db, 'usuarios', user.uid, 'recetas')
    : null;

  // Cargar recetas desde Firestore al montar el componente
  useEffect(() => {
    if (!user) return;

    const q = query(recetasRef, orderBy('nombre'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recetasFirestore = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecetas(recetasFirestore);
    });

    return () => unsubscribe();
  }, [user]);

  // Guardar o actualizar receta en Firestore
  const guardarReceta = async () => {
    if (!recetaActual.nombre.trim()) {
      Alert.alert('Error', 'El nombre de la receta es obligatorio.');
      return;
    }
    if (recetaActual.ingredientes.length === 0) {
      Alert.alert('Error', 'Agrega al menos un ingrediente.');
      return;
    }

    try {
      if (modoEdicion) {
        // Actualizar receta existente
        const recetaDocRef = doc(db, 'usuarios', user.uid, 'recetas', recetaActual.id);
        await updateDoc(recetaDocRef, {
          nombre: recetaActual.nombre,
          ingredientes: recetaActual.ingredientes,
        });
      } else {
        // Crear nueva receta
        await addDoc(recetasRef, {
          nombre: recetaActual.nombre,
          ingredientes: recetaActual.ingredientes,
        });
      }

      setModalVisible(false);
      // No hace falta actualizar el state manualmente porque onSnapshot lo hace
    } catch (error) {
      console.error('Error guardando receta:', error);
      Alert.alert('Error', 'No se pudo guardar la receta.');
    }
  };

  // Eliminar receta en Firestore
  const eliminarReceta = async (id) => {
    Alert.alert(
      'Eliminar Receta',
      '¿Estás seguro de eliminar esta receta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const recetaDocRef = doc(db, 'usuarios', user.uid, 'recetas', id);
              await deleteDoc(recetaDocRef);
              // onSnapshot actualizará automáticamente el state
            } catch (error) {
              console.error('Error eliminando receta:', error);
              Alert.alert('Error', 'No se pudo eliminar la receta.');
            }
          },
        },
      ]
    );
  };

  // Agregar ingrediente al state local de la receta actual (sin cambio Firestore aún)
  const agregarIngrediente = () => {
    if (!ingNombre || !ingTipo || !ingCantidad || !ingUnidad) {
      Alert.alert('Error', 'Completa todos los campos del ingrediente.');
      return;
    }

    const nuevoIng = {
      id: ingredienteEditando ? ingredienteEditando.id : Date.now().toString(),
      nombre: ingNombre,
      tipo: ingTipo,
      cantidad: ingCantidad,
      unidad: ingUnidad,
    };

    if (ingredienteEditando) {
      setRecetaActual((prev) => ({
        ...prev,
        ingredientes: prev.ingredientes.map((i) =>
          i.id === ingredienteEditando.id ? nuevoIng : i
        ),
      }));
      setIngredienteEditando(null);
    } else {
      setRecetaActual((prev) => ({
        ...prev,
        ingredientes: [...prev.ingredientes, nuevoIng],
      }));
    }

    setIngNombre('');
    setIngTipo('');
    setIngCantidad('');
    setIngUnidad('g');
  };

  const totalCantidad = recetaActual.ingredientes.reduce((acc, ing) => {
    const cantidadNum = parseFloat(ing.cantidad);
    return isNaN(cantidadNum) ? acc : acc + cantidadNum;
  }, 0);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Recetas</Text>

      <TouchableOpacity style={styles.botonCrear} onPress={() => {
        setModoEdicion(false);
        setRecetaActual({ id: null, nombre: '', ingredientes: [] });
        setModalVisible(true);
      }}>
        <Text style={styles.botonCrearTexto}>+ Crear Nueva Receta</Text>
      </TouchableOpacity>

      {recetas.length === 0 && <Text style={styles.sinRegistros}>No hay recetas aún.</Text>}

      {recetas.map((receta) => (
        <View key={receta.id} style={styles.recetaContainer}>
          <Text style={styles.recetaNombre}>{receta.nombre}</Text>
          {receta.ingredientes.map((ing) => (
            <Text key={ing.id} style={styles.ingredienteItem}>
              {ing.nombre} ({ing.tipo}) - {ing.cantidad} {ing.unidad}
            </Text>
          ))}
          <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end' }}>
            <TouchableOpacity
              style={styles.botonIcono}
              onPress={() => {
                setRecetaActual(receta);
                setModoEdicion(true);
                setModalVisible(true);
              }}
            >
              <Image source={require('../../assets/editar.png')} style={styles.iconoAccion} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonIcono}
              onPress={() => eliminarReceta(receta.id)}
            >
              <Image source={require('../../assets/borrar.png')} style={styles.iconoAccion} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {modalVisible && (
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>
              {modoEdicion ? 'Editar Receta' : 'Nueva Receta'}
            </Text>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowReceta)]}>
              <TextInput
                style={styles.input}
                placeholder="Nombre de la receta"
                placeholderTextColor="#999"
                value={recetaActual.nombre}
                onChangeText={(text) => setRecetaActual((prev) => ({ ...prev, nombre: text }))}
                onFocus={() => animateGlow(glowReceta, true)}
                onBlur={() => animateGlow(glowReceta, false)}
              />
            </Animated.View>

            <Text style={styles.subtitulo}>Agregar Ingrediente</Text>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowNombre)]}>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#999"
                value={ingNombre}
                onChangeText={setIngNombre}
                onFocus={() => animateGlow(glowNombre, true)}
                onBlur={() => animateGlow(glowNombre, false)}
              />
            </Animated.View>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowTipo)]}>
              <TextInput
                style={styles.input}
                placeholder="Tipo"
                placeholderTextColor="#999"
                value={ingTipo}
                onChangeText={setIngTipo}
                onFocus={() => animateGlow(glowTipo, true)}
                onBlur={() => animateGlow(glowTipo, false)}
              />
            </Animated.View>

            <Animated.View style={[styles.inputContainer, inputGlowStyle(glowCantidad)]}>
              <TextInput
                style={styles.input}
                placeholder="Cantidad"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={ingCantidad}
                onChangeText={setIngCantidad}
                onFocus={() => animateGlow(glowCantidad, true)}
                onBlur={() => animateGlow(glowCantidad, false)}
              />
            </Animated.View>

            <TouchableOpacity
              style={styles.unidadSelector}
              onPress={() => setUnidadSelectorVisible(!unidadSelectorVisible)}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                Unidad: {ingUnidad}
              </Text>
            </TouchableOpacity>

            {unidadSelectorVisible && (
              <View style={styles.unidadPanel}>
                {unidadesOpciones.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={styles.unidadOpcion}
                    onPress={() => {
                      setIngUnidad(u);
                      setUnidadSelectorVisible(false);
                    }}
                  >
                    <Text style={styles.unidadOpcionTexto}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.botonAgregarIng} onPress={agregarIngrediente}>
              <Text style={styles.botonAgregarIngTexto}>
                {ingredienteEditando ? '✔️ Actualizar Ingrediente' : '+ Agregar Ingrediente'}
              </Text>
            </TouchableOpacity>

            {ingredienteEditando && (
              <TouchableOpacity
                style={[styles.botonAgregarIng, { backgroundColor: '#757575', marginTop: 8 }]}
                onPress={() => {
                  setIngredienteEditando(null);
                  setIngNombre('');
                  setIngTipo('');
                  setIngCantidad('');
                  setIngUnidad('g');
                }}
              >
                <Text style={styles.botonAgregarIngTexto}>Cancelar edición</Text>
              </TouchableOpacity>
            )}

            {recetaActual.ingredientes.length > 0 && (
              <View style={{ marginVertical: 20 }}>
                <Text style={styles.subtitulo}>Ingredientes Agregados</Text>
                {recetaActual.ingredientes.map((ing) => (
                  <View key={ing.id} style={styles.ingredienteEditable}>
                    <Text style={styles.ingredienteTexto}>
                      {ing.nombre} ({ing.tipo}) - {ing.cantidad} {ing.unidad}
                    </Text>
                    <View style={styles.botonesIngrediente}>
                      <TouchableOpacity
                        onPress={() => {
                          setIngNombre(ing.nombre);
                          setIngTipo(ing.tipo);
                          setIngCantidad(ing.cantidad);
                          setIngUnidad(ing.unidad);
                          setIngredienteEditando(ing);
                        }}
                        style={styles.botonIcono}
                      >
                        <Image source={require('../../assets/editar.png')} style={styles.iconoAccion} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setRecetaActual((prev) => ({
                            ...prev,
                            ingredientes: prev.ingredientes.filter((i) => i.id !== ing.id),
                          }));
                        }}
                        style={styles.botonIcono}
                      >
                        <Image source={require('../../assets/borrar.png')} style={styles.iconoAccion} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <Text style={{ color: '#ccc', marginTop: 10 }}>
                  Total cantidad: {totalCantidad.toFixed(1)}
                </Text>
              </View>
            )}

            <View style={styles.botonesModal}>
              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: '#009c2fff' }]}
                onPress={guardarReceta}
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
      )}
    </ScrollView>
  );
}

// ... mantiene tus estilos sin cambios (los que me pasaste)
const styles = StyleSheet.create({
  // ... todo igual que tu código original
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#121212',
    flexGrow: 1,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffffff',
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 1,
  },
  botonCrear: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 25,
    alignItems: 'center',
    elevation: 3,
  },
  botonCrearTexto: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  sinRegistros: {
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 25,
  },
  recetaContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 22,
  },
  recetaNombre: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ingredienteItem: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 6,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalContenido: {
    backgroundColor: '#222',
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
  subtitulo: {
    color: '#ddd',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 17,
  },
  unidadSelector: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ffffffff',
    alignSelf: 'flex-start',
  },
  unidadPanel: {
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  unidadOpcion: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 6,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  unidadOpcionTexto: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  botonAgregarIng: {
    backgroundColor: '#ffffffff',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 3,
  },
  botonAgregarIngTexto: {
    color: '#000',
    fontWeight: '700',
    fontSize: 17,
  },
  botonesModal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  botonModal: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 3,
  },
  botonModalTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  ingredienteEditable: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredienteTexto: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  botonesIngrediente: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  botonIcono: {
    padding: 8,
    marginHorizontal: 8,
  },
  iconoAccion: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
});
