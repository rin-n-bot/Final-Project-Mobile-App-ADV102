import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../styles';

interface ListingCardProps {
  item: any;
  onPress: () => void;
}

export const ListingCard = ({ item, onPress }: ListingCardProps) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
    </View>
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <Text style={styles.cardTimestamp}>{item.timestamp}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.cardPricePlain}>{item.price}</Text>
    </View>
  </TouchableOpacity>
);