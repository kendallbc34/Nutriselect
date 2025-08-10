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
  Keyboard,
} from 'react-native';
import { Image } from 'react-native';

const TOGETHER_API_KEY = 'a8333993debf428537cda7a9f6e153af1b21707e05e8c8a971e447648b7c8dc3';

export default function NutrigiaScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: '¡Hola! Soy NutrigIA, tu asistente nutricional. ¿En qué puedo ayudarte hoy?',
      fromUser: false,
    },
  ]);

  const [input, setInput] = useState('');
  const flatListRef = useRef();

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
              content: 'Eres NutrigIA, un asistente de nutrición amable, claro y preciso.',
            },
            {
              role: 'user',
              content: userText,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorDetails}`);
      }

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content?.trim() || 'No entendí tu pregunta.';

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
        text: 'Lo siento, hubo un error al obtener la respuesta. Intenta de nuevo.',
        fromUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
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
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
  },
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
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#1f1f1f',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  userText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  botText: {
    color: '#e0e0e0',
    fontWeight: '500',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#222',
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
    backgroundColor: '#292929',
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
