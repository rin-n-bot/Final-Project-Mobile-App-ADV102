import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  onSnapshot,
  or,
  query,
  where,
  doc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import { auth, db } from '../../../firebase';
import { updateTransactionStatus, deleteTransactionRecord } from '../../../services/transactionService';
import { scale, transStyles as styles } from './styles';

interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  ownerId: string;
  ownerEmail: string;
  renterId: string;
  renterEmail: string;
  status: 'requested' | 'rented' | 'completed' | 'cancelled';
  itemDeleted?: boolean;
  createdAt?: Timestamp;
}

type ViewMode = 'lending' | 'borrowing' | 'completed' | 'returned';

export default function TransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = auth.currentUser;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('lending');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showApproveDisclaimer, setShowApproveDisclaimer] = useState(false);
  const [pendingApprovalData, setPendingApprovalData] = useState<{id: string, itemId: string} | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 1. PARAM LISTENER
  useEffect(() => {
    if (params.initialTab) {
      setViewMode(params.initialTab as ViewMode);
    }
  }, [params.initialTab, params.ts]);

  // 2. FADE ON TAB CHANGE
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [viewMode]);

  // 3. FIRESTORE LISTENER
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'transactions'),
      or(
        where('ownerId', '==', user.uid),
        where('renterId', '==', user.uid)
      )
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      setTransactions(transData);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const filteredData = transactions.filter((t) => {
    switch (viewMode) {
      case 'lending':
        return t.ownerId === user?.uid && (t.status === 'requested' || t.status === 'rented');
      case 'borrowing':
        return t.renterId === user?.uid && (t.status === 'requested' || t.status === 'rented');
      case 'completed':
        return t.status === 'completed';
      case 'returned':
        return t.status === 'cancelled';
      default:
        return false;
    }
  });

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Delete Records',
      `Delete ${selectedIds.length} transaction record(s) permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedIds) {
                await deleteDoc(doc(db, 'transactions', id));
              }
              exitSelectionMode();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some records.');
            }
          },
        },
      ]
    );
  };

  const handleConfirmReturn = (id: string, itemId: string) => {
    Alert.alert(
      'Confirm Return',
      'Are you sure the item has been returned safely? This will complete the transaction.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateTransactionStatus(id, itemId, 'completed')
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isOwner = item.ownerId === user?.uid;
    const isSelected = selectedIds.includes(item.id);

    const isItemDeleted =
      item.itemDeleted === true ||
      !item.itemName ||
      item.itemName === 'Deleted Item';

    const dateLabel = item.createdAt
      ? new Date(item.createdAt.seconds * 1000).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ' · ' +
        new Date(item.createdAt.seconds * 1000).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Pending';

    const getStatusColor = () => {
      if (isItemDeleted) return { bg: '#F3F4F6', text: '#6B7280' };
      if (item.status === 'requested') return { bg: '#FFF3E0', text: '#E65100' };
      if (item.status === 'rented') return { bg: '#E8F5E9', text: '#27AE60' };
      if (item.status === 'completed') return { bg: '#E3F2FD', text: '#1976D2' };
      return { bg: '#FFEBEE', text: '#AF0B01' };
    };

    const statusStyle = getStatusColor();

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => {
          setIsSelectionMode(true);
          toggleSelection(item.id);
        }}
        onPress={() => (isSelectionMode ? toggleSelection(item.id) : null)}
        style={[
          styles.card,
          isSelected && { backgroundColor: '#FFF9F9' },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
            {isItemDeleted ? 'Item no longer available' : item.itemName}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusTextPlain, { color: statusStyle.text }]}>
              {isItemDeleted ? 'Unavailable' : item.status}
            </Text>
          </View>
          {isSelectionMode && (
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color="#AF0B01"
              style={{ marginLeft: scale(10) }}
            />
          )}
        </View>

        <Text style={styles.cardTimestamp}>
          {isOwner ? `Renter: ${item.renterEmail}` : `Owner: ${item.ownerEmail}`}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={14} color="#AF0B01" />
          <Text style={[styles.cardTimestamp, { marginLeft: 5, marginBottom: 0 }]}>
            {dateLabel}
          </Text>
        </View>

        {!isSelectionMode && (
          <View style={{ flexDirection: 'row', marginTop: scale(15), gap: scale(10) }}>
            {isItemDeleted ? (
              // Item deleted — both owner and renter see this regardless of role
              <TouchableOpacity
                style={[
                  styles.messageBtn,
                  { backgroundColor: '#AF0B01', flex: 1, height: scale(40) },
                ]}
                onPress={() =>
                  deleteTransactionRecord(item.id, item.itemId, item.itemName)
                }
              >
                <Text style={styles.messageBtnText}>Delete Request</Text>
              </TouchableOpacity>
            ) : (
              <>
                {isOwner && item.status === 'requested' && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.messageBtn,
                        { backgroundColor: '#222D31', flex: 1, height: scale(40) },
                      ]}
                      onPress={() => {
                        setPendingApprovalData({ id: item.id, itemId: item.itemId });
                        setShowApproveDisclaimer(true);
                      }}
                    >
                      <Text style={styles.messageBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.messageBtn,
                        { backgroundColor: '#AF0B01', flex: 1, height: scale(40) },
                      ]}
                      onPress={() => updateTransactionStatus(item.id, item.itemId, 'cancelled')}
                    >
                      <Text style={styles.messageBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </>
                )}

                {isOwner && item.status === 'rented' && (
                  <TouchableOpacity
                    style={[
                      styles.messageBtn,
                      { backgroundColor: '#222D31', flex: 1, height: scale(40) },
                    ]}
                    onPress={() => handleConfirmReturn(item.id, item.itemId)}
                  >
                    <Text style={styles.messageBtnText}>Confirm Return</Text>
                  </TouchableOpacity>
                )}

                {!isOwner && item.status === 'requested' && (
                  <TouchableOpacity
                    style={[
                      styles.messageBtn,
                      { backgroundColor: '#AF0B01', flex: 1, height: scale(40) },
                    ]}
                    onPress={() => updateTransactionStatus(item.id, item.itemId, 'cancelled')}
                  >
                    <Text style={styles.messageBtnText}>Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: '#F5F5F5' }, isSelectionMode && { backgroundColor: '#AF0B01' }]}
    >
      <StatusBar barStyle={isSelectionMode ? 'light-content' : 'dark-content'} />

      {/* TOP NAV */}
      <View style={[styles.topNav, { backgroundColor: '#F5F5F5' }, isSelectionMode && { backgroundColor: '#AF0B01' }]}>
        {isSelectionMode ? (
          <TouchableOpacity onPress={exitSelectionMode} style={{ marginRight: scale(12) }}>
            <Ionicons name="close-outline" size={scale(26)} color="#FFF" />
          </TouchableOpacity>
        ) : null}

        <Text
          style={[
            styles.logoMini,
            { flex: 1 },
            isSelectionMode && { color: '#FFF' },
          ]}
        >
          {isSelectionMode ? `${selectedIds.length} Selected` : 'Transactions'}
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

      {/* TABS */}
      {!isSelectionMode && (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: scale(10),
            backgroundColor: '#F5F5F5',
          }}
        >
          {(['lending', 'borrowing', 'completed', 'returned'] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={{
                flex: 1,
                paddingVertical: scale(12),
                borderBottomWidth: 2,
                borderBottomColor: viewMode === mode ? '#AF0B01' : 'transparent',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: scale(13),
                  fontWeight: '700',
                  color: viewMode === mode ? '#AF0B01' : '#9CA3AF',
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* LIST */}
      <Animated.View style={{ flex: 1, backgroundColor: '#F5F5F5', opacity: fadeAnim }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator color="#AF0B01" size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: scale(20), paddingBottom: scale(100) }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: scale(200) }}>
                <Ionicons name="receipt-outline" size={scale(60)} color="#cfd4da" />
                <Text style={[styles.noResultsText, { marginTop: scale(10) }]}>
                  No records found in {viewMode}.
                </Text>
              </View>
            }
          />
        )}
      </Animated.View>

      {/* APPROVE DISCLAIMER MODAL */}
      <Modal
        visible={showApproveDisclaimer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApproveDisclaimer(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: scale(20) }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: scale(12), padding: scale(20), width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: scale(18), fontWeight: '800', color: '#222D31', marginBottom: scale(12) }}>Disclaimer</Text>
            <Text style={{ fontSize: scale(14), lineHeight: scale(20), color: '#4B5563', textAlign: 'center', marginBottom: scale(20) }}>
              Please note that our platform does not handle payments directly. All transactions are made between users outside the app.{"\n\n"}
              We are not responsible for any payment issues or losses, but we will review and take action on reported scams or misconduct.{"\n"}
            </Text>

            <View style={{ flexDirection: 'row', width: '100%', gap: scale(10) }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: scale(12), borderRadius: scale(8), borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}
                onPress={() => {
                  setShowApproveDisclaimer(false);
                  setPendingApprovalData(null);
                }}
              >
                <Text style={{ color: '#4B5563', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#AF0B01', paddingVertical: scale(12), borderRadius: scale(8), alignItems: 'center' }}
                onPress={() => {
                  if (pendingApprovalData) {
                    updateTransactionStatus(pendingApprovalData.id, pendingApprovalData.itemId, 'rented');
                  }
                  setShowApproveDisclaimer(false);
                  setPendingApprovalData(null);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>I Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}