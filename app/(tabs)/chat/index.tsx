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
  StyleSheet
} from 'react-native';
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
  deleteDoc
} from 'firebase/firestore';

import { chatStyles } from './styles';
import { Image } from 'expo-image';

export default function ChatScreen() {
  const router = useRouter();

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection Logic
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);

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
          let name = "User", photo = null;
          if (otherId) {
            const uSnap = await getDoc(doc(db, 'users', otherId));
            if (uSnap.exists()) {
              name = uSnap.data().email; 
              photo = uSnap.data().photoURL;
            }
          }
          const isMe = data.lastSenderEmail === auth.currentUser?.email;
          return { 
            id: d.id, 
            ...data, 
            displayEmail: name, 
            displayPhoto: photo, 
            lastMsgDisplay: data.lastMessage ? `${isMe ? "You: " : ""}${data.lastMessage}` : "No messages yet" 
          };
        })
      );
      setChats(enriched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const renderHeader = () => {
    const headerDisplayText = isSelectionMode ? `${selectedChatIds.length} Selected` : "Messages";

    return (
      <View style={chatStyles.redHeader}>
        <SafeAreaView style={chatStyles.safeAreaCustom}>
          <View style={{ height: 60, width: '100%', flexDirection: 'row', alignItems: 'center' }}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={chatStyles.headerTitle}>{headerDisplayText}</Text>
              </View>
            </View>

            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15 }}>
              <View style={{ width: 50 }}>
                {isSelectionMode && (
                  <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedChatIds([]); }} style={chatStyles.iconButton}>
                    <Ionicons name="close" size={26} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                onPress={() => { setIsSelectionMode(!isSelectionMode); setSelectedChatIds([]); }}
                style={{ width: 60, alignItems: 'flex-end' }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>
                  {isSelectionMode ? "Cancel" : "Select"}
                </Text>
              </TouchableOpacity>
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
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[chatStyles.listContainer, { paddingBottom: 100, flexGrow: 1 }]}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 100 }}>
                <Ionicons name="chatbubbles-outline" size={80} color="#cfd4da" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#cfd4da', marginTop: 15 }}>No Messages Yet</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedChatIds.includes(item.id);
              return (
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => 
                    isSelectionMode 
                    ? toggleChatSelection(item.id) 
                    : router.push({ pathname: '../../message/convo', params: { chatId: item.id } })
                  }
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
                    <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={26} color="#AF0B01" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {isSelectionMode && selectedChatIds.length > 0 && (
        <TouchableOpacity style={chatStyles.fab} onPress={handleDeleteSelected}>
          <Ionicons name="trash" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}