import { Stack } from 'expo-router';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DrawerProvider } from '../context/DrawerContext';
import { DrawerMenu } from '../components/ui/DrawerMenu';

function RootLayoutContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#AF0B01" />
      </View>
    );
  }

  return (
    <DrawerProvider>
      <View style={{ flex: 1 }}>
        {user && <DrawerMenu />}
        <Stack screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="add"
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen name="profile" />
              <Stack.Screen name="my-listing" />
              <Stack.Screen name="message" />
              <Stack.Screen name="modal" />
            </>
          ) : (
            <Stack.Screen name="(auth)" />
          )}
        </Stack>
      </View>
    </DrawerProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}