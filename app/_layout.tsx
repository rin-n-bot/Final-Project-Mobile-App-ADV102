import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { DrawerProvider } from '../context/DrawerContext';
import { DrawerMenu } from '../components/ui/DrawerMenu';

export default function RootLayout() {
  return (
    <DrawerProvider>
      <View style={{ flex: 1 }}>
        <DrawerMenu />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add"
            options={{
              presentation: 'modal',
            }}
          />
        </Stack>
      </View>
    </DrawerProvider>
  );
}