import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { useRestaurant } from '../../../hooks/useRestaurant';
import { RestaurantService } from '../../../services/restaurant';
import { globalStyles } from '../../../styles/global';
import { Header } from '../../../components/ui/Header';

export default function MenuItemDetails() {
  const { id } = useLocalSearchParams();
  const { menu, refreshMenu } = useRestaurant();
  const router = useRouter();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isNew && menu.length > 0) {
      const item = menu.find(i => i.id === id);
      if (item) {
        setName(item.name);
        setDescription(item.description);
        setPrice(item.price.toString());
      }
    }
  }, [id, menu, isNew]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const itemData = {
        name,
        description,
        price: parseFloat(price),
        restaurantId: 'current-restaurant-id', // Should come from auth/profile
        imageUrl: 'https://via.placeholder.com/150', // Placeholder
        isAvailable: true,
      };

      if (isNew) {
        await RestaurantService.addMenuItem(itemData);
      } else {
        await RestaurantService.updateMenuItem(id as string, itemData);
      }
      
      await refreshMenu();
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={isNew ? 'New Item' : 'Edit Item'} />
      <ScrollView style={globalStyles.container}>
        <Input placeholder="Item Name" value={name} onChangeText={setName} />
        <Input
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />
        <Input
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Button title="Save Item" onPress={handleSave} isLoading={isLoading} />
      </ScrollView>
    </View>
  );
}
