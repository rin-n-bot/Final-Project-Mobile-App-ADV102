import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebase';
import s from './styles';

export default function AddScreen() {
  const router = useRouter();

  // FORM STATE
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState('Day'); // Default duration
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(''); 
  const [status, setStatus] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const categories = ['Laptop', 'Books', 'Tech', 'Calculators', 'Lab Gear'];
  const statusOptions = ['Available', 'Reserved', 'Rented'];
  const durationOptions = ['Hour', 'Day', 'Week', 'Month'];

  // IMAGE PICKER LOGIC
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to upload photos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const getSlug = (name: string) => {
    const raw = name.toLowerCase().trim();
    const mapping: { [key: string]: string } = {
      'laptop': 'laptops',
      'book': 'books',
      'calculator': 'calculators',
      'tech': 'tech',
      'lab gear': 'lab-gear'
    };
    return mapping[raw] || raw.replace(/\s+/g, '-');
  };

  const handlePost = async () => {
    if (
      !name.trim() || 
      !price.trim() || 
      !description.trim() || 
      !location.trim() || 
      !category || 
      !status ||
      !imageUrl
    ) {
      return Alert.alert("Incomplete Form", "Please fill out all fields and provide an item image.");
    }

    try {
      await addDoc(collection(db, 'items'), {
        name: name.trim(),
        price: `₱${price.trim()}`,
        rentalPeriod: rentalPeriod, 
        description: description.trim(),
        category: category, 
        categoryId: getSlug(category),
        location: location.trim(),
        status: status,
        ownerEmail: auth.currentUser?.email,
        ownerId: auth.currentUser?.uid,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Item posted successfully!");
      router.push('/(tabs)/home');
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save listing.");
    }
  };

  return (
    <View style={s.mainWrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#AF0B01" />
      
      <View style={s.redHeader}>
        <SafeAreaView>
          <View style={s.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={s.iconButton}>
              <Ionicons name="close-outline" size={30} color="#FFF" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>List an Item</Text>
            <TouchableOpacity onPress={handlePost} style={s.iconButton}>
              <Text style={s.postBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.formContainer} showsVerticalScrollIndicator={false}>
          
          <Text style={s.label}>Item Name</Text>
          <TextInput 
            style={s.input} 
            placeholder="e.g. Scientific Calculator" 
            placeholderTextColor="#999" 
            value={name} 
            onChangeText={setName} 
          />

          <Text style={s.label}>Category</Text>
          <View style={s.chipGrid}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => setCategory(cat)}
                style={[s.chip, { width: '31%' }, category === cat ? s.chipActive : s.chipInactive]}
              >
                <Text style={[s.chipText, category === cat && s.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Price (₱)</Text>
          <TextInput 
            style={s.input} 
            placeholder="0.00" 
            placeholderTextColor="#999"
            keyboardType="numeric" 
            value={price} 
            onChangeText={setPrice} 
          />

          <Text style={s.label}>Rental Duration</Text>
          <View style={s.chipGrid}>
            {durationOptions.map((dur) => (
              <TouchableOpacity 
                key={dur} 
                onPress={() => setRentalPeriod(dur)}
                style={[s.chip, { width: '22%' }, rentalPeriod === dur ? s.chipActive : s.chipInactive]}
              >
                <Text style={[s.chipText, rentalPeriod === dur && s.chipTextActive]}>{dur}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Location</Text>
          <TextInput 
            style={s.input} 
            placeholder="e.g. J605 or any specific location" 
            placeholderTextColor="#999"
            value={location} 
            onChangeText={setLocation} 
          />

          <Text style={s.label}>Status</Text>
          <View style={s.chipGrid}>
            {statusOptions.map((opt) => (
              <TouchableOpacity 
                key={opt} 
                onPress={() => setStatus(opt)}
                style={[s.chip, { width: '31%' }, status === opt ? s.chipActiveBlack : s.chipInactive]}
              >
                <Text style={[s.chipText, status === opt && s.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Description</Text>
          <TextInput 
            style={[s.input, s.textArea]} 
            placeholder="Describe condition..." 
            placeholderTextColor="#999"
            multiline 
            numberOfLines={4}
            value={description} 
            onChangeText={setDescription} 
          />

          <Text style={s.label}>Item Image</Text>
          <TouchableOpacity style={s.imageButton} onPress={pickImage} activeOpacity={0.8}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={s.imagePreview} />
            ) : (
              <View style={s.imagePlaceholder}>
                <Ionicons name="camera-outline" size={24} color="#AF0B01" />
                <Text style={s.imageButtonText}>Select Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={s.centeredFooter}>
            <View style={s.infoBox}>
              <Ionicons name="mail-outline" size={14} color="#999" />
              <Text style={s.infoText}>Posting as: {auth.currentUser?.email}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}