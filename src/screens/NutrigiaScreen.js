import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Image, ImageBackground } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase'; // Ajusta la ruta según tu estructura

const TOGETHER_API_KEY = 'a8333993debf428537cda7a9f6e153af1b21707e05e8c8a971e447648b7c8dc3';

export default function NutrigiaScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef();

  // 🔹 Detectar usuario autenticado y obtener UID dinámico
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        console.log("No hay usuario autenticado.");
      }
    });

    return unsubscribe;
  }, []);


  // 🔹 Cargar perfil del usuario desde Firestore
  useEffect(() => {
    if (!userId) return; // Esperar hasta tener el UID real

    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, 'usuarios', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserProfile(data);


          // Mensaje de bienvenida personalizado
          setMessages([
            {
              id: '1',
              text: `¡Hola ${data.nombre}! Soy NutrigIA, tu compañero fitness 💪. Listo para ponerte en marcha o prefieres algo suavecito hoy? 😏`,
              fromUser: false,
            },
          ]);
        } else {
          console.log('No existe el documento del usuario.');
        }
      } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
      }
    };

    fetchUserProfile();
  }, [userId]);

  

  // 🔹 Enviar mensaje del usuario y obtener respuesta de NutrigIA
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMessage = {
      id: Date.now().toString(),
      text: userText,
      fromUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: `
Eres NutrigIA, un asistente experto en nutrición y entrenamiento fitness.
Tu estilo es profesional y motivador, con humor sutil y emojis.
Cuando recomiendes entrenamientos, prioriza rutinas para hipertrofia basadas en:
"2 series efectivas de 6 a 10 repeticiones por ejercicio".
Si el usuario pregunta algo fuera del fitness, contesta corto y redirígelo.

Contexto real del usuario:
Nombre: ${userProfile?.nombre || 'Usuario'}
Edad: ${userProfile?.edad || '—'}
Sexo: ${userProfile?.sexo || '—'}
Altura: ${userProfile?.altura || '—'}
Peso: ${userProfile?.peso || '—'}
Objetivo: ${userProfile?.objetivo || '—'}
Nivel de actividad: ${userProfile?.nivel_actividad || '—'}
Calorías diarias: ${userProfile?.calorias || '—'}
Proteínas: ${userProfile?.proteinas || '—'} g
Carbohidratos: ${userProfile?.carbohidratos || '—'} g
Grasas: ${userProfile?.grasas || '—'} g
Correo: ${userProfile?.correo || '—'}
`,
            },
            {
              role: 'user',
              content: userText,
            },
          ],
          max_tokens: 350,
          temperature: 0.75,
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorDetails}`);
      }

      const data = await response.json();
      const aiText =
        data.choices?.[0]?.message?.content?.trim() || 'No entendí tu pregunta.';

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        fromUser: false,
      };

      setMessages((prev) => [...prev, botMessage]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error al llamar Together AI:', error);
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        text: 'Ups, tuve un problema al procesar eso 😅. Intenta de nuevo.',
        fromUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // 🔹 Renderizar cada burbuja
  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.fromUser ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text style={item.fromUser ? styles.userText : styles.botText}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/fondo-nutri.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Image
            source={require('../../assets/nutrigia.png')}
            style={styles.navIcon}
          />

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View style={{ height: 20 }} />}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  background: { flex: 1 },
  container: { flex: 1 },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  messageBubble: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginVertical: 6,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#001368ff',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  userText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  botText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 10, 56, 0.8)',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderRadius: 30,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#001368ff',
    borderRadius: 25,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    justifyContent: 'center',
    elevation: 8,
  },
  sendButtonText: {
    color: '#121212',
    fontWeight: '700',
    fontSize: 16,
  },
  navIcon: {
    width: 100,
    height: 80,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
});
