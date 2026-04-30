import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface AuthToggleProps {
  isLogin: boolean;
  setIsLogin: (val: boolean) => void;
}


// Component for toggling between Login and Register states
export const AuthToggle = ({ isLogin, setIsLogin }: AuthToggleProps) => {
  

  //  Helper to determine active styles for buttons and text
  const getToggleStyles = (activeCondition: boolean) => ({
    button: [styles.selectionBtn, activeCondition && styles.activeBtn],
    text: [styles.selectionText, activeCondition && styles.activeText],
  });

  return (
    <View style={styles.selectionWrapper}>

      {/* LOGIN TAB */}
      <TouchableOpacity 
        style={getToggleStyles(isLogin).button} 
        onPress={() => setIsLogin(true)}
      >
        <Text style={getToggleStyles(isLogin).text}>Login</Text>
      </TouchableOpacity>
      
      {/* REGISTER TAB */}
      <TouchableOpacity 
        style={getToggleStyles(!isLogin).button} 
        onPress={() => setIsLogin(false)}
      >
        <Text style={getToggleStyles(!isLogin).text}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};