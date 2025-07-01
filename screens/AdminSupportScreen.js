import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, supportAPI } from '../supabase';

export default function AdminSupportScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // {user_type, user_id, name, phone}
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    const { data, error } = await supportAPI.getAllSupportConversations();
    if (error) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل المحادثات');
      setLoading(false);
      return;
    }
    // تجميع الرسائل حسب المستخدم (user_type + user_id)
    const grouped = {};
    data.forEach(msg => {
      const key = msg.user_type + '-' + msg.user_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(msg);
    });
    // بناء قائمة المحادثات
    const convs = Object.keys(grouped).map(key => {
      const msgs = grouped[key];
      const lastMsg = msgs[msgs.length - 1];
      return {
        user_type: lastMsg.user_type,
        user_id: lastMsg.user_id,
        name: lastMsg.name || (lastMsg.user_type === 'driver' ? 'سائق' : 'متجر'),
        phone: lastMsg.phone || '',
        last_message: lastMsg.message,
        last_sender: lastMsg.sender,
        last_time: lastMsg.created_at,
        messages: msgs
      };
    });
    setConversations(convs);
    setLoading(false);
  };

  const openConversation = async (user_type, user_id, name, phone) => {
    setSelectedUser({ user_type, user_id, name, phone });
    const { data, error } = await supportAPI.getSupportMessages(user_type, user_id);
    if (!error) setMessages(data);
    setReplyModalVisible(true);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedUser) return;
    setSending(true);
    const { error } = await supportAPI.sendSupportMessage(selectedUser.user_type, selectedUser.user_id, replyText.trim(), 'admin');
    if (!error) {
      setReplyText('');
      openConversation(selectedUser.user_type, selectedUser.user_id, selectedUser.name, selectedUser.phone);
      loadConversations();
    } else {
      Alert.alert('خطأ', 'فشل في إرسال الرد');
    }
    setSending(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})} ${date.toLocaleTimeString('ar-IQ', {hour: '2-digit', minute: '2-digit'})}`;
  };

  const renderConversationItem = (item) => (
    <TouchableOpacity style={styles.messageCard} onPress={() => openConversation(item.user_type, item.user_id, item.name, item.phone)}>
      <View style={styles.messageHeader}>
        <View style={styles.userInfo}>
          <Ionicons name={item.user_type === 'driver' ? 'car-outline' : 'storefront-outline'} size={20} color={item.user_type === 'driver' ? '#2196F3' : '#FF9800'} />
          <Text style={styles.userName}>{item.name}</Text>
          <View style={[styles.userTypeBadge, { backgroundColor: item.user_type === 'driver' ? '#2196F3' : '#FF9800' }]}>
            <Text style={styles.userTypeText}>{item.user_type === 'driver' ? 'سائق' : 'متجر'}</Text>
          </View>
        </View>
        <Text style={styles.messageDate}>{formatDate(item.last_time)}</Text>
      </View>
      <Text style={styles.messageText}>{item.last_message}</Text>
    </TouchableOpacity>
  );

  const renderMessageBubble = (msg) => (
    <View key={msg.id} style={[styles.bubble, msg.sender === 'admin' ? styles.adminBubble : styles.userBubble]}>
      <Text style={styles.bubbleSender}>{msg.sender === 'admin' ? 'الإدارة' : (selectedUser?.user_type === 'driver' ? 'السائق' : 'المتجر')}</Text>
      <Text style={styles.bubbleText}>{msg.message}</Text>
      <Text style={styles.bubbleTime}>{formatDate(msg.created_at)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>جاري تحميل المحادثات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (navigation.canGoBack()) { navigation.goBack(); } }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الدعم الفني</Text>
        <TouchableOpacity onPress={loadConversations} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item, index) => `${item.user_type}-${item.user_id}`}
        renderItem={({ item }) => renderConversationItem(item)}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد محادثات دعم فني</Text>
          </View>
        }
      />
      <Modal visible={replyModalVisible} transparent animationType="slide" onRequestClose={() => setReplyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>محادثة مع {selectedUser?.name} ({selectedUser?.user_type === 'driver' ? 'سائق' : 'متجر'})</Text>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={{flex:1,marginBottom:12}}>
              <ScrollView contentContainerStyle={{paddingVertical:8}}>
                {messages.map(renderMessageBubble)}
              </ScrollView>
            </View>
            <TextInput
              style={styles.replyInput}
              placeholder="اكتب ردك هنا..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:8}}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setReplyModalVisible(false)}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]} onPress={sendReply} disabled={!replyText.trim() || sending}>
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonText}>إرسال الرد</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FF9800',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  userTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  userTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageDate: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
}); 