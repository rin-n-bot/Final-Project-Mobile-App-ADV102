import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, scale } from '../styles';

interface CategoryCardProps {
  cat: { name: string; icon: string };
  isActive: boolean;
  onPress: () => void;
}

export const CategoryCard = ({ cat, isActive, onPress }: CategoryCardProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.categoryCard, 
      isActive && styles.activeCategoryCard,
      {
        flexDirection: 'row',
        width: 'auto',
        paddingHorizontal: scale(16),
        paddingVertical: scale(8),
        marginRight: scale(10),
        borderRadius: scale(25),
        marginBottom: 0,
        height: scale(40),
      }
    ]}
  >
    <Ionicons 
      name={cat.icon as any} 
      size={scale(18)} 
      color={isActive ? "#FFFFFF" : "#222D31"} 
    />
    <Text style={[
      styles.categoryCardText, 
      isActive && styles.activeCategoryCardText,
      { marginTop: 0, marginLeft: scale(8) }
    ]}>
      {cat.name}
    </Text>
  </TouchableOpacity>
);