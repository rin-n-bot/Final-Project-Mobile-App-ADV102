import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { Animated } from 'react-native';



// CONSTANT: DRAWER DIMENSIONS
const DRAWER_WIDTH = 300;



// INTERFACE: DRAWER CONTEXT VALUE TYPES
interface DrawerContextType {
  isDrawerOpen: boolean;
  slideAnim: Animated.Value;
  toggleDrawer: (open: boolean) => void;
}



// CONTEXT INITIALIZATION
const DrawerContext = createContext<DrawerContextType | undefined>(undefined);



// COMPONENT: NAVIGATION DRAWER PROVIDER
export function DrawerProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;



  // FUNCTION: ANIMATE DRAWER TOGGLE STATE
  const toggleDrawer = (open: boolean): void => {
    setIsDrawerOpen(open);
    Animated.timing(slideAnim, {
      toValue: open ? 0 : -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };



  // UI RENDER: CONTEXT PROVIDER WRAPPER
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



// HOOK: CUSTOM DRAWER CONTEXT CONSUMER
export function useDrawer(): DrawerContextType {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within DrawerProvider');
  }
  return context;
}