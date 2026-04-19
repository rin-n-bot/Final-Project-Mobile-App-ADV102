import React from 'react';
import { Animated, ScrollView, View, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { styles } from '../../app/(tabs)/home/styles';
import { useDrawer } from '../../context/DrawerContext';

export function DrawerMenu() {
  const router = useRouter();
  const { slideAnim, toggleDrawer, isDrawerOpen } = useDrawer();

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            toggleDrawer(false);
            router.replace('/(auth)/LoginScreen');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  return (
    <>
      {isDrawerOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => toggleDrawer(false)}
          style={styles.backdrop}
        />
      )}

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }], zIndex: 999 },
        ]}
      >
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

          {/* Profile — NAVIGATE */}
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => {
              toggleDrawer(false);
              router.push('/profile' as any);
            }}
          >
            <Ionicons name="person-outline" size={22} color="#FFFFFF" />
            <Text style={styles.drawerItemText}>Profile</Text>
          </TouchableOpacity>

          {/* My Listing */}
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => {
              toggleDrawer(false);
              router.push({ pathname: '/my-listing' as any });
            }}
          >
            <Ionicons name="list-outline" size={22} color="#FFFFFF" />
            <Text style={styles.drawerItemText}>My Listing</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={styles.drawerItem}>
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            <Text style={styles.drawerItemText}>Settings</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.drawerItem, { marginTop: 20 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#ffffff" />
            <Text style={[styles.drawerItemText, { color: '#ffffff' }]}>Logout</Text>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </>
  );
}