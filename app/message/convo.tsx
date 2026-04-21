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
  Platform,
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
  arrayUnion,
} from 'firebase/firestore';
import { chatStyles } from '../(tabs)/chat/styles';
import { Image } from 'expo-image';
import { scale } from '../(tabs)/transactions/styles';

// --- MESSENGER-STYLE TIME DIVIDER LOGIC ---
const TIME_GAP_THRESHOLD_MS = 15 * 60 * 1000;

const formatDividerTime = (seconds: number): string => {
  const date = new Date(seconds * 1000);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return timeStr;
  if (isYesterday) return `Yesterday ${timeStr}`;

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' }) + ' ' + timeStr;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return (
    date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(sameYear ? {} : { year: 'numeric' }),
    }) +
    ' ' +
    timeStr
  );
};

type MessageItem =
  | { type: 'message'; id: string; data: any; showAvatar: boolean }
  | { type: 'divider'; id: string; label: string };

// Build items with messenger-style avatar suppression for stacked messages.
// Since FlatList is inverted (index 0 = newest), "next" in the array = older message.
// Avatar is shown on a received message only if the message immediately below it
// (i.e. the next item in the descending array, which visually appears above) is from
// a different sender OR is a divider / doesn't exist.
const buildMessageItems = (messages: any[]): MessageItem[] => {
  const items: MessageItem[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prevMsg = messages[i - 1]; // visually below (newer) in inverted list

    // Determine if avatar should show for this received message.
    // Show avatar when the message above it visually (prevMsg, which is newer) is from
    // a different sender, meaning this is the bottom-most bubble in a stack.
    const isLastInStack =
      !prevMsg || prevMsg.senderId !== msg.senderId;

    items.push({
      type: 'message',
      id: msg.id,
      data: msg,
      showAvatar: isLastInStack,
    });

    const nextMsg = messages[i + 1];
    if (nextMsg) {
      const currTime = (msg.createdAt?.seconds ?? 0) * 1000;
      const nextTime = (nextMsg.createdAt?.seconds ?? 0) * 1000;
      const gap = currTime - nextTime;
      if (gap >= TIME_GAP_THRESHOLD_MS && nextMsg.createdAt?.seconds) {
        items.push({
          type: 'divider',
          id: `divider-${nextMsg.id}`,
          label: formatDividerTime(nextMsg.createdAt.seconds),
        });
      }
    } else {
      // Always show time after the oldest message
      if (msg.createdAt?.seconds) {
        items.push({
          type: 'divider',
          id: `divider-first-${msg.id}`,
          label: formatDividerTime(msg.createdAt.seconds),
        });
      }
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
          const data = chatSnap.data();
          const participants = data.participants;
          const otherId = participants.find((id: string) => id !== user.uid);

          if (otherId) {
            const uSnap = await getDoc(doc(db, 'users', otherId));
            if (uSnap.exists()) setActiveChatEmail(uSnap.data().email);

            const profileSnap = await getDoc(doc(db, 'profiles', otherId));
            if (profileSnap.exists()) {
              setRecipientPhoto(profileSnap.data().profilePicUrl || null);
            }
          }

          // MARK AS READ: add current user's uid to readBy array
          // This clears the unread highlight on the chat list screen
          const readBy: string[] = data.readBy ?? [];
          if (!readBy.includes(user.uid)) {
            await updateDoc(doc(db, 'chats', chatId as string), {
              readBy: arrayUnion(user.uid),
            });
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
      // When I send, reset readBy to only me (others haven't read it yet)
      await updateDoc(doc(db, 'chats', chatId as string), {
        lastMessage: messageToSend,
        lastSenderEmail: user?.email,
        updatedAt: serverTimestamp(),
        readBy: [user?.uid],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const messageItems = buildMessageItems(messages);

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

            {/* RECIPIENT AVATAR — same bg as bubble avatar */}
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#222D31',
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
              data={messageItems}
              inverted
              keyExtractor={(item) => item.id}
              contentContainerStyle={chatStyles.messageList}
              renderItem={({ item }) => {
                // TIME DIVIDER
                if (item.type === 'divider') {
                  return (
                    <View style={{ alignItems: 'center', marginVertical: 15 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: '#9CA3AF',
                          backgroundColor: '#F3F4F6',
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  );
                }

                // MESSAGE BUBBLE
                const msg = item.data;
                const isMine = msg.senderId === auth.currentUser?.uid;
                const showAvatar = item.showAvatar;

                // Spacing: tighter between stacked messages from same sender
                return (
                  <View
                    style={{
                      flexDirection: isMine ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      marginVertical: 10,
                    }}
                  >
                    {/* RECIPIENT AVATAR — only shown on last bubble in a stack */}
                    {!isMine && (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          marginRight: 8,
                          flexShrink: 0,
                          // Reserve space even when avatar hidden, so bubbles align
                          opacity: showAvatar ? 1 : 0,
                          overflow: 'hidden',
                          backgroundColor: showAvatar ? '#222D31' : 'transparent',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {showAvatar && (
                          recipientPhoto ? (
                            <Image
                              source={{ uri: recipientPhoto }}
                              style={{ width: 28, height: 28, borderRadius: 14 }}
                            />
                          ) : (
                            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                              {msg.senderEmail?.charAt(0).toUpperCase()}
                            </Text>
                          )
                        )}
                      </View>
                    )}

                    {/* BUBBLE — capsule, no border, shadow for their bubbles */}
                    <View
                      style={{
                        maxWidth: '72%',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 22,
                        borderBottomRightRadius: isMine ? 4 : 22,
                        borderBottomLeftRadius: isMine ? 22 : 4,
                        backgroundColor: isMine ? '#222D31' : '#FFFFFF',
                        // Shadow for received bubbles (replaces border)
                        ...(isMine
                          ? {}
                          : Platform.OS === 'ios'
                          ? {
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.08,
                              shadowRadius: 4,
                            }
                          : {
                              elevation: 2,
                            }),
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          lineHeight: 22,
                          color: isMine ? '#FFF' : '#222D31',
                          flexShrink: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        {msg.text}
                      </Text>
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