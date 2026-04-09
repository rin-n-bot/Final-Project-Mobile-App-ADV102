import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db, auth } from '../../../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  where,
  getDoc,
  deleteDoc
} from 'firebase/firestore';

import { chatStyles } from './styles';
import { BottomNav } from '../HomeScreen/components/BottomNav';
import { Image } from 'expo-image';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  const router = useRouter();

  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChatEmail, setActiveChatEmail] = useState<string | null>(null); 
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  // Selection Logic for Chat List
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);

    let unsubscribe: () => void;

    if (!chatId) {
      const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
      unsubscribe = onSnapshot(q, async (snapshot) => {
        const enriched = await Promise.all(
          snapshot.docs.map(async (d) => {
            const data = d.data();
            const otherId = data.participants.find((id: string) => id !== user.uid);
            let name = "User", photo = null;
            if (otherId) {
              const uSnap = await getDoc(doc(db, 'users', otherId));
              if (uSnap.exists()) {
                name = uSnap.data().email; 
                photo = uSnap.data().photoURL;
              }
            }
            const isMe = data.lastSenderEmail === auth.currentUser?.email;
            return { id: d.id, ...data, displayEmail: name, displayPhoto: photo, lastMsgDisplay: data.lastMessage ? `${isMe ? "You: " : ""}${data.lastMessage}` : "No messages yet" };
          })
        );
        setChats(enriched);
        setLoading(false);
      });
    } else {
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
      unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    }
    return () => unsubscribe && unsubscribe();
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

  const toggleChatSelection = (id: string) => {
    if (selectedChatIds.includes(id)) {
      setSelectedChatIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedChatIds(prev => [...prev, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedChatIds.length === 0) return;
    Alert.alert(
      "Delete Conversations",
      `Are you sure you want to delete ${selectedChatIds.length} conversation(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              for (const id of selectedChatIds) {
                await deleteDoc(doc(db, 'chats', id));
              }
              setIsSelectionMode(false);
              setSelectedChatIds([]);
            } catch (error) {
              console.error("Error deleting chats:", error);
            }
          }
        }
      ]
    );
  };

  // Safe Navigation Helper
  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/screens/HomeScreen');
    }
  };

  const renderHeader = () => {
    const headerDisplayText = isSelectionMode 
      ? `${selectedChatIds.length} Selected` 
      : (chatId ? (activeChatEmail || "Loading...") : "Messages");

    return (
      <View style={chatStyles.redHeader}>
        <SafeAreaView style={chatStyles.safeAreaCustom}>
          <View style={{ height: 60, width: '100%', flexDirection: 'row', alignItems: 'center' }}>
            
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={chatStyles.headerTitle} numberOfLines={1}>
                  {headerDisplayText}
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15 }}>
              <View style={{ width: 50 }}>
                {isSelectionMode && !chatId ? (
                  <TouchableOpacity 
                    onPress={() => { setIsSelectionMode(false); setSelectedChatIds([]); }} 
                    style={chatStyles.iconButton}
                  >
                    <Ionicons name="close" size={26} color="#FFF" />
                  </TouchableOpacity>
                ) : (
                  /* ALWAYS ARROW BACK - Safe from errors */
                  <TouchableOpacity onPress={handleSafeBack} style={chatStyles.iconButton}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ width: 60, alignItems: 'flex-end' }}>
                {!chatId && (
                  <TouchableOpacity 
                    onPress={() => { setIsSelectionMode(!isSelectionMode); setSelectedChatIds([]); }}
                    style={{ paddingVertical: 5 }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>
                      {isSelectionMode ? "Cancel" : "Select"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#AF0B01" />
      {renderHeader()}
      <View style={chatStyles.contentArea}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#AF0B01" />
          </View>
        ) : !chatId ? (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[chatStyles.listContainer, { paddingBottom: 100, flexGrow: 1 }]}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
                <Ionicons name="chatbubbles-outline" size={80} color="#E0E0E0" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#999', marginTop: 15 }}>No Messages Yet</Text>
                <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 }}>
                  Your conversations with others will appear here.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedChatIds.includes(item.id);
              return (
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => isSelectionMode ? toggleChatSelection(item.id) : router.push({ pathname: '/screens/ChatScreen', params: { chatId: item.id } })} 
                  style={[chatStyles.chatItem, isSelected && { backgroundColor: '#F9F9F9' }]}
                >
                  <View style={chatStyles.avatar}>
                    {item.displayPhoto ? <Image source={{ uri: item.displayPhoto }} style={{ width: 50, height: 50, borderRadius: 25 }} /> : 
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#222D31', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.displayEmail?.charAt(0).toUpperCase()}</Text>
                    </View>}
                  </View>
                  <View style={chatStyles.chatInfo}>
                    <Text style={chatStyles.userName}>{item.displayEmail}</Text>
                    <Text style={chatStyles.lastMsg} numberOfLines={1}>{item.lastMsgDisplay}</Text>
                  </View>
                  {isSelectionMode && (
                    <View style={{ paddingLeft: 10 }}>
                      <Ionicons 
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                        size={26} 
                        color="#AF0B01" 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
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

      {isSelectionMode && !chatId && selectedChatIds.length > 0 && (
        <TouchableOpacity 
          style={chatStyles.fab} 
          onPress={handleDeleteSelected}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {!chatId && <BottomNav />}
    </View>
  );
}