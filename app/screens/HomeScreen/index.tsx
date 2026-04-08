import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  InteractionManager // Added this
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { db, auth } from '../../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

// Components
import { BottomNav } from './components/BottomNav';
import { CategoryCard } from './components/CategoryCard';
import { DrawerMenu } from './components/DrawerMenu';
import { ListingCard } from './components/ListingCard';
import { ModalItemDetails } from './components/ModalItemDetails';

// Constants
import { CATEGORIES } from './constants/categories';
import { GREETING_QUOTES } from './constants/quotes';

// Styles
import { DRAWER_WIDTH, scale, styles } from './styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HomeScreen() {

  // STATE
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const [listings, setListings] = useState<any[]>([]); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullMeaning, setShowFullMeaning] = useState(false);

  // ANIMATIONS
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const dashAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const arrowRotate = useRef(new Animated.Value(0)).current;

  const router = useRouter();

  // REAL-TIME LISTENER FOR ITEMS (Fixed with InteractionManager)
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          title: doc.data().name, 
          image: doc.data().imageUrl,
          timestamp: doc.data().createdAt?.toDate().toLocaleDateString() || 'Just now'
        }));
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

  // CHAT NOTIFICATIONS (Fixed with InteractionManager)
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const data = change.doc.data();
            if (data.lastSenderId !== user.uid) {
              Alert.alert("CrossRent Message", `New message: ${data.lastMessage}`);
            }
          }
        });
      });
      return unsubscribe;
    });
    return () => task.cancel();
  }, []);

  // QUOTES ROTATION
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setQuoteIndex((prev) => (prev + 1) % GREETING_QUOTES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 10000);
    return () => clearInterval(quoteInterval);
  }, []);

  // LOADING ANIMATION
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.parallel([
          Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(dashAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [isLoading]);

  // ACTIONS
  const handleCategoryPress = (categoryName: string) => {
    if (categoryName === activeCategory) return;
    setIsLoading(true);
    setActiveCategory(categoryName);
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
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const arrowRotation = arrowRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const dashOffset1 = dashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -80] });

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
        <TouchableOpacity style={styles.profileCircle}>
          <Ionicons name="person" size={scale(16)} color="white" />
        </TouchableOpacity>
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
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.name}
              cat={cat}
              isActive={activeCategory === cat.name}
              onPress={() => handleCategoryPress(cat.name)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>
          {searchQuery.length > 0 ? `Results for "${searchQuery}"` : (activeCategory === 'All' ? 'All Items' : activeCategory)}
        </Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Svg width={40} height={40} viewBox="0 0 40 40">
                <Circle cx="20" cy="20" r="16" stroke="#E5E7EB" strokeWidth="4" fill="none" />
                <AnimatedCircle cx="20" cy="20" r="16" stroke="#AF0B01" strokeWidth="4" fill="none" strokeDasharray="60 100" strokeDashoffset={dashOffset1} />
              </Svg>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredListings.length > 0 ? (
              filteredListings.map(item => {
                if (!item.title && !item.name) return null;
                return (
                  <ListingCard 
                    key={item.id} 
                    item={item} 
                    onPress={() => setSelectedItem(item)} 
                  />
                );
              })
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No listings</Text>
              </View>
            )}
          </View>
        )}

        {!isLoading && filteredListings.length > 0 && (
          <Text style={styles.endOfListText}>No more list</Text>
        )}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
    </View>
  );
}