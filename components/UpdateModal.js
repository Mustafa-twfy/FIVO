import React from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, StyleSheet } from 'react-native';

export default function UpdateModal({ visible, update, onAcknowledge }) {
  if (!update) return null;
  const openLink = async () => {
    if (update.link_url) {
      try {
        await Linking.openURL(update.link_url);
      } catch (e) {
        console.error('Failed to open link', e);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{update.title}</Text>
          <Text style={styles.message}>{update.message}</Text>
          {update.version && <Text style={styles.version}>النسخة: {update.version}</Text>}
          <View style={styles.actions}>
            {update.link_url && (
              <TouchableOpacity style={styles.button} onPress={openLink}>
                <Text style={styles.buttonText}>فتح رابط التحديث</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.buttonPrimary} onPress={onAcknowledge}>
              <Text style={styles.buttonText}>حسناً</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center' },
  card: { width:'90%', backgroundColor:'#fff', borderRadius:12, padding:20 },
  title: { fontSize:18, fontWeight:'bold', marginBottom:8 },
  message: { fontSize:15, marginBottom:12 },
  version: { fontSize:13, color:'#666', marginBottom:12 },
  actions: { flexDirection:'row', justifyContent:'flex-end' },
  button: { padding:10, marginLeft:8 },
  buttonPrimary: { padding:10, backgroundColor:'#00C897', borderRadius:8 },
  buttonText: { color:'#fff', fontWeight:'600' }
});


