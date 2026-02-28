import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { globalStyles } from '@/styles/global';
import { Colors } from '@/constants/Colors';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { RestaurantService } from '@/services/restaurant';
import { MenuItem } from '@/types/restaurant';

export default function MenuItemDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const isNewItem = id === 'new';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(!isNewItem);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (!isNewItem) {
      const fetchItem = async () => {
        try {
          const menu = await RestaurantService.getMenu();
          const item = menu.find(i => i.id === id);
          if (item) {
            setName(item.name);
            setDescription(item.description);
            setPrice(item.price.toString());
            setImageUrl(item.imageUrl);
            setIsAvailable(item.isAvailable);
          }
        } catch (error) {
          console.error('Error fetching item:', error);
          Alert.alert('Error', 'Failed to load item details');
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    }
  }, [id, isNewItem]);

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Error', 'Name and Price are required');
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        isAvailable,
        restaurantId: 'current-restaurant-id' // This should be handled by backend or auth context
      };

      if (isNewItem) {
        await RestaurantService.addMenuItem(itemData as any);
        Alert.alert('Success', 'Item added to menu');
      } else {
        await RestaurantService.updateMenuItem(id as string, itemData);
        Alert.alert('Success', 'Item updated successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await RestaurantService.deleteMenuItem(id as string);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={StyleSheet.flatten([globalStyles.container, styles.center]) as ViewStyle}>
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
        <Text style={styles.headerTitle as TextStyle}>{isNewItem ? 'Add Food Item' : 'Edit Food Item'}</Text>
        {!isNewItem && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <Card>
        <Text style={styles.label}>Item Name *</Text>
        <Input 
          placeholder="e.g. Margherita Pizza"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Price ($) *</Text>
        <Input 
          placeholder="e.g. 12.99"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Description</Text>
        <Input 
          placeholder="Describe your item..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Text style={styles.label}>Image URL</Text>
        <Input 
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChangeText={setImageUrl}
        />

        <View style={styles.toggleRow as ViewStyle}>
          <Text style={styles.label}>Item Available</Text>
          <TouchableOpacity 
            style={StyleSheet.flatten([styles.toggle, isAvailable ? styles.toggleActive : styles.toggleInactive]) as ViewStyle}
            onPress={() => setIsAvailable(!isAvailable)}
          >
            <View style={StyleSheet.flatten([styles.toggleThumb, isAvailable ? styles.toggleThumbActive : styles.toggleThumbInactive]) as ViewStyle} />
          </TouchableOpacity>
        </View>
      </Card>

      <Button 
        title={isNewItem ? 'Add Item' : 'Save Changes'} 
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.success,
  },
  toggleInactive: {
    backgroundColor: Colors.border,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  saveButton: {
    marginTop: 24,
  },
});
