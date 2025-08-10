// HomeScreen.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const opcionesActividad = [
  'Sedentario (0-1 días por semana)',
  'Ligero (1-3 días por semana)',
  'Moderado (3-5 días por semana)',
  'Intenso (6-7 días por semana)',
];

const opcionesObjetivo = [
  { key: 'bajar', label: 'Bajar peso' },
  { key: 'mantener', label: 'Mantener peso' },
  { key: 'subir', label: 'Subir peso' },
];

export default function HomeScreen({ navigation }) {
  const confirmarCierreSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: () => navigation.navigate('Welcome'),
        },
      ]
    );
  };
const [sidebarVisible, setSidebarVisible] = useState(false);
const sidebarAnim = useRef(new Animated.Value(-250)).current;

const toggleSidebar = () => {
  Animated.timing(sidebarAnim, {
    toValue: sidebarVisible ? -250 : 0,
    duration: 300,
    useNativeDriver: false,
  }).start(() => {
    setSidebarVisible(!sidebarVisible);
  });
};


  /* ---------- Estado de macros ---------- */
  const [proteinaGr, setProteinaGr] = useState(150);
  const [carbosGr, setCarbosGr] = useState(250);
  const [grasasGr, setGrasasGr] = useState(70);

  const caloriasDeMacros = proteinaGr * 4 + carbosGr * 4 + grasasGr * 9;
  const [objetivo, setObjetivo] = useState('mantener');
  const [caloriasMeta, setCaloriasMeta] = useState(caloriasDeMacros);

  const { caloriasConsumidas, caloriasGastadas } = useContext(AppContext);

  const caloriasNetas = Math.max(0, caloriasConsumidas - caloriasGastadas);
  const caloriasRestantes = Math.max(0, caloriasMeta - caloriasNetas);
  const porcentajeCalorias = Math.min(
    100,
    Math.round((caloriasNetas / caloriasMeta) * 100)
  );

  const gramosTotales = proteinaGr + carbosGr + grasasGr;

  /* ---------- Animaciones ---------- */
  const animCalorias = useRef(new Animated.Value(0)).current;
  const animProteina = useRef(new Animated.Value(0)).current;
  const animCarbos = useRef(new Animated.Value(0)).current;
  const animGrasas = useRef(new Animated.Value(0)).current;

  /* Ajustar meta calórica si cambia el objetivo o macros */
  useEffect(() => {
    let factor = 1;
    if (objetivo === 'bajar') factor = 0.8;
    else if (objetivo === 'subir') factor = 1.2;
    setCaloriasMeta(Math.round(caloriasDeMacros * factor));
  }, [proteinaGr, carbosGr, grasasGr, objetivo]);

  /* Animar círculo de calorías */
  useEffect(() => {
    Animated.timing(animCalorias, {
      toValue: porcentajeCalorias,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [caloriasNetas, caloriasMeta]);

  /* Animar barras de macros */
  useEffect(() => {
    Animated.timing(animProteina, {
      toValue: gramosTotales === 0 ? 0 : (proteinaGr / gramosTotales) * 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    Animated.timing(animCarbos, {
      toValue: gramosTotales === 0 ? 0 : (carbosGr / gramosTotales) * 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    Animated.timing(animGrasas, {
      toValue: gramosTotales === 0 ? 0 : (grasasGr / gramosTotales) * 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [proteinaGr, carbosGr, grasasGr]);

  /* ---------- Modales de edición ---------- */
  const [modalVisible, setModalVisible] = useState(false);
  const [macroEditando, setMacroEditando] = useState(null);
  const [valorTemporal, setValorTemporal] = useState('');

  const abrirModalMacro = (macro) => {
    setMacroEditando(macro);
    const valorActual = {
      proteina: proteinaGr,
      carbos: carbosGr,
      grasas: grasasGr,
    }[macro];
    setValorTemporal(String(valorActual));
    setModalVisible(true);
  };

  const guardarCambios = () => {
    const valorNum = Number(valorTemporal);
    if (isNaN(valorNum) || valorNum < 0) {
      Alert.alert('Error', 'Ingresa un valor válido mayor o igual a 0.');
      return;
    }
    if (macroEditando === 'proteina') setProteinaGr(valorNum);
    else if (macroEditando === 'carbos') setCarbosGr(valorNum);
    else if (macroEditando === 'grasas') setGrasasGr(valorNum);

    setModalVisible(false);
  };

  /* ---------- Modales objetivo y actividad ---------- */
  const [modalObjetivoVisible, setModalObjetivoVisible] = useState(false);
  const [modalActividadVisible, setModalActividadVisible] = useState(false);

  const [nivelActividad, setNivelActividad] = useState(opcionesActividad[0]);

  const cambiarObjetivo = (nuevoObjetivo) => {
    setObjetivo(nuevoObjetivo);
    setModalObjetivoVisible(false);
  };

  const cambiarActividad = (nuevoNivel) => {
    setNivelActividad(nuevoNivel);
    setModalActividadVisible(false);
  };

  /* ---------- Parámetros círculo ---------- */
  const radius = 100;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = animCalorias.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>NutriSelect</Text>
<TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
  <Text style={styles.menuText}>☰</Text>
</TouchableOpacity>

<Animated.View style={[styles.sidebarRight, { right: sidebarAnim }]}>
  <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
    <Text style={styles.closeText}>×</Text>
  </TouchableOpacity>

  <Image
    source={require('../../assets/perfil.png')}
    style={styles.sidebarProfile}
  />
  <Text style={styles.sidebarNombre}>¡Hola, usuario!</Text>

  {/* Botón NutrigIA arriba del todo */}
  <TouchableOpacity
    style={[styles.sidebarIsland, styles.nutrigiaButton]}
    onPress={() => {
      toggleSidebar();
      navigation.navigate('NutrigIA');
    }}
  >
    <Text style={styles.nutrigiaText}>NutrigIA</Text>
  </TouchableOpacity>

  {/* Botones isla para el resto */}
  <TouchableOpacity
    style={styles.sidebarIsland}
    onPress={() => {
      toggleSidebar();
      navigation.navigate('Perfil');
    }}
  >
    <Text style={styles.sidebarButtonText}>Ver Perfil</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.sidebarIsland}
    onPress={() => {
      toggleSidebar();
      navigation.navigate('Recetas');
    }}
  >
    <Text style={styles.sidebarButtonText}>Ver mis Recetas</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.sidebarIsland}
    onPress={() => {
      toggleSidebar();
      navigation.navigate('Progreso');
    }}
  >
    <Text style={styles.sidebarButtonText}>Ver Progreso</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.sidebarIsland}
    onPress={() => {
      toggleSidebar();
      navigation.navigate('Planificacion');
    }}
  >
    <Text style={styles.sidebarButtonText}>Ver Planificación</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.sidebarIsland, { marginTop: 20 }]}
    onPress={() => {
      toggleSidebar();
      confirmarCierreSesion();
    }}
  >
    <Text style={[styles.sidebarButtonText, { color: '#f44336' }]}>Cerrar Sesión</Text>
  </TouchableOpacity>
</Animated.View>
        {/* Círculo animado */}
        <View style={styles.circleWrapper}>
          <Svg width={220} height={220}>
            <Circle
              cx={110}
              cy={110}
              r={radius}
              stroke="#292600ff"
              strokeWidth={15}
              fill="none"
            />
            <AnimatedCircle
              cx={110}
              cy={110}
              r={radius}
              stroke="#ffee00ff"
              strokeWidth={15}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              rotation="-90"
              origin="110,110"
            />
          </Svg>
          <View style={styles.circleContent}>
            <Text style={styles.kcalGrande}>{caloriasNetas} kcal</Text>
            <Text style={styles.kcalSub}>
              {tdeeText(nivelActividad)} kcal estimadas
            </Text>
            <Text style={styles.kcalPequeno}>
              {caloriasRestantes} restantes de {caloriasMeta}
            </Text>
            <Text style={styles.kcalPorcentaje}>{porcentajeCalorias}%</Text>
          </View>
        </View>

        {/* Botón objetivo */}
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setModalObjetivoVisible(true)}
        >
          <Text style={styles.selectorButtonText}>
            Objetivo:{' '}
            {opcionesObjetivo.find((o) => o.key === objetivo)?.label || objetivo}
          </Text>
        </TouchableOpacity>

        {/* Botón nivel de actividad */}
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setModalActividadVisible(true)}
        >
          <Text style={styles.selectorButtonText}>
            Nivel actividad: {nivelActividad.split(' ')[0]}
          </Text>
        </TouchableOpacity>

        {/* Macros editables */}
        <View style={styles.macrosContainer}>
          <TouchableOpacity onPress={() => abrirModalMacro('proteina')}>
            <MacroBarGr
              label="Proteína"
              gramos={proteinaGr}
              porcentaje={
                gramosTotales === 0 ? 0 : (proteinaGr / gramosTotales) * 100
              }
              color="#ca3636ff"
              anim={animProteina}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => abrirModalMacro('carbos')}>
            <MacroBarGr
              label="Carbohidratos"
              gramos={carbosGr}
              porcentaje={
                gramosTotales === 0 ? 0 : (carbosGr / gramosTotales) * 100
              }
              color="#2196F3"
              anim={animCarbos}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => abrirModalMacro('grasas')}>
            <MacroBarGr
              label="Grasas"
              gramos={grasasGr}
              porcentaje={
                gramosTotales === 0 ? 0 : (grasasGr / gramosTotales) * 100
              }
              color="#FFC107"
              anim={animGrasas}
            />
          </TouchableOpacity>
        </View>

        {/* Botones registrar */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AgregarComida')}
          >
            <Text style={styles.actionButtonText}>Registrar comida</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AgregarActividad')}
          >
            <Text style={styles.actionButtonText}>Registrar actividad</Text>
          </TouchableOpacity>
        </View>

        {/* Navbar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Progreso')}>
            <View style={styles.navItem}>
              <Image
                source={require('../../assets/progreso.png')}
                style={styles.navIcon}
              />
              <Text style={styles.navLabel}>Progreso</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Recetas')}>
            <View style={styles.navItem}>
              <Image
                source={require('../../assets/recetas.png')}
                style={styles.navIcon}
              />
              <Text style={styles.navLabel}>Recetas</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Planificacion')}
          >
            <View style={styles.navItem}>
              <Image
                source={require('../../assets/planificacion.png')}
                style={styles.navIcon}
              />
              <Text style={styles.navLabel}>Plan</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
            <View style={styles.navItem}>
              <Image
                source={require('../../assets/perfil.png')}
                style={styles.navIcon}
              />
              <Text style={styles.navLabel}>Perfil</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmarCierreSesion}>
            <View style={styles.navItem}>
              <Image
                source={require('../../assets/candado.png')}
                style={styles.navIcon}
              />
              <Text style={[styles.navLabel, { color: '#f44336' }]}>Salir</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ---------- Modal editar macros ---------- */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
              }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Editar {macroEditando}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={valorTemporal}
                  onChangeText={setValorTemporal}
                  placeholder="Ingresa gramos"
                  style={styles.modalInput}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={guardarCambios}
                  >
                    <Text style={styles.modalButtonText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* ---------- Modal objetivo ---------- */}
        <Modal
          visible={modalObjetivoVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalObjetivoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
              }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecciona objetivo</Text>
                {opcionesObjetivo.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.modalOption,
                      objetivo === key && styles.modalOptionSelected,
                    ]}
                    onPress={() => cambiarObjetivo(key)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        objetivo === key && styles.modalOptionTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { marginTop: 15 },
                  ]}
                  onPress={() => setModalObjetivoVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Volver</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* ---------- Modal actividad ---------- */}
        <Modal
          visible={modalActividadVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalActividadVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
              }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Selecciona nivel de actividad
                </Text>
                {opcionesActividad.map((nivel) => (
                  <TouchableOpacity
                    key={nivel}
                    style={[
                      styles.modalOption,
                      nivelActividad === nivel && styles.modalOptionSelected,
                    ]}
                    onPress={() => cambiarActividad(nivel)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        nivelActividad === nivel &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {nivel}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { marginTop: 15 },
                  ]}
                  onPress={() => setModalActividadVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Volver</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

/* ---------- Función para texto de TDEE ---------- */
function tdeeText(nivelActividad) {
  switch (nivelActividad) {
    case 'Sedentario (0-1 días por semana)':
      return 'Baja';
    case 'Ligero (1-3 días por semana)':
      return 'Ligera';
    case 'Moderado (3-5 días por semana)':
      return 'Moderada';
    case 'Intenso (6-7 días por semana)':
      return 'Alta';
    default:
      return '';
  }
}

/* ---------- Componente barra macro ---------- */
const MacroBarGr = ({ label, gramos, porcentaje, color, anim }) => (
  <View style={styles.macroBar}>
    <Text style={styles.macroLabel}>{label}</Text>
    <View style={styles.progressBarBackground}>
      <Animated.View
        style={[
          styles.progressBarFill,
          {
            width: anim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
    <Text style={styles.macroValue}>
      {gramos}g ({porcentaje.toFixed(1)}%)
    </Text>
  </View>
);

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginBottom: 10,
  },
  circleWrapper: {
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContent: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  kcalGrande: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  kcalSub: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 4,
  },
  kcalPequeno: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  kcalPorcentaje: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffee00ff',
    marginTop: 8,
  },
  selectorButton: {
    backgroundColor: '#1f1f1f',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 8,
    width: '90%',
  },
  selectorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  macrosContainer: {
    width: '90%',
    marginTop: 10,
    marginBottom: 10,
  },
  macroBar: {
    marginBottom: 10,
  },
  macroLabel: {
    color: '#fff',
    marginBottom: 4,
    fontWeight: '600',
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  macroValue: {
    color: '#aaa',
    marginTop: 2,
    fontSize: 12,
  },
  actionButtons: {
    width: '90%',
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#ffffffff',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#000000ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1f1f1f',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  /* ---------- Estilos modal ---------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 60,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#2e2e2eff',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  saveButton: {
    backgroundColor: '#147a00ff',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffffff',
    marginVertical: 6,
  },
  modalOptionSelected: {
    backgroundColor: '#474747ff',
  },
  modalOptionText: {
    color: '#ffffffff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: '#ffffffff',
  },
  
sidebarItem: {
  fontSize: 18,
  color: '#ffee00ff',
  marginVertical: 12,
  fontWeight: '600',
},
menuButton: {
  position: 'absolute',
  top: 20,
  right: 20,
  zIndex: 1100,
  padding: 10,
},
menuText: {
  fontSize: 50,
  color: '#bdbdbdff',
},
sidebarRight: {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 250,
  backgroundColor: '#1f1f1f',
  paddingTop: 60,
  paddingHorizontal: 20,
  zIndex: 1000,
  elevation: 20,
  shadowColor: '#000',
  shadowOpacity: 0.8,
  shadowOffset: { width: -2, height: 0 },
  shadowRadius: 6,
},
sidebarItem: {
  fontSize: 18,
  color: '#ffee00ff',
  marginVertical: 12,
  fontWeight: '600',
},
closeButton: {
  alignSelf: 'flex-end',
  marginBottom: 20,
},
closeText: {
  fontSize: 40,
  color: '#ff0000ff',
},
sidebarProfile: {
  width: 50,
  height: 50,
  borderRadius: 5,
  alignSelf: 'center',
  marginBottom: 10,
},
sidebarNombre: {
  textAlign: 'center',
  fontSize: 16,
  fontWeight: 'bold',
  color: '#fff',
  marginBottom: 20,
},
sidebarButtonsContainer: {
  marginTop: 20,
  alignItems: 'center',
},

sidebarIsland: {
  backgroundColor: '#2a2a2a',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 20,
  marginVertical: 8,
  width: '100%',
  alignItems: 'center',
},

sidebarIslandText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
nutrigiaButton: {
  backgroundColor: '#28a745', // verde bonito
  marginTop: 10,
},

nutrigiaText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},

sidebarIsland: {
  backgroundColor: '#2c2f33',  // tono oscuro para "isla"
  paddingVertical: 14,
  borderRadius: 12,
  marginVertical: 8,
  alignItems: 'center',
},

nutrigiaButton: {
  backgroundColor: '#00b34aff', // verde bonito para NutrigIA
  marginBottom: 20,
},

sidebarButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 18,
},

nutrigiaText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 20,
},

});
