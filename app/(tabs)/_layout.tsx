import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Platform, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // 👇 ANIMATION FOR CONTENT SWITCHING
        animation: 'fade', 
      }}
      tabBar={(props) => <GlassCapsuleNav {...props} />}
    >
      <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
      <Tabs.Screen name="chat/index" options={{ title: 'Chats' }} />
      <Tabs.Screen name="add" options={{ title: 'Add' }} />
      <Tabs.Screen name="transactions/index" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

// Sub-component to handle independent animation state for icons
function TabItem({ route, isFocused, onPress }: any) {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.2 : 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const getRouteData = (name: string) => {
    if (name.includes('home')) return { icon: 'home', label: 'Home' };
    if (name.includes('chat')) return { icon: 'chatbubbles', label: 'Chats' };
    if (name.includes('transactions')) return { icon: 'swap-horizontal', label: 'Transactions' };
    return { icon: 'help-outline', label: name };
  };

  const { icon, label } = getRouteData(route.name);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.navItem}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={(isFocused ? icon : `${icon}-outline`) as any}
          size={scale(22)}
          color={isFocused ? '#AF0B01' : '#FFFFFF'}
        />
      </Animated.View>
      <Text
        numberOfLines={1}
        style={[
          styles.navLabel,
          { color: isFocused ? '#AF0B01' : '#FFFFFF' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function GlassCapsuleNav({ state, navigation }: any) {
  const visibleRoutes = state.routes.filter(
    (route: any) => route.name !== 'add' && route.name !== 'profile/index'
  );

  return (
    <View style={styles.container}>
      <View style={styles.glassCapsule}>
        {visibleRoutes.map((route: any) => {
          const actualIndex = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === actualIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem 
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>

      <View style={styles.addWrapper}>
        <TouchableOpacity
          onPress={() => router.push('../add')}
          activeOpacity={0.85}
          style={styles.inlineAddBtn}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? scale(30) : scale(20),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
  },
  glassCapsule: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 45, 49, 0.95)',
    height: scale(65),
    borderRadius: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 4,
    paddingRight: scale(12),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: scale(10),
    fontWeight: '800',
    marginTop: scale(4),
    textAlign: 'center',
    width: '100%',
  },
  addWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineAddBtn: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#AF0B01',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12),
    elevation: 4,
    shadowColor: '#AF0B01',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});