import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../styles';



// INTERFACE FOR LISTING CARD PROPS
interface ListingCardProps {
  item: any;
  onPress: () => void;
}



// COMPONENT FOR RENDERING PRODUCT OR SERVICE LISTINGS
export const ListingCard = ({ item, onPress }: ListingCardProps) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.imageUrl || item.image }} style={styles.cardImage} resizeMode="cover" />
    </View>
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Available' ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={[styles.statusTextPlain, { color: item.status === 'Available' ? '#27AE60' : '#AF0B01' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name || item.title}</Text>
      

      {/* SECTION FOR PRICE AND RENTAL DURATION DISPLAY */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={styles.cardPricePlain}>{item.price}</Text>
        {item.rentalPeriod && (
          <Text style={[styles.cardPricePlain, { fontSize: 12, color: '#1976D2' }]}> / {item.rentalPeriod.toLowerCase()}</Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);