import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../../../firebase'; 
import { listingStyles as styles } from './styles';
import { COLORS } from '../../styles/global';

export default function MyListingScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'items'), 
      where('ownerId', '==', user.uid), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setItems(fetchedItems);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Catch Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = (itemId: string) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure? This will remove the item from Firestore permanently.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'items', itemId));
            } catch (error) {
              Alert.alert("Error", "Failed to delete item.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.imageUrl || item.image }} 
        style={styles.itemImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.itemInfo}>
        {/* GUIDE: Changed item.title to item.name to match your AddListing logic */}
        <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price} / day</Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          Status: {item.status || 'Active'}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push({
            // GUIDE: Updated path to match the components subfolder route
            pathname: "/screens/MyListingScreen/components/EditItem",
            params: { itemId: item.id }
          })}
        >
          <Ionicons name="create-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={[
        styles.header, 
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
      ]}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Listings</Text>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={80} color={COLORS.border} />
              <Text style={styles.emptyText}>No listings created.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}