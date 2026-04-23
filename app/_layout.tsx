import { Stack } from 'expo-router';
import { collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DrawerMenu } from '../components/ui/DrawerMenu';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DrawerProvider } from '../context/DrawerContext';
import { db } from '../firebase';

function RootLayoutContent() {
  const { user, loading } = useAuth();

  // [GHOST-FIX-3] Cleanup empty/ghost chat documents on app load
  useEffect(() => {
    if (!user) return;

    const cleanupGhostChats = async () => {
      try {
        // Query all chats where user is a participant
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const chatsSnap = await getDocs(chatsQuery);

        let deletedCount = 0;

        for (const chatDoc of chatsSnap.docs) {
          // [GHOST-FIX-3] Check if chat has required fields
          const chatData = chatDoc.data();
          const hasParticipants = chatData.participants && Array.isArray(chatData.participants);
          const hasUpdatedAt = chatData.updatedAt;
          const hasLastMessage = chatData.lastMessage;
          const hasSenderEmail = chatData.lastSenderEmail;

          // [GHOST-FIX-3] Check if chat has any messages
          const messagesQuery = collection(db, 'chats', chatDoc.id, 'messages');
          const messagesSnap = await getDocs(messagesQuery);

          // [GHOST-FIX-3] Delete if: missing fields OR has no messages (more aggressive cleanup)
          const shouldDelete =
            !hasParticipants ||
            !hasUpdatedAt ||
            !hasLastMessage ||
            !hasSenderEmail ||
            messagesSnap.empty; // [GHOST-FIX-3] Delete ANY chat with no messages

          if (shouldDelete) {
            console.warn('[GHOST-FIX-3] Deleting ghost chat:', chatDoc.id, {
              hasParticipants,
              hasUpdatedAt,
              hasLastMessage,
              hasSenderEmail,
              hasMessages: !messagesSnap.empty,
            });
            await deleteDoc(chatDoc.ref);
            deletedCount++;
          }
        }

        if (deletedCount > 0) {
          console.log(`[GHOST-FIX-3] Cleaned up ${deletedCount} ghost document(s)`);
        }
      } catch (error) {
        console.error('[GHOST-FIX-3] Cleanup error:', error);
      }
    };

    // Run cleanup on app load
    cleanupGhostChats();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#AF0B01" />
      </View>
    );
  }

  return (
    <DrawerProvider>
      <View style={{ flex: 1 }}>
        {user && <DrawerMenu />}
        <Stack screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="add"
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen name="profile" />
              <Stack.Screen name="my-listing" />
              <Stack.Screen name="message" />
              <Stack.Screen name="modal" />
            </>
          ) : (
            <Stack.Screen name="(auth)" />
          )}
        </Stack>
      </View>
    </DrawerProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}