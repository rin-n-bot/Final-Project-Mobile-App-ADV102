import React, { useState, useEffect } from 'react';
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
} from 'react-native';

const { width } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth } from '../../../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  where,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { chatStyles } from './styles';
import { transStyles as styles, scale } from '../transactions/styles';
import { Image } from 'expo-image';

const formatTimeLabel = (seconds: number): string => {
  const msgDate = new Date(seconds * 1000);
  const now = new Date();
  const diffMs = now.getTime() - msgDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function ChatScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const enriched = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          const otherId = data.participants.find((id: string) => id !== user.uid);
          let name = 'User', photo = null;
          if (otherId) {
            const profileSnap = await getDoc(doc(db, 'profiles', otherId));
            const uSnap = await getDoc(doc(db, 'users', otherId));
            if (uSnap.exists()) name = uSnap.data().email;
            if (profileSnap.exists()) photo = profileSnap.data().profilePicUrl || null;
          }

          const isMe = data.lastSenderEmail === auth.currentUser?.email;
          return {
            id: d.id,
            ...data,
            displayEmail: name,
            displayPhoto: photo,
            updatedAtSeconds: data.updatedAt?.seconds ?? null,
            lastMsgDisplay: data.lastMessage
              ? `${isMe ? 'You: ' : ''}${data.lastMessage}`
              : 'No messages yet',
          };
        })
      );
      setChats(enriched);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
          style={[
            styles.logoMini,
            { flex: 1 },
            isSelectionMode && { color: '#FFF' },
          ]}
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

      <View style={{ flex: 1, backgroundColor: '#FFF' }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#AF0B01" />
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            extraData={tick}
            contentContainerStyle={{ padding: scale(20) }}
            renderItem={({ item }) => {
              const isSelected = selectedChatIds.includes(item.id);
              const timeLabel = item.updatedAtSeconds
                ? formatTimeLabel(item.updatedAtSeconds)
                : '';

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
                      : router.push({
                          pathname: '../../message/convo',
                          params: { chatId: item.id },
                        })
                  }
                  style={[
                    chatStyles.chatItem,
                    isSelected && { borderColor: '#AF0B01', backgroundColor: '#FFF9F9' },
                  ]}
                >
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

                  <View style={[chatStyles.chatInfo, { overflow: 'hidden' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text
                        style={[chatStyles.userName, { flex: 1, flexShrink: 1, marginRight: scale(8) }]}
                        numberOfLines={1}
                      >
                        {item.displayEmail}
                      </Text>
                      {timeLabel ? (
                        <Text style={{ fontSize: scale(11), fontWeight: '700', color: '#9CA3AF', flexShrink: 0 }}>
                          {timeLabel}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={chatStyles.lastMsg} numberOfLines={1}>
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
              <View style={{ alignItems: 'center', marginTop: scale(195) }}>
                <Ionicons name="chatbubbles-outline" size={scale(70)} color="#cfd4da" />
                <Text style={[styles.noResultsText, { marginTop: scale(10) }]}>
                  No Messages Yet
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}