import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { chatStyles } from '../(tabs)/chat/styles';
import { auth, db } from '../../firebase';

// 1 minute gap threshold for Messenger-style behavior
const TIME_GAP_THRESHOLD_MS = 1 * 60 * 1000;

const formatDividerTime = (seconds: number): string => {
  if (!seconds) return 'Pending';

  // 1. Convert Firestore seconds to a Date object
  const date = new Date(seconds * 1000);
  
  // 2. Adjust for Philippines Time (UTC+8) manually to avoid "Invalid Date"
  // This works universally across all devices/engines
  const PHT_OFFSET = 8 * 60 * 60 * 1000;
  const phtDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + PHT_OFFSET);
  const phtNow = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + PHT_OFFSET);

  // 3. Setup helpers for "Today" and "Yesterday"
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const yesterday = new Date(phtNow);
  yesterday.setDate(phtNow.getDate() - 1);

  // 4. Format the Time part (e.g., 10:30 PM)
  const hours = phtDate.getHours();
  const minutes = phtDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const minStr = minutes < 10 ? `0${minutes}` : minutes;
  const timeStr = `${hour12}:${minStr} ${ampm}`;

  // 5. Messenger Logic: Today, Yesterday, Weekday, or Full Date
  if (isSameDay(phtDate, phtNow)) {
    return timeStr;
  }

  if (isSameDay(phtDate, yesterday)) {
    return `Yesterday ${timeStr}`;
  }

  const diffTime = phtNow.getTime() - phtDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[phtDate.getDay()]} ${timeStr}`;
  }

  // Older than a week
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = months[phtDate.getMonth()];
  const day = phtDate.getDate();
  const year = phtDate.getFullYear();
  const sameYear = year === phtNow.getFullYear();

  return `${monthStr} ${day}${sameYear ? '' : `, ${year}`} ${timeStr}`;
};

type MessageItem =
  | { type: 'message'; id: string; data: any; showAvatar: boolean }
  | { type: 'divider'; id: string; label: string };


const buildMessageItems = (messages: any[]): MessageItem[] => {
  const items: MessageItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prevMsg = messages[i - 1]; // Message sent "after" this one in the list (since it's inverted)
    
    // Avatar logic remains the same
    const isLastInStack = !prevMsg || prevMsg.senderId !== msg.senderId;
    items.push({ type: 'message', id: msg.id, data: msg, showAvatar: isLastInStack });

    const nextMsg = messages[i + 1]; // Message sent "before" this one
    if (nextMsg) {
      const currTime = (msg.createdAt?.seconds ?? 0) * 1000;
      const nextTime = (nextMsg.createdAt?.seconds ?? 0) * 1000;
      const gap = currTime - nextTime;

      // Only show a divider if the gap is 1 minute or more
      if (gap >= TIME_GAP_THRESHOLD_MS && nextMsg.createdAt?.seconds) {
        items.push({ type: 'divider', id: `divider-${nextMsg.id}`, label: formatDividerTime(nextMsg.createdAt.seconds) });
      }
    } else if (msg.createdAt?.seconds) {
      // Always show the timestamp for the very first message in the chat
      items.push({ type: 'divider', id: `divider-first-${msg.id}`, label: formatDividerTime(msg.createdAt.seconds) });
    }
  }
  return items;
};

export default function MessageScreen() {
  const { chatId } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChatEmail, setActiveChatEmail] = useState<string | null>(null);
  const [recipientPhoto, setRecipientPhoto] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !chatId) return;
    const fetchRecipient = async () => {
      try {
        const chatSnap = await getDoc(doc(db, 'chats', chatId as string));
        if (chatSnap.exists()) {
          const data = chatSnap.data();
          const otherId = data.participants.find((id: string) => id !== user.uid);
          if (otherId) {
            setRecipientId(otherId);
            const uSnap = await getDoc(doc(db, 'users', otherId));
            if (uSnap.exists()) setActiveChatEmail(uSnap.data().email);
            const profileSnap = await getDoc(doc(db, 'profiles', otherId));
            if (profileSnap.exists()) setRecipientPhoto(profileSnap.data().profilePicUrl || null);
          }
          const readBy: string[] = data.readBy ?? [];
          if (!readBy.includes(user.uid)) {
            await updateDoc(doc(db, 'chats', chatId as string), { readBy: arrayUnion(user.uid) });
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchRecipient();
    const q = query(collection(db, 'chats', chatId as string, 'messages'), orderBy('createdAt', 'desc'));
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
      // [GHOST-FIX-2] Create message first
      const messageRef = await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
        text: messageToSend,
        senderId: user?.uid,
        senderEmail: user?.email,
        createdAt: serverTimestamp(),
      });

      // [GHOST-FIX-2] Only update metadata if message was created successfully
      if (!messageRef.id) {
        throw new Error('Failed to create message');
      }

      await updateDoc(doc(db, 'chats', chatId as string), {
        lastMessage: messageToSend,
        lastSenderEmail: user?.email,
        updatedAt: serverTimestamp(),
        readBy: [user?.uid],
      });
    } catch (e) {
      console.error('[GHOST-FIX-2] sendMessage error:', e);
    }
  };

  const navigateToProfile = () => {
    if (recipientId) {
      router.push({ pathname: '/profile', params: { viewUserId: recipientId } });
    }
  };

  const messageItems = buildMessageItems(messages);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#AF0B01" />
      <View style={chatStyles.redHeader}>
        <SafeAreaView style={chatStyles.safeAreaCustom}>
          <View style={{ height: 60, width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
            <TouchableOpacity onPress={() => router.back()} style={chatStyles.iconButton}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={navigateToProfile}
              style={{
                width: 34, height: 34, borderRadius: 17, backgroundColor: '#222D31',
                justifyContent: 'center', alignItems: 'center', marginLeft: 10, overflow: 'hidden',
              }}
            >
              {recipientPhoto ? (
                <Image source={{ uri: recipientPhoto }} style={{ width: 34, height: 34, borderRadius: 17 }} />
              ) : (
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>
                  {activeChatEmail?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={navigateToProfile} style={{ flex: 1 }}>
              <Text style={[chatStyles.headerTitle, { marginLeft: 10, textAlign: 'left' }]} numberOfLines={1}>
                {activeChatEmail || 'Loading...'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
      <View style={chatStyles.contentArea}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#AF0B01" /></View>
        ) : (
          <>
            <FlatList
              data={messageItems} inverted keyExtractor={(item) => item.id}
              contentContainerStyle={chatStyles.messageList}
              renderItem={({ item }) => {
                if (item.type === 'divider') {
                  return (
                    <View style={{ alignItems: 'center', marginVertical: 15 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' }}>
                        {item.label}
                      </Text>
                    </View>
                  );
                }
                const msg = item.data;
                const isMine = msg.senderId === auth.currentUser?.uid;
                const showAvatar = item.showAvatar;
                return (
                  <View style={{ flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', marginVertical: 10 }}>
                    {!isMine && (
                      <View style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, flexShrink: 0, opacity: showAvatar ? 1 : 0, overflow: 'hidden', backgroundColor: showAvatar ? '#222D31' : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                        {showAvatar && (recipientPhoto ? <Image source={{ uri: recipientPhoto }} style={{ width: 28, height: 28, borderRadius: 14 }} /> : <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{msg.senderEmail?.charAt(0).toUpperCase()}</Text>)}
                      </View>
                    )}
                    <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderBottomRightRadius: isMine ? 4 : 22, borderBottomLeftRadius: isMine ? 22 : 4, backgroundColor: isMine ? '#222D31' : '#FFFFFF', maxWidth: '85%', ...(isMine ? {} : Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } : { elevation: 2 }) }}>
                      <Text style={{ fontSize: 15, lineHeight: 22, color: isMine ? '#FFF' : '#222D31', flexWrap: 'wrap', width: '100%' }}>{msg.text}</Text>
                    </View>
                  </View>
                );
              }}
            />
            <View style={[chatStyles.inputArea, { marginBottom: keyboardHeight + 24 }]}>
              <TextInput style={chatStyles.textInput} placeholder="Type message..." placeholderTextColor="#999" value={inputText} onChangeText={setInputText} multiline blurOnSubmit={false} />
              <TouchableOpacity onPress={sendMessage} style={chatStyles.sendBtn}><Ionicons name="send" size={18} color="#FFF" /></TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}