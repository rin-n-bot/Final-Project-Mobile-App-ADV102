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
    style={[styles.categoryCard, isActive && styles.activeCategoryCard]}
  >
    <Ionicons name={cat.icon as any} size={scale(24)} color={isActive ? "#FFFFFF" : "#222D31"} />
    <Text style={[styles.categoryCardText, isActive && styles.activeCategoryCardText]}>
      {cat.name}
    </Text>
  </TouchableOpacity>
);