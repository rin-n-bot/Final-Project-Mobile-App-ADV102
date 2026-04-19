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
  Keyboard,
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
  getDoc,
} from 'firebase/firestore';
import { chatStyles } from '../(tabs)/chat/styles';
import { Image } from 'expo-image';
import { scale } from '../(tabs)/transactions/styles';

export default function MessageScreen() {
  const { chatId } = useLocalSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChatEmail, setActiveChatEmail] = useState<string | null>(null);
  const [recipientPhoto, setRecipientPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

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

            // Fetch profile pic from profiles collection
            const profileSnap = await getDoc(doc(db, 'profiles', otherId));
            if (profileSnap.exists()) {
              setRecipientPhoto(profileSnap.data().profilePicUrl || null);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching recipient:', e);
      }
    };
    fetchRecipient();

    const q = query(
      collection(db, 'chats', chatId as string, 'messages'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', chatId as string), {
        lastMessage: messageToSend,
        lastSenderEmail: user?.email,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const formatMsgTime = (seconds: number): string => {
    const date = new Date(seconds * 1000);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#AF0B01" />

      {/* HEADER */}
      <View style={chatStyles.redHeader}>
        <SafeAreaView style={chatStyles.safeAreaCustom}>
          <View
            style={{
              height: 60,
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 15,
            }}
          >
            <TouchableOpacity onPress={() => router.back()} style={chatStyles.iconButton}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>

            {/* RECIPIENT AVATAR in header */}
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 10,
                overflow: 'hidden',
              }}
            >
              {recipientPhoto ? (
                <Image
                  source={{ uri: recipientPhoto }}
                  style={{ width: 34, height: 34, borderRadius: 17 }}
                />
              ) : (
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>
                  {activeChatEmail?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              )}
            </View>

            <Text
              style={[chatStyles.headerTitle, { marginLeft: 10, flex: 1, textAlign: 'left' }]}
              numberOfLines={1}
            >
              {activeChatEmail || 'Loading...'}
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
          <>
            <FlatList
              data={messages}
              inverted
              keyExtractor={(item) => item.id}
              contentContainerStyle={chatStyles.messageList}
              renderItem={({ item }) => {
                const isMine = item.senderId === auth.currentUser?.uid;
                const timeStr = item.createdAt?.seconds
                  ? formatMsgTime(item.createdAt.seconds)
                  : '';

                return (
                  <View
                    style={{
                      flexDirection: isMine ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      marginVertical: 4,
                    }}
                  >
                    {/* RECIPIENT AVATAR beside bubble */}
                    {!isMine && (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: '#222D31',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 8,
                          overflow: 'hidden',
                        }}
                      >
                        {recipientPhoto ? (
                          <Image
                            source={{ uri: recipientPhoto }}
                            style={{ width: 28, height: 28, borderRadius: 14 }}
                          />
                        ) : (
                          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                            {item.senderEmail?.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* BUBBLE + TIME stacked */}
                    <View
                      style={{
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '78%',
                      }}
                    >
                      <View
                        style={[
                          chatStyles.bubble,
                          isMine ? chatStyles.myBubble : chatStyles.theirBubble,
                          { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 2 },
                        ]}
                      >
                        <Text style={[chatStyles.msgText, { color: isMine ? '#FFF' : '#222D31' }]}>
                          {item.text}
                        </Text>
                      </View>
                      {/* TIME beside/below bubble */}
                      {timeStr ? (
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: '#9CA3AF',
                            marginBottom: 4,
                            paddingHorizontal: 4,
                          }}
                        >
                          {timeStr}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              }}
            />

            <View
              style={[chatStyles.inputArea, { marginBottom: keyboardHeight + 24 }]}
            >
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
          </>
        )}
      </View>
    </View>
  );
}