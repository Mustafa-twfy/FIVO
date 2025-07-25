import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supportAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';

export default function StoreSupportChatScreen({ navigation }) {
  const [storeId, setStoreId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    const fetchStoreId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setStoreId(id);
      if (id) loadSupportMessages(id);
    };
    fetchStoreId();
  }, []);

  const loadSupportMessages = async (id) => {
    setLoading(true);
    const { data, error } = await supportAPI.getSupportMessages('store', id);
    if (!error) setMessages(data || []);
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    const { error } = await supportAPI.sendSupportMessage('store', storeId, input.trim(), 'user');
    if (!error) {
      setInput('');
      loadSupportMessages(storeId);
    } else {
      Alert.alert('خطأ', 'تعذر إرسال الرسالة');
    }
    setSending(false);
  };

  if (loading) {
    return null;
  }

  const renderMessageBubble = (item) => (
    <View key={item.id} style={[styles.messageBubble, item.sender === 'user' ? styles.myMessage : styles.supportMessage]}>
      <Text style={styles.messageText}>{item.message}</Text>
      <Text style={styles.messageTime}>{item.created_at ? item.created_at.substring(11,16) : ''} {item.sender === 'user' ? '(أنت)' : '(الإدارة)'}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:colors.secondary}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (navigation.canGoBack()) { navigation.goBack(); } }} style={{padding: 8}}>
          <Ionicons name="arrow-back" size={26} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.title}>الدعم الفني</Text>
        <View style={{width:34}} />
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => renderMessageBubble(item)}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالتك للدعم الفني..."
          value={input}
          onChangeText={setInput}
          editable={!sending}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: colors.secondary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginBottom: 0 },
  messageBubble: { maxWidth: '80%', marginBottom: 12, padding: 12, borderRadius: 12 },
  myMessage: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderTopRightRadius: 2 },
  supportMessage: { backgroundColor: colors.secondary, alignSelf: 'flex-start', borderTopLeftRadius: 2 },
  messageText: { fontSize: 16, color: colors.secondary },
  messageTime: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'left' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderColor: colors.primary, backgroundColor: colors.secondary, position: 'absolute', bottom: 0, left: 0, right: 0 },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: colors.primary, borderRadius: 22, paddingHorizontal: 16, fontSize: 16, backgroundColor: colors.secondary, color: colors.primary },
  sendButton: { marginLeft: 8, backgroundColor: colors.primary, borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
}); 