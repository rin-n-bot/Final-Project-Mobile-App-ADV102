import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    Dimensions
} from 'react-native';
import { auth, db } from '../../../firebase';
import { COLORS } from '../../../styles/global';
import { listingStyles as styles } from './styles';

// Direct scale definition to prevent the "is not a function" import error
const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

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

    const renderItem = ({ item }: { item: any }) => {
        const isRented = item.status?.toLowerCase() === 'rented';

        return (
            <View style={styles.card}>
                <Image
                    source={{ uri: item.imageUrl || item.image }}
                    style={styles.itemImage}
                    contentFit="cover"
                    transition={300}
                />

                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                        {item.price} / {(item.rentalPeriod || 'day').toLowerCase()}
                    </Text>

                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <View style={{
                            backgroundColor: isRented ? '#FFF3E0' : '#E8F5E9',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                fontWeight: 'bold',
                                color: isRented ? '#E65100' : '#27AE60',
                                textTransform: 'uppercase'
                            }}>
                                {item.status || 'Active'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push({
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
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle="dark-content" backgroundColor="white" translucent={true} />
            <SafeAreaView style={{ flex: 0, backgroundColor: '#FFFFFF' }} /> 
            
            {/* Replicated Header from Transactions */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: scale(20),
                height: scale(60),
                backgroundColor: '#FFF'
            }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: scale(5) }}>
                    <Ionicons
                        name="arrow-back"
                        size={scale(24)}
                        color="#222D31"
                    />
                </TouchableOpacity>
                
                <Text style={{
                    flex: 1,
                    marginLeft: scale(15),
                    fontSize: scale(20),
                    fontWeight: '800',
                    color: '#222D31',
                    letterSpacing: -1
                }}>
                    My Listings
                </Text>

                <View style={{ width: scale(40) }} />
            </View>

            {/* Content Area */}
            <View style={{ flex: 1, backgroundColor: '#FFF' }}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <ActivityIndicator color={COLORS.accent} size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: scale(250) }}>
                                <Ionicons name="list-outline" size={scale(60)} color="#cfd4da" />
                                <Text style={[styles.emptyText, { marginTop: scale(15), color: '#cfd4da', fontWeight: '700' }]}>
                                    No listings created.
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}