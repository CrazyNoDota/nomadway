import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { askAIGuide, streamAIGuide } from '../utils/aiGuide';

export default function AIGuideScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Привет! Я ваш AI-гид NomadWay. Задайте мне вопрос о путешествиях по Казахстану и не только, например: "Что посмотреть в Алматы за 2 дня?"',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const scrollViewRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    const userInput = inputText;
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Create placeholder for bot response
    const botMessageId = Date.now() + 1;
    const botMessage = {
      id: botMessageId,
      text: '',
      isBot: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setStreamingMessageId(botMessageId);

    try {
      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map((msg) => ({
          role: msg.isBot ? 'assistant' : 'user',
          content: msg.text,
        }));

      // Try streaming first
      let streamedText = '';
      try {
        await streamAIGuide(userInput, conversationHistory, (chunk) => {
          streamedText += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, text: streamedText }
                : msg
            )
          );
        });
      } catch (streamError) {
        // Fallback to non-streaming
        console.warn('Streaming failed, using regular request:', streamError);
        const response = await askAIGuide(userInput, conversationHistory, false);
        streamedText = response;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, text: streamedText }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: botMessageId,
        text: 'Извините, произошла ошибка. Убедитесь, что backend сервер запущен и доступен. Попробуйте еще раз.',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === botMessageId ? errorMessage : msg))
      );
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.isBot ? styles.botMessage : styles.userMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isBot ? styles.botBubble : styles.userBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isBot ? styles.botText : styles.userText,
          ]}
        >
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );

  const quickQuestions = [
    'Что посмотреть в Алматы за 2 дня?',
    'Лучшие места для фото в Казахстане',
    'Маршрут по историческим местам',
    'Где лучше отдохнуть летом?',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="sparkles" size={24} color="#d4af37" />
          <Text style={styles.headerTitle}>AI-Гид</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Задайте вопрос о путешествиях
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />

        {messages.length === 1 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Быстрые вопросы:</Text>
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => setInputText(question)}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
                <Ionicons name="arrow-forward" size={16} color="#d4af37" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoading && streamingMessageId && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>AI отвечает...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Задайте вопрос..."
          placeholderTextColor="#8e8e93"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() ? '#fff' : '#8e8e93'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a4d3a',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d4af37',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#d4af37',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#1a4d3a',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 4,
  },
  quickQuestionsContainer: {
    marginTop: 20,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 12,
  },
  quickQuestionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#1a4d3a',
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a4d3a',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});

