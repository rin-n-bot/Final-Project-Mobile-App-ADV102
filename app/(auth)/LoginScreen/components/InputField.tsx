import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const InputField = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  showPasswordToggle, 
  isPasswordVisible, 
  onToggleVisibility 
}: InputFieldProps) => (
  <View style={styles.inputBox}>
    <View style={styles.labelWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    {showPasswordToggle ? (
      <View style={styles.passwordInputContainer}>
        <TextInput 
          style={{ flex: 1, color: '#1D3557', fontSize: 16 }}
          placeholder={placeholder}
          placeholderTextColor="#DDE5E7"
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity onPress={onToggleVisibility}>
          <Ionicons name={isPasswordVisible ? "eye" : "eye-off"} size={20} color="#222D31" />
        </TouchableOpacity>
      </View>
    ) : (
      <TextInput 
        placeholder={placeholder} 
        style={styles.input}
        placeholderTextColor="#DDE5E7"
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
      />
    )}
  </View>
);