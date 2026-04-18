import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db, auth } from '../../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { chatStyles } from '../(tabs)/chat/styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MessageScreen() {
  const { chatId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChatEmail, setActiveChatEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !chatId) return;

    const fetchRecipient = async () => {
      try {
        const chatSnap = await getDoc(doc(db, 'chats', chatId as string));
        if (chatSnap.exists()) {
          const participants = chatSnap.data().participants;
          const otherId = participants.find((id: string) => id !== user.uid);
          if (otherId) {
            const uSnap = await getDoc(doc(db, 'users', otherId));
            if (uSnap.exists()) setActiveChatEmail(uSnap.data().email);
          }
        }
      } catch (e) { console.error("Error fetching recipient:", e); }
    };
    fetchRecipient();

    const q = query(collection(db, 'chats', chatId as string, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async () => {
    const messageToSend = inputText.trim();
    if (!messageToSend || !chatId) return;
    
    const user = auth.currentUser;
    setInputText('');
    
    try {
      await addDoc(collection(db, 'chats', chatId as string, 'messages'), { 
        text: messageToSend, 
        senderId: user?.uid, 
        senderEmail: user?.email, 
        createdAt: serverTimestamp() 
      });
      await updateDoc(doc(db, 'chats', chatId as string), { 
        lastMessage: messageToSend, 
        lastSenderEmail: user?.email, 
        updatedAt: serverTimestamp() 
      });
    } catch (e) { console.error(e); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#AF0B01" />
      
      {/* Header */}
      <View style={chatStyles.redHeader}>
        <SafeAreaView style={chatStyles.safeAreaCustom}>
          <View style={{ height: 60, width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
            <TouchableOpacity onPress={() => router.back()} style={chatStyles.iconButton}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={[chatStyles.headerTitle, { marginLeft: 10, flex: 1 }]} numberOfLines={1}>
              {activeChatEmail || "Loading..."}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={chatStyles.contentArea}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#AF0B01" />
          </View>
        ) : (
          <View style={{ flex: 1, paddingBottom: insets.bottom + 20 }}>
            <FlatList
              data={messages}
              inverted
              keyExtractor={(item) => item.id}
              contentContainerStyle={chatStyles.messageList}
              renderItem={({ item }) => {
                const isMine = item.senderId === auth.currentUser?.uid;
                return (
                  <View style={[chatStyles.bubble, isMine ? chatStyles.myBubble : chatStyles.theirBubble]}>
                    <Text style={[chatStyles.msgText, { color: isMine ? '#FFF' : '#222D31' }]}>{item.text}</Text>
                  </View>
                );
              }}
            />
            <View style={chatStyles.inputArea}>
              <TextInput 
                style={chatStyles.textInput} 
                placeholder="Type message..." 
                placeholderTextColor="#999" 
                value={inputText} 
                onChangeText={setInputText} 
                multiline 
                blurOnSubmit={false} 
              />
              <TouchableOpacity onPress={sendMessage} style={chatStyles.sendBtn}>
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}