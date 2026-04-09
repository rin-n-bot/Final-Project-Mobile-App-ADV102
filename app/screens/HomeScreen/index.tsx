import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  InteractionManager,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image'; // Matching ChatScreen import

import { db, auth } from '../../../firebase';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';

import { BottomNav } from './components/BottomNav';
import { CategoryCard } from './components/CategoryCard';
import { DrawerMenu } from './components/DrawerMenu';
import { ListingCard } from './components/ListingCard';
import { ModalItemDetails } from './components/ModalItemDetails';

import { GREETING_QUOTES } from './constants/quotes';
import { DRAWER_WIDTH, scale, styles } from './styles';

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const [listings, setListings] = useState<any[]>([]); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullMeaning, setShowFullMeaning] = useState(false);

  // Profile data state
const [userProfile, setUserProfile] = useState<{photoURL: string | null, email: string | null} | null>(null);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const arrowRotate = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const user = auth.currentUser;

  // Fetch Profile Data (Same logic as ChatScreen recipient fetching)
  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      try {
        const uSnap = await getDoc(doc(db, 'users', user.uid));
        if (uSnap.exists()) {
          setUserProfile({
            photoURL: uSnap.data().photoURL || null,
            email: uSnap.data().email || user.email
          });
        } else {
          setUserProfile({ photoURL: user.photoURL || null, email: user.email });
        }
      } catch (e) {
        console.error("Error fetching user profile:", e);
      }
    };
    fetchUser();
  }, [user]);

  const formatCategoryName = (id: string) => {
    if (id === 'All') return 'All';
    return id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const fetchedCats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        displayName: formatCategoryName(doc.id) 
      }));
      setDbCategories([{ id: 'All', displayName: 'All', icon: 'grid-outline' }, ...fetchedCats]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            name: data.name || "Untitled Item",
            title: data.name || "Untitled Item", 
            category: data.category || "",
            categoryId: data.categoryId || "",
            image: data.imageUrl,
            timestamp: data.createdAt?.toDate().toLocaleDateString() || 'Just now'
          };
        });
        setListings(items);
        setIsLoading(false);
      }, (error) => {
        console.error("Firestore Error:", error);
        setIsLoading(false);
      });
      return unsubscribe;
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setQuoteIndex((prev) => (prev + 1) % GREETING_QUOTES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 10000);
    return () => clearInterval(quoteInterval);
  }, []);

  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    setIsLoading(true);
    setActiveCategory(categoryId);
    setTimeout(() => setIsLoading(false), 800);
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/screens/LoginScreen');
          } catch (error: any) {
            alert(error.message);
          }
        }
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
    Animated.timing(slideAnim, { toValue: open ? 0 : -DRAWER_WIDTH, duration: 300, useNativeDriver: true }).start();
  };

  const toggleHCDC = () => {
    const toValue = showFullMeaning ? 0 : 1;
    Animated.spring(arrowRotate, { toValue, useNativeDriver: true, friction: 8 }).start();
    setShowFullMeaning(!showFullMeaning);
  };

  const filteredListings = listings.filter(item => {
    const itemCatId = (item.categoryId || "").toLowerCase().trim();
    const itemCatString = (item.category || "").toLowerCase().trim();
    const activeCat = activeCategory.toLowerCase().trim();

    const matchesCategory = 
      activeCategory === 'All' || 
      itemCatId === activeCat || 
      itemCatId === activeCat + 's' || 
      itemCatId + 's' === activeCat ||
      itemCatString === activeCat;

    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      (item.name || "").toLowerCase().includes(searchLower) || 
      (item.category || "").toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  const arrowRotation = arrowRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDrawerOpen || selectedItem ? "light-content" : "dark-content"} />
        <ModalItemDetails selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
        <DrawerMenu slideAnim={slideAnim} toggleDrawer={toggleDrawer} handleLogout={handleLogout} />

        {isDrawerOpen && (
          <TouchableWithoutFeedback onPress={() => toggleDrawer(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
        )}

        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => toggleDrawer(true)}>
            <Ionicons name="menu-outline" size={scale(28)} color="#222D31" />
          </TouchableOpacity>
          <Text style={styles.logoMini}>Cross<Text style={{ color: '#AF0B01' }}>Rent</Text></Text>
          
          {/* PROFILE ICON - Visual Only, Matches ChatScreen Style */}
          <View style={[styles.profileCircle, { overflow: 'hidden' }]}>
            {userProfile?.photoURL ? (
              <Image 
                source={{ uri: userProfile.photoURL }} 
                style={{ width: '100%', height: '100%', borderRadius: scale(16) }} 
              />
            ) : (
              <View style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: scale(16), 
                backgroundColor: '#222D31', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: scale(12) }}>
                  {userProfile?.email?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#AF0B01" colors={['#AF0B01']} />
          }
        >
          <View style={styles.greetingContainer}>
            <TouchableOpacity onPress={toggleHCDC} activeOpacity={0.7} style={styles.hcdcToggle}>
              <Text style={[styles.hcdcText, showFullMeaning && { color: '#AF0B01' }]}>
                {showFullMeaning ? 'Holy Cross of Davao College' : 'HCDC'}
              </Text>
              <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
                <Ionicons name="chevron-down" size={scale(16)} color={showFullMeaning ? "#AF0B01" : "#0038A8"} />
              </Animated.View>
            </TouchableOpacity>
            <Animated.Text style={[styles.greetingText, { opacity: fadeAnim }]}>
              {GREETING_QUOTES[quoteIndex]}
            </Animated.Text>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={scale(20)} color="#cfd4da" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Search items..."
                style={styles.searchInput}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Categories</Text>
          <View style={styles.categoryGrid}>
            {dbCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={{ ...cat, name: cat.displayName }} 
                isActive={activeCategory === cat.id}
                onPress={() => handleCategoryPress(cat.id)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>
            {searchQuery.length > 0 ? `Results for "${searchQuery}"` : 
            (activeCategory === 'All' ? 'All Items' : formatCategoryName(activeCategory))}
          </Text>

          {isLoading ? (
            <View style={{ paddingVertical: 40, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#AF0B01" />
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredListings.length > 0 ? (
                filteredListings.map(item => (
                  <ListingCard 
                    key={item.id} 
                    item={item} 
                    onPress={() => setSelectedItem(item)} 
                  />
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No listings found.</Text>
                </View>
              )}
            </View>
          )}

          {!isLoading && filteredListings.length > 0 && (
            <Text style={styles.endOfListText}>No more listings.</Text>
          )}
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    </View>
  );
}