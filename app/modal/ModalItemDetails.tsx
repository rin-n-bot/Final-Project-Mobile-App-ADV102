import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, Modal, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { scale, styles } from '../(tabs)/home/styles';
import { auth, db } from '../../firebase'; // Added db import
import { handleRentRequest } from '../../services/transactionService';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';

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
      router.push({ pathname: '/screens/MyListingScreen/components/EditItem', params: { itemId: selectedItem.id } });
      return;
    }

    if (selectedItem.status !== 'Available') {
      Alert.alert("Unavailable", "This item is currently pending or rented.");
      return;
    }

    try {
      // 1. Process the standard rental request
      await handleRentRequest(selectedItem, user);

      // 2. Automated Chat Message Logic
      const participants = [user.uid, selectedItem.ownerId].sort();
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', '==', participants));
      const chatQuerySnapshot = await getDocs(q);

      let chatId: string;

      if (chatQuerySnapshot.empty) {
        // Create new chat if it doesn't exist
        const newChatDoc = await addDoc(chatsRef, {
          participants,
          lastMessage: `Rental Request: ${selectedItem.name}`,
          lastSenderEmail: user.email,
          updatedAt: serverTimestamp(),
        });
        chatId = newChatDoc.id;
      } else {
        // Use existing chat
        chatId = chatQuerySnapshot.docs[0].id;
      }

      const timestamp = new Date().toLocaleString();
      const requestMessage = 
        `📢 NEW RENTAL REQUEST\n\n` +
        `Item: ${selectedItem.name}\n` +
        `Renter: ${user.email}\n` +
        `Date/Time: ${timestamp}\n\n` +
        `Check status in Transactions.`;

      // Add message to the messages sub-collection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: requestMessage,
        senderId: user.uid,
        senderEmail: user.email,
        createdAt: serverTimestamp(),
        isSystem: true // Flag to identify auto-messages
      });

      // Update the chat summary
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: `Requested: ${selectedItem.name}`,
        lastSenderEmail: user.email,
        updatedAt: serverTimestamp()
      });

      Alert.alert("Success", "Rental request sent to owner!");
      setSelectedItem(null);
      router.push('/(tabs)/transactions');
    } catch (error) {
      console.error("Action Error: ", error);
      Alert.alert("Error", "Failed to process request.");
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
            
            {/* PRICE AND DURATION */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: scale(15) }}>
              <Text style={[styles.modalPrice, { marginBottom: 0 }]}>{selectedItem?.price}</Text>
              {selectedItem?.rentalPeriod && (
                <Text style={[styles.modalPrice, { marginBottom: 0 }]}> / {selectedItem.rentalPeriod}</Text>
              )}
            </View>
            
            <View style={[styles.divider, { marginBottom: scale(20) }]} />

            {/* UNIFORM INFO LABELS & ROWS */}
            <View style={{ gap: scale(18) }}>
              {/* OWNER */}
              <View>
                <Text style={styles.detailLabel}>Owner</Text>
                <View style={[styles.contactRow, { alignItems: 'flex-start' }]}>
                  <Ionicons name="mail-outline" size={scale(16)} color="#AF0B01" style={{ marginTop: 2 }} />
                  <Text style={styles.detailValueContact}>{selectedItem?.ownerEmail || "Not provided"}</Text>
                </View>
              </View>
              
              {/* DESCRIPTION */}
              <View>
                <Text style={styles.detailLabel}>Description</Text>
                <View style={[styles.contactRow, { alignItems: 'flex-start' }]}>
                  <Ionicons name="document-text-outline" size={scale(16)} color="#AF0B01" style={{ marginTop: 2 }} />
                  <Text style={[styles.detailValueContact, { fontWeight: '600', color: '#222D31' }]}>
                    {selectedItem?.description || "No description provided."}
                  </Text>
                </View>
              </View>
              
              {/* LOCATION */}
              <View>
                <Text style={styles.detailLabel}>Location</Text>
                <View style={[styles.contactRow, { alignItems: 'flex-start' }]}>
                  <Ionicons name="location-outline" size={scale(16)} color="#AF0B01" style={{ marginTop: 2 }} />
                  <Text style={styles.detailValueContact}>{selectedItem?.location}</Text>
                </View>
              </View>

              {/* POSTED ON */}
              <View>
                <Text style={styles.detailLabel}>Posted On</Text>
                <View style={[styles.contactRow, { alignItems: 'flex-start' }]}>
                  <Ionicons name="calendar-outline" size={scale(16)} color="#AF0B01" style={{ marginTop: 2 }} />
                  <Text style={styles.detailValueContact}>{selectedItem?.timestamp || selectedItem?.createdAt || "Recently"}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* FOOTER ACTIONS - Capsule Shape & Icon Fix */}
        <View style={[styles.modalFooter, { paddingBottom: Platform.OS === 'ios' ? scale(30) : scale(15) }]}>
          <TouchableOpacity 
            style={[styles.messageBtn, { borderRadius: scale(50), height: scale(46), marginHorizontal: scale(5) }]} 
            onPress={handleAction}
          >
            <Ionicons 
              name={isOwner ? "create-outline" : "chatbubble-ellipses-outline"} 
              size={scale(20)} 
              color="#FFFFFF" 
              style={{ marginRight: 8 }} 
            />
            <Text style={styles.messageBtnText}>
              {isOwner ? "Edit Item" : (selectedItem?.status === 'Available' ? "Rent Now" : "Not Available")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};