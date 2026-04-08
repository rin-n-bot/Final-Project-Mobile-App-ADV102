import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from '../styles';

interface AuthToggleProps {
  isLogin: boolean;
  setIsLogin: (val: boolean) => void;
}

export const AuthToggle = ({ isLogin, setIsLogin }: AuthToggleProps) => (
  <View style={styles.selectionWrapper}>
    <TouchableOpacity 
      style={[styles.selectionBtn, isLogin && styles.activeBtn]} 
      onPress={() => setIsLogin(true)}
    >
      <Text style={[styles.selectionText, isLogin && styles.activeText]}>Login</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.selectionBtn, !isLogin && styles.activeBtn]} 
      onPress={() => setIsLogin(false)}
    >
      <Text style={[styles.selectionText, !isLogin && styles.activeText]}>Register</Text>
    </TouchableOpacity>
  </View>
);