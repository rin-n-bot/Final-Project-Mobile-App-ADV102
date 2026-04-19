// app/profile/index.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../firebase';
import { profileStyles as styles, scale } from './styles';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [bio, setBio] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [listingsCount, setListingsCount] = useState(0);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const originalBio = useRef('');
  const originalPic = useRef('');

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchStats();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const profileSnap = await getDoc(doc(db, 'profiles', user!.uid));
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setBio(data.bio || '');
        setProfilePicUrl(data.profilePicUrl || '');
        originalBio.current = data.bio || '';
        originalPic.current = data.profilePicUrl || '';
      }

      const userSnap = await getDocs(
        query(collection(db, 'users'), where('uid', '==', user!.uid))
      );
      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        if (userData.lastLogin?.seconds) {
          const date = new Date(userData.lastLogin.seconds * 1000);
          setMemberSince(
            date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
          );
        }
      }
    } catch (e) {
      console.error('fetchProfile error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = () => {
    if (!user) return;
    onSnapshot(
      query(collection(db, 'items'), where('ownerId', '==', user.uid)),
      (snap) => setListingsCount(snap.size)
    );
    onSnapshot(
      query(collection(db, 'transactions'), where('renterId', '==', user.uid)),
      (snap) => setTransactionsCount(snap.size)
    );
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfilePicUrl(uri);
      setIsDirty(true);
    }
  };

  const handleBioChange = (text: string) => {
    setBio(text);
    setIsDirty(text !== originalBio.current || profilePicUrl !== originalPic.current);
  };

  const handleSave = async () => {
    if (!user || !isDirty) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'profiles', user.uid),
        { bio, profilePicUrl, userEmail: user.email, updatedAt: serverTimestamp() },
        { merge: true }
      );
      originalBio.current = bio;
      originalPic.current = profilePicUrl;
      setIsDirty(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      console.error('handleSave error:', e);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => user?.email?.charAt(0).toUpperCase() ?? '?';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#AF0B01" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* TOP NAV */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: scale(5) }}>
          <Ionicons name="arrow-back" size={scale(24)} color="#222D31" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Profile</Text>
        {isDirty ? (
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={styles.navAction}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: scale(40) }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scale(40) }}
      >
        {/* AVATAR SECTION */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {profilePicUrl ? (
              <Image source={{ uri: profilePicUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </View>
            )}
            <View style={styles.avatarEditBtn}>
              <Ionicons name="camera-outline" size={scale(11)} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.email?.split('@')[0]}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {memberSince ? (
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          ) : null}
        </View>



        {/* STATS */}
        <View style={styles.section}>
          <View style={styles.statsRow}>
            {/* GUIDE: statCard background changed to #222D31 (dark blue-gray), text to #FFF */}
            <View style={[styles.statCard, { backgroundColor: '#ffffff', borderColor: '#cfd4da' }]}>
              <Text style={[styles.statNumber, { color: '#222D31' }]}>{listingsCount}</Text>
              <Text style={[styles.statLabel, { color: '#222D31' }]}>Listings</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#ffffff', borderColor: '#cfd4da' }]}>
              <Text style={[styles.statNumber, { color: '#222D31' }]}>{transactionsCount}</Text>
              <Text style={[styles.statLabel, { color: '#222D31' }]}>Rentals</Text>
            </View>
          </View>
        </View>

        {/* ACCOUNT */}
<View style={styles.section}>
  <Text style={styles.sectionLabel}>Account</Text>
  <View style={styles.infoCard}>
    <View style={styles.infoRow}>
      <Ionicons
        name="mail-outline"
        size={scale(17)}
        color="#AF0B01"
        style={styles.infoIcon}
      />
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoRowLabel}>Email</Text>
        <Text style={[styles.infoRowValue, { fontWeight: '700' }]}>{user?.email}</Text>
      </View>

            </View>

            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={scale(17)}
                color="#AF0B01"
                style={styles.infoIcon}
              />
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoRowLabel}>Account Status</Text>
                <Text style={[styles.infoRowValue,{ fontWeight: '700' }]}>Active</Text>
              </View>
              <View
                style={{
                  backgroundColor: '#E8F5E9',
                  paddingHorizontal: scale(8),
                  paddingVertical: scale(3),
                  borderRadius: scale(5),
                }}
              >
                <Text
                  style={{
                    fontSize: scale(10),
                    fontWeight: '700',
                    color: '#27AE60',
                    textTransform: 'uppercase',
                  }}
                >
                  Active
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* BIO */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bio</Text>
          <View style={styles.infoCard}>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Ionicons
                name="document-text-outline"
                size={scale(17)}
                color="#AF0B01"
                style={styles.infoIcon}
              />
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoRowLabel}>About Me</Text>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={handleBioChange}
                  placeholder="Write a short bio..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={160}
                />
              </View>
            </View>
          </View>
          <Text style={styles.charCount}>{bio.length}/160</Text>
        </View>

        {/* SAVE BUTTON */}
        {isDirty && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={scale(18)} color="#FFF" />
            )}
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}