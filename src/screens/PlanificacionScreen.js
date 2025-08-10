import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../firebase'; // Ajusta esta ruta según tu proyecto
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function PlanificacionScreen() {
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const [plan, setPlan] = useState({
    Lunes: { desayuno: '', almuerzo: '', cena: '', snack: '' },
    Martes: { desayuno: '', almuerzo: '', cena: '', snack: '' },
    Miércoles: { desayuno: '', almuerzo: '', cena: '', snack: '' },
    Jueves: { desayuno: '', almuerzo: '', cena: '', snack: '' },
    Viernes: { desayuno: '', almuerzo: '', cena: '', snack: '' },
    Sábado: { desayuno: '', almuerzo: '', cena: '', snack: '' },
    Domingo: { desayuno: '', almuerzo: '', cena: '', snack: '' },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [diaEditando, setDiaEditando] = useState(null);
  const [tipoComidaEditando, setTipoComidaEditando] = useState(null);
  const [textoComida, setTextoComida] = useState('');

  useEffect(() => {
    const cargarPlanificacion = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.planificacion) {
            setPlan(data.planificacion);
          }
        }
      } catch (error) {
        console.log('Error al cargar planificación:', error);
      }
    };

    cargarPlanificacion();
  }, []);

  const abrirModalEdicion = (dia, tipo) => {
    setDiaEditando(dia);
    setTipoComidaEditando(tipo);
    setTextoComida(plan[dia][tipo] || '');
    setModalVisible(true);
  };

  const guardarComida = async () => {
    const nuevoPlan = {
      ...plan,
      [diaEditando]: {
        ...plan[diaEditando],
        [tipoComidaEditando]: textoComida.trim(),
      },
    };

    setPlan(nuevoPlan);
    setModalVisible(false);

    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'usuarios', user.uid);
        await updateDoc(docRef, { planificacion: nuevoPlan });
      }
    } catch (error) {
      console.log('Error al guardar planificación:', error);
    }
  };

  // Iconos para cada tipo comida
  const iconosComidas = {
    desayuno: 'coffee',
    almuerzo: 'food-apple',
    cena: 'food-drumstick',
    snack: 'cookie',
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Planificación Semanal</Text>

        {diasSemana.map(dia => (
          <View key={dia} style={styles.diaCard}>
            <Text style={styles.diaTitulo}>{dia}</Text>
            {['desayuno', 'almuerzo', 'cena', 'snack'].map(tipo => (
              <TouchableOpacity
                key={tipo}
                style={styles.comidaRow}
                onPress={() => abrirModalEdicion(dia, tipo)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={iconosComidas[tipo]}
                  size={20}
                  color="#ffffffff"
                  style={{ width: 24 }}
                />
                <Text style={styles.comidaLabel}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
                <Text style={[styles.comidaTexto, !plan[dia][tipo] && styles.placeholder]}>
                  {plan[dia][tipo] || '—'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>
              Editar {tipoComidaEditando} de {diaEditando}
            </Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Escribe la comida..."
              value={textoComida}
              onChangeText={setTextoComida}
              autoFocus
              placeholderTextColor="#999"
            />
            <View style={styles.modalBotones}>
              <Pressable
                style={[styles.modalBoton, styles.modalCancelar]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBotonTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBoton, styles.modalGuardar]}
                onPress={guardarComida}
              >
                <Text style={styles.modalBotonTexto}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  diaCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  diaTitulo: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 12,
  },
  comidaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: '#2C2C2C',
    borderBottomWidth: 1,
  },
  comidaLabel: {
    width: 90,
    color: '#AAAAAA',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 6,
  },
  comidaTexto: {
    flex: 1,
    color: '#EEEEEE',
    fontSize: 15,
  },
  placeholder: {
    fontStyle: 'italic',
    color: '#555',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContenido: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitulo: {
    color: '#ffffffff',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  modalCancelar: {
    backgroundColor: '#ff0000ff',
  },
  modalGuardar: {
    backgroundColor: '#0c8d00ff',
  },
  modalBotonTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
