import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router'; 
import { styles, scale } from '../styles';

// COMPONENT: Individual Nav Item Logic
const NavItem = ({ icon, label, path }: { icon: any, label: string, path: string }) => {
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = () => {
    if (pathname !== path) {
      router.replace(path as any);
    }
  };
  
  const active = pathname === path;

  return (
    // Wrap the touchable in a View with flex: 1 to force equal gaps
    <View style={styles.navItemContainer}> 
      <TouchableOpacity 
        onPress={navigateTo}
        activeOpacity={0.7}
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons 
          name={icon} 
          size={scale(24)} 
          color={active ? "#AF0B01" : "#cfd4da"} 
        />
        <Text style={[styles.navLabel, active && { color: '#AF0B01' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// COMPONENT: Main Bottom Navigation
export const BottomNav = () => {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <NavItem icon="home-sharp" label="Home" path="/screens/HomeScreen" />
      
      <NavItem icon="chatbubbles-outline" label="Chats" path="/screens/ChatScreen" />

      {/* Middle Slot */}
      <View style={styles.addBtnContainer}>
        <TouchableOpacity 
          onPress={() => router.push('/screens/AddListingScreen')}
          activeOpacity={0.8}
          style={{ alignItems: 'center' }}
        >
          <View style={styles.addBtnCircle}>
            <Ionicons name="add" size={scale(32)} color="#FFFFFF" />
          </View>
          <Text style={styles.addLabel}>Add</Text>
        </TouchableOpacity>
      </View>

      <NavItem icon="time-outline" label="History" path="/screens/History" />
      
      <NavItem icon="person-outline" label="Profile" path="/screens/Profile" />
    </View>
  );
};