import React from 'react';
import { Modal, SafeAreaView, View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, scale } from '../styles'; 
import { db, auth } from '../../../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

interface ModalItemDetailsProps {
  selectedItem: any;
  setSelectedItem: (item: any) => void;
}

export const ModalItemDetails = ({ selectedItem, setSelectedItem }: ModalItemDetailsProps) => {
  const router = useRouter();
  const user = auth.currentUser;
  const isOwner = user?.uid === selectedItem?.ownerId;

  const handleAction = async () => {
    if (!user) {
      Alert.alert("Authentication", "Please log in to continue.");
      return;
    }

    if (isOwner) {
      setSelectedItem(null);
      router.push({
        pathname: '/screens/MyListingScreen/components/EditItem',
        params: { itemId: selectedItem.id }
      });
      return;
    }

    try {
      const chatRef = collection(db, 'chats');
      const q = query(chatRef, where('participants', 'array-contains', user.uid));
      const snapshot = await getDocs(q);
      
      let chatId = null;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants && data.participants.includes(selectedItem?.ownerId)) {
          chatId = doc.id;
        }
      });

      if (!chatId) {
        const newDoc = await addDoc(chatRef, {
          participants: [user.uid, selectedItem?.ownerId],
          senderEmail: user.email,
          lastMessage: "Start a conversation",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        chatId = newDoc.id;
      }

      setSelectedItem(null);
      router.push({ 
        pathname: '/screens/ChatScreen', 
        params: { chatId: chatId } 
      });

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to initialize chat.");
    }
  };

  return (
    <Modal 
      visible={selectedItem !== null} 
      animationType="slide" 
      transparent={false}
      onRequestClose={() => setSelectedItem(null)}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* HEADER */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.modalCloseBtn}>
            <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>Item Details</Text>
          <TouchableOpacity style={styles.modalCloseBtn}>
            <Ionicons name="share-social-outline" size={scale(22)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <Image source={{ uri: selectedItem?.imageUrl || selectedItem?.image }} style={styles.modalImage} />
          
          <View style={styles.modalInfoSection}>
            <View style={styles.modalRow}>
              <Text style={styles.modalCategory}>{selectedItem?.category}</Text>
              <View style={[styles.statusBadge, { backgroundColor: selectedItem?.status === 'Available' ? '#E8F5E9' : '#FFEBEE' }]}>
                <Text style={[styles.statusTextPlain, { color: selectedItem?.status === 'Available' ? '#27AE60' : '#AF0B01' }]}>
                  {selectedItem?.status}
                </Text>
              </View>
            </View>

            <Text style={styles.modalTitle}>{selectedItem?.name || selectedItem?.title}</Text>
            <Text style={styles.modalPrice}>{selectedItem?.price}</Text>
            
            <View style={styles.divider} />

            {/* OWNER EMAIL SECTION */}
            <Text style={styles.detailLabel}>Owner</Text>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={scale(16)} color="#AF0B01" />
              <Text style={styles.detailValueContact}>{selectedItem?.ownerEmail || "Not provided"}</Text>
            </View>
            
            {/* DESCRIPTION SECTION */}
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{selectedItem?.description || "No description provided."}</Text>
            
            {/* LOCATION SECTION */}
            <Text style={styles.detailLabel}>Location</Text>
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={scale(16)} color="#AF0B01" />
              <Text style={styles.detailValueContact}>{selectedItem?.location}</Text>
            </View>

            {/* POSTED ON SECTION */}
            <Text style={styles.detailLabel}>Posted On</Text>
            <View style={styles.contactRow}>
              <Ionicons name="calendar-outline" size={scale(16)} color="#AF0B01" />
              <Text style={styles.detailValueContact}>{selectedItem?.timestamp || selectedItem?.createdAt || "Recently"}</Text>
            </View>
          </View>
        </ScrollView>

        {/* FOOTER ACTIONS - Save Button Removed, Message/Edit Centered */}
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.messageBtn} onPress={handleAction}>
            {!isOwner && <Ionicons name="chatbubble-ellipses" size={scale(20)} color="#FFFFFF" style={{ marginRight: 8 }} />}
            <Text style={styles.messageBtnText}>
              {isOwner ? "Edit Item" : "Message Owner"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};