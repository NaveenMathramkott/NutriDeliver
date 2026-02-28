import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { globalStyles } from '@/styles/global';
import { Colors } from '@/constants/Colors';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { RestaurantService } from '@/services/restaurant';
import { Restaurant } from '@/types/restaurant';

export default function RestaurantProfileScreen() {
  const [profile, setProfile] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await RestaurantService.getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && profile) {
      setProfile({ ...profile, imageUrl: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await RestaurantService.updateProfile(profile);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center] as ViewStyle}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container as ViewStyle} contentContainerStyle={styles.content}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title as TextStyle}>Restaurant Profile</Text>
      </View>

      <TouchableOpacity style={styles.imageContainer as ViewStyle} onPress={handlePickImage}>
        <Image 
          source={{ uri: profile?.imageUrl || 'https://via.placeholder.com/600x400' }} 
          style={styles.profileImage as ImageStyle} 
        />
        <View style={styles.imageOverlay as ViewStyle}>
          <Ionicons name="camera" size={30} color="#fff" />
          <Text style={styles.changePhotoText as TextStyle}>Change Photo</Text>
        </View>
      </TouchableOpacity>

      <Card>
        <Text style={styles.label}>Restaurant Name</Text>
        <Input 
          value={profile?.name} 
          onChangeText={(text) => profile && setProfile({ ...profile, name: text })}
        />

        <Text style={styles.label}>Address</Text>
        <Input 
          value={profile?.address} 
          onChangeText={(text) => profile && setProfile({ ...profile, address: text })}
          multiline
        />

        <Text style={styles.label}>Cuisines (comma separated)</Text>
        <Input 
          value={profile?.cuisine.join(', ')} 
          onChangeText={(text) => profile && setProfile({ ...profile, cuisine: text.split(',').map(c => c.trim()) })}
        />
      </Card>

      <Text style={styles.sectionTitle as TextStyle}>Operating Hours</Text>
      <Card>
        <View style={styles.hourRow as ViewStyle}>
          <Text style={styles.dayText as TextStyle}>Mon - Fri</Text>
          <Text style={styles.timeText as TextStyle}>09:00 AM - 10:00 PM</Text>
        </View>
        <View style={styles.hourRow as ViewStyle}>
          <Text style={styles.dayText as TextStyle}>Sat - Sun</Text>
          <Text style={styles.timeText as TextStyle}>10:00 AM - 11:00 PM</Text>
        </View>
      </Card>

      <Button 
        title="Save Changes" 
        onPress={handleSave} 
        isLoading={saving}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: Colors.gray,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: Colors.text + '80',
  },
  saveButton: {
    marginTop: 32,
  },
});
