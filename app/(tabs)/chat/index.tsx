import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';

const { width } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth } from '../../../firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  where,
  getDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { chatStyles } from './styles';
import { transStyles as styles, scale } from '../transactions/styles';
import { Image } from 'expo-image';


// --- TIME LABEL ---
const formatTimeLabel = (seconds: number): string => {
  const msgDate = new Date(seconds * 1000);
  const now = new Date();

  const isToday =
    msgDate.getDate() === now.getDate() &&
    msgDate.getMonth() === now.getMonth() &&
    msgDate.getFullYear() === now.getFullYear();

  if (isToday) {
    return msgDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const diffDays = Math.floor((now.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays < 7) return msgDate.toLocaleDateString(undefined, { weekday: 'short' });

  const sameYear = msgDate.getFullYear() === now.getFullYear();
  return msgDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
};

type ChatTab = 'listing' | 'renting';

export default function ChatScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatTab, setChatTab] = useState<ChatTab>('listing');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  // Search state
const [isSearchVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
const searchBarHeight = useRef(new Animated.Value(52)).current;
  const searchInputRef = useRef<TextInput>(null);

  // Tab fade
  const fadeAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [chatTab]);

  // Tick every 60s
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const enriched = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          const otherId = data.participants.find((id: string) => id !== user.uid);
          let name = 'User', photo = null;

          if (otherId) {
            const [profileSnap, uSnap] = await Promise.all([
              getDoc(doc(db, 'profiles', otherId)),
              getDoc(doc(db, 'users', otherId)),
            ]);
            if (uSnap.exists()) name = uSnap.data().email;
            if (profileSnap.exists()) photo = profileSnap.data().profilePicUrl || null;
          }

          const isMe = data.lastSenderEmail === user.email;
          const readBy: string[] = data.readBy ?? [];
          const isUnread = !!data.lastMessage && !isMe && !readBy.includes(user.uid);

          let role: ChatTab = 'renting';
          if (otherId) {
            const txSnap = await getDocs(
              query(
                collection(db, 'transactions'),
                where('ownerId', '==', user.uid),
                where('renterId', '==', otherId)
              )
            );
            if (!txSnap.empty) role = 'listing';
          }

          return {
            id: d.id,
            ...data,
            displayEmail: name,
            displayPhoto: photo,
            updatedAtSeconds: data.updatedAt?.seconds ?? null,
            lastMsgDisplay: data.lastMessage
              ? `${isMe ? 'You: ' : ''}${data.lastMessage}`
              : 'No messages yet',
            isUnread,
            role,
          };
        })
      );

      enriched.sort((a, b) => (b.updatedAtSeconds ?? 0) - (a.updatedAtSeconds ?? 0));
      setChats(enriched);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredChats = chats.filter((c) => {
    const matchesTab = c.role === chatTab;
    if (!matchesTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.displayEmail?.toLowerCase().includes(q) ||
      c.lastMsgDisplay?.toLowerCase().includes(q)
    );
  });

  const toggleChatSelection = (id: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedChatIds.length === 0) return;
    Alert.alert(
      'Delete Conversations',
      `Delete ${selectedChatIds.length} conversation(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedChatIds) {
                await deleteDoc(doc(db, 'chats', id));
              }
              setIsSelectionMode(false);
              setSelectedChatIds([]);
            } catch (error) {
              console.error(error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, isSelectionMode && { backgroundColor: '#AF0B01' }]}
    >
      <StatusBar barStyle={isSelectionMode ? 'light-content' : 'dark-content'} />

      {/* TOP NAV */}
      <View style={[styles.topNav, isSelectionMode && { backgroundColor: '#AF0B01' }]}>
        {isSelectionMode && (
          <TouchableOpacity
            onPress={() => { setIsSelectionMode(false); setSelectedChatIds([]); }}
            style={{ marginRight: scale(12) }}
          >
            <Ionicons name="close-outline" size={scale(26)} color="#FFF" />
          </TouchableOpacity>
        )}
        <Text
          style={[styles.logoMini, { flex: 1 }, isSelectionMode && { color: '#FFF' }]}
        >
          {isSelectionMode ? `${selectedChatIds.length} Selected` : 'Messages'}
        </Text>
        {isSelectionMode ? (
          <TouchableOpacity onPress={handleDeleteSelected}>
            <Ionicons name="trash-outline" size={scale(24)} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
  <Text style={{ fontWeight: '700', color: '#AF0B01' }}>Select</Text>
</TouchableOpacity>
        )}
      </View>

      {/* SEARCH BAR (animated height) */}
      {isSearchVisible && (
        <View
          style={{
            height: 52,
            overflow: 'hidden',
            backgroundColor: '#FFF',
            paddingHorizontal: scale(16),
            justifyContent: 'center',

          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F3F4F6',
              borderRadius: 10,
              paddingHorizontal: scale(10),
              height: 38,
            }}
          >
            <Ionicons name="search-outline" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search messages..."
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                fontSize: scale(14),
                color: '#222D31',
                paddingVertical: 0,
              }}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* TABS — hidden in selection mode */}
      {!isSelectionMode && (
        <View style={{ flexDirection: 'row', paddingHorizontal: scale(10), backgroundColor: '#FFF' }}>
          {(['listing', 'renting'] as ChatTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setChatTab(tab)}
              style={{
                flex: 1,
                paddingVertical: scale(12),
                borderBottomWidth: 2,
                borderBottomColor: chatTab === tab ? '#AF0B01' : 'transparent',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: scale(13),
                  fontWeight: '800',
                  color: chatTab === tab ? '#AF0B01' : '#9CA3AF',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* LIST */}
      <Animated.View style={{ flex: 1, backgroundColor: '#FFF', opacity: fadeAnim }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#AF0B01" />
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            extraData={tick}
            contentContainerStyle={{ padding: scale(20) }}
            renderItem={({ item }) => {
              const isSelected = selectedChatIds.includes(item.id);
              const timeLabel = item.updatedAtSeconds ? formatTimeLabel(item.updatedAtSeconds) : '';

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onLongPress={() => {
                    setIsSelectionMode(true);
                    toggleChatSelection(item.id);
                  }}
                  onPress={() =>
                    isSelectionMode
                      ? toggleChatSelection(item.id)
                      : router.push({ pathname: '../../message/convo', params: { chatId: item.id } })
                  }
                  style={[
                    chatStyles.chatItem,
                    isSelected && { borderColor: '#AF0B01', backgroundColor: '#FFF9F9' },
                  ]}
                >
                  {/* AVATAR */}
                  <View style={chatStyles.avatar}>
                    {item.displayPhoto ? (
                      <Image
                        source={{ uri: item.displayPhoto }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: '#222D31',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>
                          {item.displayEmail?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* CHAT INFO */}
                  <View style={[chatStyles.chatInfo, { overflow: 'hidden' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text
                        style={[
                          chatStyles.userName,
                          { flex: 1, flexShrink: 1, marginRight: scale(8) },
                          item.isUnread && { color: '#111', fontWeight: '900' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.displayEmail}
                      </Text>
                      {timeLabel ? (
                        <Text
                          style={{
                            fontSize: scale(11),
                            fontWeight: '700',
                            color: item.isUnread ? '#222D31' : '#9CA3AF',
                            flexShrink: 0,
                          }}
                        >
                          {timeLabel}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        chatStyles.lastMsg,
                        item.isUnread && { color: '#222D31', fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {item.lastMsgDisplay}
                    </Text>
                  </View>

                  {isSelectionMode && (
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color="#AF0B01"
                      style={{ marginLeft: scale(8) }}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              searchQuery.trim() ? (
                <View style={{ alignItems: 'center', marginTop: scale(195) }}>
                  <Ionicons name="search-outline" size={scale(70)} color="#cfd4da" />
                  <Text style={[styles.noResultsText, { marginTop: scale(10) }]}>
                    No results for "{searchQuery}"
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', marginTop: scale(195) }}>
                  <Ionicons name="chatbubbles-outline" size={scale(70)} color="#cfd4da" />
                  <Text style={[styles.noResultsText, { marginTop: scale(10) }]}>
                    No Messages Yet
                  </Text>
                </View>
              )
            }
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}