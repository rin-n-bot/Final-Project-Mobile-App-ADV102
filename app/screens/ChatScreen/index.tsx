import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  Keyboard,
  InteractionManager // Added this
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
  getDoc
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Main Listener (Fixed with InteractionManager)
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const user = auth.currentUser;
      if (!user) return;

      let unsubscribe: () => void;

      if (!chatId) {
        const q = query(
          collection(db, 'chats'), 
          where('participants', 'array-contains', user.uid),
          orderBy('updatedAt', 'desc')
        );
        
        unsubscribe = onSnapshot(q, async (snapshot) => {
          const enriched = await Promise.all(
            snapshot.docs.map(async (d) => {
              const data = d.data();
              const otherId = data.participants.find((id: string) => id !== user.uid);
              let name = "User";
              let photo = null;

              if (otherId) {
                const uSnap = await getDoc(doc(db, 'users', otherId));
                if (uSnap.exists()) {
                  name = uSnap.data().email; 
                  photo = uSnap.data().photoURL;
                }
              }

              const isMe = data.lastSenderEmail === auth.currentUser?.email;
              const prefix = isMe ? "You: " : "";
              const lastMsgDisplay = data.lastMessage ? `${prefix}${data.lastMessage}` : "No messages yet";

              return { 
                id: d.id, 
                ...data, 
                displayEmail: name, 
                displayPhoto: photo,
                lastMsgDisplay 
              };
            })
          );
          setChats(enriched);
        });
      } else {
        const q = query(
          collection(db, 'chats', chatId as string, 'messages'), 
          orderBy('createdAt', 'desc')
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
          setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }
      return unsubscribe;
    });
    return () => task.cancel();
  }, [chatId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !chatId) return;
    const user = auth.currentUser;
    const msg = inputText.trim();
    setInputText('');

    try {
      await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
        text: msg,
        senderId: user?.uid,
        senderEmail: user?.email,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', chatId as string), {
        lastMessage: msg,
        lastSenderEmail: user?.email,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderHeader = () => (
    <View style={chatStyles.redHeader}>
      <SafeAreaView style={chatStyles.safeAreaCustom}>
        <View style={chatStyles.headerContent}>
          <View style={chatStyles.leftContainer}>
            {chatId && (
              <TouchableOpacity onPress={() => router.back()} style={chatStyles.iconButton}>
                <Ionicons name="arrow-back" size={26} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={chatStyles.headerTitle}>{chatId ? "Conversation" : "Messages"}</Text>
          <View style={chatStyles.rightContainer} />
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
    <View style={chatStyles.mainWrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#AF0B01" />
      {renderHeader()}
      <View style={chatStyles.contentArea}>
        {!chatId ? (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={chatStyles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => router.push({ pathname: '/screens/ChatScreen', params: { chatId: item.id } })}
                style={chatStyles.chatItem}
              >
                <View style={chatStyles.avatar}>
                  {item.displayPhoto ? (
                    <Image source={{ uri: item.displayPhoto }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                  ) : (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#AF0B01', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.displayEmail?.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={chatStyles.chatInfo}>
                  <Text style={chatStyles.userName}>{item.displayEmail}</Text>
                  <Text style={chatStyles.lastMsg} numberOfLines={1}>
                    {item.lastMsgDisplay}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
            <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
              <FlatList
                data={messages}
                inverted
                keyExtractor={(item) => item.id}
                contentContainerStyle={chatStyles.messageList}
                style={{ flex: 1 }}
                automaticallyAdjustKeyboardInsets={true}
                renderItem={({ item }) => {
                  const isMine = item.senderId === auth.currentUser?.uid;
                  return (
                    <View style={[chatStyles.bubble, isMine ? chatStyles.myBubble : chatStyles.theirBubble]}>
                      <Text style={[chatStyles.msgText, { color: isMine ? '#FFF' : '#222D31' }]}>
                        {item.text}
                      </Text>
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
                />
                <TouchableOpacity onPress={sendMessage} style={chatStyles.sendBtn}>
                  <Ionicons name="send" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
        )}
      </View>
      {!chatId && <BottomNav />}
      </View>
    </View>
  );
}