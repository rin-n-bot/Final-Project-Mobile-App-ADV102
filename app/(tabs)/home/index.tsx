
// IMPORTS
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  InteractionManager,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { GREETING_QUOTES } from '../../../constants/quotes';
import { useDrawer } from '../../../context/DrawerContext';
import { auth, db } from '../../../firebase';
import { ModalItemDetails } from '../../modal/ModalItemDetails';
import { CategoryCard } from '../home/components/CategoryCard';
import { ListingCard } from '../home/components/ListingCard';
import { scale, styles } from './styles';



// MAIN COMPONENT
export default function HomeScreen() {


  // CONTEXT & NAVIGATION
  const { toggleDrawer, isDrawerOpen } = useDrawer();
  const router = useRouter();
  const user = auth.currentUser;



  // STATE VARIABLES
  const [activeCategory, setActiveCategory] = useState('All');
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullMeaning, setShowFullMeaning] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');



  // ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const arrowRotate = useRef(new Animated.Value(0)).current;



  // USER PROFILE FETCH
  useEffect(() => {
    if (!user) return;
    setUserEmail(user.email || '');

    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
      if (snap.exists()) {
        setAvatarUrl(snap.data().profilePicUrl || '');
      }
    });
    return unsub;
  }, [user]);



  // HELPER FUNCTIONS
  const formatCategoryName = (id: string) => {
    if (id === 'All') return 'All';
    return id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };



  // FETCH CATEGORIES
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const fetchedCats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        displayName: formatCategoryName(doc.id),
      }));
      setDbCategories([{ id: 'All', displayName: 'All', icon: 'grid-outline' }, ...fetchedCats]);
    });
    return () => unsub();
  }, []);



  // FETCH LISTINGS
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              name: data.name || 'Untitled Item',
              title: data.name || 'Untitled Item',
              category: data.category || '',
              categoryId: data.categoryId || '',
              image: data.imageUrl,
              timestamp: data.createdAt?.toDate().toLocaleDateString() || 'Just now',
            };
          });
          setListings(items);
          setIsLoading(false);
        },
        (error) => {
          console.error('Firestore Error:', error);
          setIsLoading(false);
        }
      );
      return unsubscribe;
    });
    return () => task.cancel();
  }, []);



  // GREETING QUOTES ROTATION
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setQuoteIndex((prev) => (prev + 1) % GREETING_QUOTES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 10000);
    return () => clearInterval(quoteInterval);
  }, []);



  // EVENT HANDLERS
  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    setIsLoading(true);
    setActiveCategory(categoryId);
    setTimeout(() => setIsLoading(false), 800);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const toggleHCDC = () => {
    const toValue = showFullMeaning ? 0 : 1;
    Animated.spring(arrowRotate, { toValue, useNativeDriver: true, friction: 8 }).start();
    setShowFullMeaning(!showFullMeaning);
  };



  // FILTER LOGIC
  const filteredListings = listings.filter((item) => {
    const itemCatId = (item.categoryId || '').toLowerCase().trim();
    const itemCatString = (item.category || '').toLowerCase().trim();
    const activeCat = activeCategory.toLowerCase().trim();

    const matchesCategory =
      activeCategory === 'All' ||
      itemCatId === activeCat ||
      itemCatId === activeCat + 's' ||
      itemCatId + 's' === activeCat ||
      itemCatString === activeCat;

    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchLower) ||
      (item.category || '').toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });



  // ANIMATION INTERPOLATION
  const arrowRotation = arrowRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });



  // RENDER
  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <SafeAreaView style={[styles.container, { backgroundColor: '#F5F5F5' }]}>


        {/* STATUS BAR */}
        <StatusBar
          barStyle={isDrawerOpen || selectedItem ? 'light-content' : 'dark-content'}
        />


        {/* MODAL */}
        <ModalItemDetails selectedItem={selectedItem} setSelectedItem={setSelectedItem} />


        {/* TOP NAVIGATION */}
        <View style={[styles.topNav, { backgroundColor: '#F5F5F5' }]}>
          <TouchableOpacity onPress={() => toggleDrawer(true)}>
            <Ionicons name="menu-outline" size={scale(28)} color="#222D31" />
          </TouchableOpacity>

          <Text style={styles.logoMini}>
            Cross<Text style={{ color: '#AF0B01' }}>Rent</Text>
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            style={[styles.profileCircle, { overflow: 'hidden' }]}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: '100%', height: '100%', borderRadius: scale(16) }}
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: scale(16),
                  backgroundColor: '#222D31',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: scale(12) }}>
                  {userEmail?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>


        {/* MAIN CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#AF0B01"
              colors={['#AF0B01']}
            />
          }
        >


          {/* GREETING */}
          <View style={styles.greetingContainer}>
            <TouchableOpacity
              onPress={toggleHCDC}
              activeOpacity={0.7}
              style={styles.hcdcToggle}
            >
              <Text style={[styles.hcdcText, showFullMeaning && { color: '#AF0B01' }]}>
                {showFullMeaning ? 'Holy Cross of Davao College' : 'HCDC'}
              </Text>

              <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
                <Ionicons
                  name="chevron-down"
                  size={scale(16)}
                  color={showFullMeaning ? '#AF0B01' : '#0038A8'}
                />
              </Animated.View>
            </TouchableOpacity>

            <Animated.Text style={[styles.greetingText, { opacity: fadeAnim, letterSpacing: -1 }]}>
              {GREETING_QUOTES[quoteIndex]}
            </Animated.Text>
          </View>


          {/* SEARCH */}
          <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: '#d9dfe665' }]}>
              <Ionicons
                name="search-outline"
                size={scale(20)}
                color="#222D31"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="Search items..."
                style={styles.searchInput}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>


          {/* CATEGORIES */}
          <Text style={styles.sectionLabel}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingHorizontal: scale(20),
              paddingBottom: scale(20)
            }}
          >
            {dbCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={{ ...cat, name: cat.displayName }}
                isActive={activeCategory === cat.id}
                onPress={() => handleCategoryPress(cat.id)}
              />
            ))}
          </ScrollView>


          {/* LIST TITLE */}
          <Text style={styles.sectionLabel}>
            {searchQuery.length > 0
              ? `Results for "${searchQuery}"`
              : activeCategory === 'All'
              ? 'All Items'
              : formatCategoryName(activeCategory)}
          </Text>


          {/* LISTINGS */}
          {isLoading ? (
            <View style={{ paddingVertical: 40, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#AF0B01" />
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredListings.length > 0 ? (
                filteredListings.map((item) => (
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


          {/* END OF LIST */}
          {!isLoading && filteredListings.length > 0 && (
            <Text style={styles.endOfListText}>No more listings.</Text>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}