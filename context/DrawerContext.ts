import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { Animated } from 'react-native';

const DRAWER_WIDTH = 300;

interface DrawerContextType {
  isDrawerOpen: boolean;
  slideAnim: Animated.Value;
  toggleDrawer: (open: boolean) => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function DrawerProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const toggleDrawer = (open: boolean): void => {
    setIsDrawerOpen(open);
    Animated.timing(slideAnim, {
      toValue: open ? 0 : -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return React.createElement(
    DrawerContext.Provider,
    {
      value: {
        isDrawerOpen,
        slideAnim,
        toggleDrawer,
      },
    },
    children
  );
}

export function useDrawer(): DrawerContextType {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within DrawerProvider');
  }
  return context;
}