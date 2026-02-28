import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Colors } from '@/constants/Colors';
import { globalStyles } from '@/styles/global';
import { RestaurantService } from '@/services/restaurant';
import { useDispatch } from 'react-redux';
import { setRestaurantExists } from '@/store/slices/authSlice';
import { Storage } from '@/utils/storage';

export default function SetupScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const handleSave = async () => {
    if (!name || !address || !cuisine) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await RestaurantService.updateProfile({
        name,
        address,
        cuisine: cuisine.split(',').map(c => c.trim()),
      });
      
      await Storage.setItem('hasRestaurant', true);
      dispatch(setRestaurantExists(true));
      // No need for navigation.replace('Main') as RootNavigator will handle it
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={globalStyles.title}>Setup Restaurant</Text>
        <Text style={styles.subtitle}>Let's configure your restaurant profile to get started.</Text>
      </View>

      <Card>
        <Text style={styles.label}>Restaurant Name *</Text>
        <Input
          placeholder="Enter restaurant name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Address *</Text>
        <Input
          placeholder="Enter full address"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <Text style={styles.label}>Cuisines (comma separated) *</Text>
        <Input
          placeholder="e.g. Italian, Pizza, Pasta"
          value={cuisine}
          onChangeText={setCuisine}
        />

        <Text style={styles.label}>Description</Text>
        <Input
          placeholder="Short description of your restaurant"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </Card>

      <Button
        title="Complete Setup"
        onPress={handleSave}
        isLoading={isLoading}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  header: {
    marginVertical: 24,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text + '99',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  button: {
    marginTop: 8,
  },
});
