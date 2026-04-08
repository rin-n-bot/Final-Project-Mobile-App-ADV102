import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#FFF' }, // Keeps the "gap" white
        animation: 'slide_from_right',
        animationDuration: 200, // Speeds up the jump
      }} 
    >
      {/* Explicitly define the Login screen */}
      <Stack.Screen name="index" /> 
      
      {/* Explicitly define the screens folder */}
      <Stack.Screen 
        name="screens" 
        options={{ 
          animation: 'slide_from_right',
          // This prevents the "flash" by keeping the previous screen in memory
          freezeOnBlur: true, 
        }} 
      />
    </Stack>
  );
}