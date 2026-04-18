import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/LoginScreen');
      }
    });

    return unsubscribe;
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#AF0B01" />
    </View>
  );
}