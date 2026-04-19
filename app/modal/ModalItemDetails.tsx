import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { scale, styles } from '../(tabs)/home/styles';
import { auth, db } from '../../firebase';
import { handleRentRequest } from '../../services/transactionService';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';

interface ModalItemDetailsProps {
  selectedItem: any;
  setSelectedItem: (item: any) => void;
}

const formatPostedDate = (raw: any): string => {
  let date: Date | null = null;
  if (!raw) return 'Recently';
  if (raw?.seconds) date = new Date(raw.seconds * 1000);
  else if (typeof raw === 'string') return raw;
  else if (raw instanceof Date) date = raw;
  if (!date || isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ModalItemDetails = ({ selectedItem, setSelectedItem }: ModalItemDetailsProps) => {
  const router = useRouter();
  const user = auth.currentUser;
  const isOwner = user?.uid === selectedItem?.ownerId;

  const [ownerPhoto, setOwnerPhoto] = useState<string | null>(null);

  // Fetch owner profile pic when modal opens
  useEffect(() => {
    if (!selectedItem?.ownerId) return;
    setOwnerPhoto(null);
    getDoc(doc(db, 'profiles', selectedItem.ownerId)).then((snap) => {
      if (snap.exists()) setOwnerPhoto(snap.data().profilePicUrl || null);
    });
  }, [selectedItem?.ownerId]);

  const handleAction = async () => {
    if (!user) {
      Alert.alert('Authentication', 'Please log in to continue.');
      return;
    }

    if (isOwner) {
      setSelectedItem(null);
      router.push({
        pathname: '../my-listing/components/EditItem',
        params: { itemId: selectedItem.id },
      });
      return;
    }

    if (selectedItem.status === 'rented') {
      Alert.alert('Unavailable', 'This item is currently rented.');
      return;
    }

    try {
      const transactionsRef = collection(db, 'transactions');
      const qCheck = query(
        transactionsRef,
        where('itemId', '==', selectedItem.id),
        where('renterId', '==', user.uid),
        where('status', 'in', ['requested', 'rented'])
      );
      const existingRequests = await getDocs(qCheck);
      if (!existingRequests.empty) {
        Alert.alert(
          'Notice',
          'You already have an active request or an ongoing rental for this item. Check your Transactions.'
        );
        return;
      }

      await handleRentRequest(selectedItem, user);

      const participants = [user.uid, selectedItem.ownerId].sort();
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', '==', participants));
      const chatQuerySnapshot = await getDocs(q);

      let chatId: string;
      if (chatQuerySnapshot.empty) {
        const newChatDoc = await addDoc(chatsRef, {
          participants,
          lastMessage: `Rental Request: ${selectedItem.name}`,
          lastSenderEmail: user.email,
          updatedAt: serverTimestamp(),
        });
        chatId = newChatDoc.id;
      } else {
        chatId = chatQuerySnapshot.docs[0].id;
      }

      const timestamp = new Date().toLocaleString();
      const requestMessage =
        `📢 NEW RENTAL REQUEST\n\n` +
        `Item: ${selectedItem.name}\n` +
        `Renter: ${user.email}\n` +
        `Date/Time: ${timestamp}\n\n` +
        `Check status in Transactions.`;

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: requestMessage,
        senderId: user.uid,
        senderEmail: user.email,
        createdAt: serverTimestamp(),
        isSystem: true,
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: `Requested: ${selectedItem.name}`,
        lastSenderEmail: user.email,
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Rental request sent to owner!');
      setSelectedItem(null);

      router.replace({
        pathname: '/(tabs)/transactions',
        params: { initialTab: 'borrowing', ts: Date.now().toString() },
      });
    } catch (error) {
      console.error('Action Error: ', error);
      Alert.alert('Error', 'Failed to process request.');
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
          <TouchableOpacity
            onPress={() => setSelectedItem(null)}
            style={{ padding: scale(5) }}
          >
            <Ionicons name="arrow-back" size={scale(24)} color="#222D31" />
          </TouchableOpacity>
          <Text style={[styles.modalHeaderTitle, { flex: 1, marginLeft: scale(15) }]}>
            Item Details
          </Text>
          <View style={{ width: scale(24) }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <Image
            source={{ uri: selectedItem?.imageUrl || selectedItem?.image }}
            style={styles.modalImage}
          />

          <View style={styles.modalInfoSection}>

            {/* CATEGORY + STATUS */}
            <View style={styles.modalRow}>
              <Text style={styles.modalCategory}>{selectedItem?.category}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      selectedItem?.status === 'Available' ||
                      selectedItem?.status === 'pending'
                        ? '#E8F5E9'
                        : '#FFEBEE',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusTextPlain,
                    {
                      color:
                        selectedItem?.status === 'Available' ||
                        selectedItem?.status === 'pending'
                          ? '#27AE60'
                          : '#AF0B01',
                    },
                  ]}
                >
                  {selectedItem?.status}
                </Text>
              </View>
            </View>

            {/* TITLE */}
            <Text style={styles.modalTitle}>
              {selectedItem?.name || selectedItem?.title}
            </Text>

            {/* PRICE */}
            <View
              style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: scale(15) }}
            >
              <Text style={[styles.modalPrice, { marginBottom: 0 }]}>
                {selectedItem?.price}
              </Text>
              {selectedItem?.rentalPeriod && (
                <Text style={[styles.modalPrice, { marginBottom: 0 }]}>
                  {' '}/ {selectedItem.rentalPeriod}
                </Text>
              )}
            </View>

            <View style={[styles.divider, { marginBottom: scale(20) }]} />

            <View style={{ gap: scale(18) }}>

              {/* OWNER — with profile avatar */}
              <View>
                <Text style={styles.detailLabel}>Owner</Text>
                <View style={[styles.contactRow, { alignItems: 'center' }]}>
                  {/* OWNER AVATAR */}
                  <View
                    style={{
                      width: scale(32),
                      height: scale(32),
                      borderRadius: scale(16),
                      backgroundColor: '#222D31',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: scale(10),
                      overflow: 'hidden',
                    }}
                  >
                    {ownerPhoto ? (
                      <Image
                        source={{ uri: ownerPhoto }}
                        style={{ width: scale(32), height: scale(32), borderRadius: scale(16) }}
                      />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: scale(12) }}>
                        {selectedItem?.ownerEmail?.charAt(0).toUpperCase() ?? '?'}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.detailValueContact}>
                    {selectedItem?.ownerEmail || 'Not provided'}
                  </Text>
                </View>
              </View>

              {/* DESCRIPTION */}
              <View>
                <Text style={styles.detailLabel}>Description</Text>
                <View style={[styles.contactRow, { alignItems: 'flex-start' }]}>
                  <Ionicons
                    name="document-text-outline"
                    size={scale(16)}
                    color="#AF0B01"
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={[styles.detailValueContact, { fontWeight: '600', color: '#222D31' }]}
                  >
                    {selectedItem?.description || 'No description provided.'}
                  </Text>
                </View>
              </View>

              {/* LOCATION */}
              <View>
                <Text style={styles.detailLabel}>Location</Text>
                <View style={[styles.contactRow, { alignItems: 'flex-start' }]}>
                  <Ionicons
                    name="location-outline"
                    size={scale(16)}
                    color="#AF0B01"
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.detailValueContact}>{selectedItem?.location}</Text>
                </View>
              </View>

              {/* POSTED ON */}
              <View>
                <Text style={styles.detailLabel}>Posted On</Text>
                <View style={[styles.contactRow, { alignItems: 'flex-start' }]}>
                  <Ionicons
                    name="time-outline"
                    size={scale(16)}
                    color="#AF0B01"
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.detailValueContact}>
                    {formatPostedDate(selectedItem?.createdAt || selectedItem?.timestamp)}
                  </Text>
                </View>
              </View>

            </View>
          </View>
        </ScrollView>

        {/* FOOTER */}
        <View
          style={[
            styles.modalFooter,
            { paddingBottom: Platform.OS === 'ios' ? scale(30) : scale(15) },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.messageBtn,
              { borderRadius: scale(50), height: scale(46), marginHorizontal: scale(5) },
            ]}
            onPress={handleAction}
          >
            <Ionicons
              name={isOwner ? 'create-outline' : 'chatbubble-ellipses-outline'}
              size={scale(20)}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.messageBtnText}>
              {isOwner
                ? 'Edit Item'
                : selectedItem?.status === 'rented'
                ? 'Not Available'
                : 'Rent Now'}
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </Modal>
  );
};