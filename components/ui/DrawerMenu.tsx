import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // GUIDE: Import useRouter for navigation
import React from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../app/(tabs)/home/styles'; // GUIDE: Import styles from the correct path

interface DrawerMenuProps {
  slideAnim: Animated.Value;
  toggleDrawer: (open: boolean) => void;
  handleLogout: () => void;
}

export const DrawerMenu = ({ slideAnim, toggleDrawer, handleLogout }: DrawerMenuProps) => {
  const router = useRouter(); 

  return (
    <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.drawerHeader}>
        <Text style={styles.logoMini}>
          <Text style={{ color: '#FFFFFF' }}>Cross</Text>
          <Text style={{ color: '#ffffff' }}>Rent</Text>
        </Text>
        <TouchableOpacity onPress={() => toggleDrawer(false)}>
          <Ionicons name="close-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.drawerItems}>
        {/* Profile Item */}
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name="person-outline" size={22} color="#FFFFFF" />
          <Text style={styles.drawerItemText}>Profile</Text>
        </TouchableOpacity>

        {/* My Listing Item */}
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            toggleDrawer(false); 
            // GUIDE: If the string is red, use the object syntax below. 
            // It is less strict with TypeScript's auto-generated route types.
            router.push({
              pathname: "/screens/MyListingScreen" as any 
            }); 
          }}
        >
          <Ionicons name="list-outline" size={22} color="#FFFFFF" />
          <Text style={styles.drawerItemText}>My Listing</Text>
        </TouchableOpacity>

        {/* Settings Item */}
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          <Text style={styles.drawerItemText}>Settings</Text>
        </TouchableOpacity>

        {/* Logout Item */}
        <TouchableOpacity 
          style={[styles.drawerItem, { marginTop: 20 }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#ffffff" />
          <Text style={[styles.drawerItemText, { color: '#ffffff' }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};