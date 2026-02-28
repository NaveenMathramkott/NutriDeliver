import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, RefreshControl, ViewStyle, TextStyle } from 'react-native';
import { globalStyles } from '../../../../styles/global';
import { Colors } from '../../../../constants/Colors';
import { Card } from '../../../../components/common/Card';
import { RestaurantService } from '../../../../services/restaurant';
import { MenuItem } from '../../../../types/restaurant';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function InventoryManagementScreen() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchInventory = async () => {
    try {
      const data = await RestaurantService.getMenu();
      setItems(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const updatedItem = await RestaurantService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <Card style={styles.inventoryCard as ViewStyle}>
      <View style={styles.itemInfo as ViewStyle}>
        <Text style={styles.itemName as TextStyle}>{item.name}</Text>
        <Text style={styles.itemPrice as TextStyle}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.actionRow as ViewStyle}>
        <Text style={StyleSheet.flatten([styles.statusLabel, { color: item.isAvailable ? Colors.success : Colors.error }]) as TextStyle}>
          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
        </Text>
        <Switch
          value={item.isAvailable}
          onValueChange={() => toggleAvailability(item)}
          trackColor={{ false: Colors.border, true: Colors.success + '80' }}
          thumbColor={item.isAvailable ? Colors.success : '#f4f3f4'}
        />
      </View>
    </Card>
  );

  return (
    <View style={globalStyles.container as ViewStyle}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title as TextStyle}>Inventory</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent as ViewStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  listContent: {
    paddingBottom: 20,
  },
  inventoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.text + '60',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
