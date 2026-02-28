import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { globalStyles } from '@/styles/global';
import { Colors } from '@/constants/Colors';
import { Card } from '@/components/common/Card';
import { RestaurantService } from '@/services/restaurant';
import { MenuItem } from '@/types/restaurant';

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const fetchMenu = async () => {
    try {
      const data = await RestaurantService.getMenu();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenu();
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const updatedItem = await RestaurantService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      setMenuItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <Card style={styles.itemCard as ViewStyle}>
      <View style={styles.itemContent as ViewStyle}>
        <Image 
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} 
          style={styles.itemImage as ImageStyle} 
        />
        <View style={styles.itemInfo as ViewStyle}>
          <View style={styles.itemHeader as ViewStyle}>
            <Text style={styles.itemName as TextStyle}>{item.name}</Text>
            <Text style={styles.itemPrice as TextStyle}>${item.price.toFixed(2)}</Text>
          </View>
          <Text style={styles.itemDescription as TextStyle} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.itemActions as ViewStyle}>
            <TouchableOpacity 
              style={StyleSheet.flatten([styles.statusToggle, { backgroundColor: item.isAvailable ? Colors.success + '20' : Colors.error + '20' }]) as ViewStyle}
              onPress={() => toggleAvailability(item)}
            >
              <Text style={StyleSheet.flatten([styles.statusText, { color: item.isAvailable ? Colors.success : Colors.error }]) as TextStyle}>
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => navigation.navigate('MenuItemDetail', { id: item.id })}
            >
              <Ionicons name="pencil" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={StyleSheet.flatten([globalStyles.container, styles.center]) as ViewStyle}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container as ViewStyle}>
      <View style={styles.header as ViewStyle}>
        <Text style={globalStyles.title as TextStyle}>Menu Management</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('MenuItemDetail', { id: 'new' })}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText as TextStyle}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent as ViewStyle}
        ListEmptyComponent={
          <View style={styles.emptyContainer as ViewStyle}>
            <Ionicons name="restaurant-outline" size={64} color={Colors.text + '30'} />
            <Text style={styles.emptyText as TextStyle}>Your menu is empty</Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={() => navigation.navigate('MenuItemDetail', { id: 'new' })}>
              <Text style={styles.emptyAddButtonText as TextStyle}>Add your first item</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemCard: {
    padding: 12,
    marginBottom: 16,
  },
  itemContent: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.gray,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 8,
  },
  itemDescription: {
    fontSize: 12,
    color: Colors.text + '80',
    marginTop: 4,
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 4,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text + '60',
    marginTop: 16,
  },
  emptyAddButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
