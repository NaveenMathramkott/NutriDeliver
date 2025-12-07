import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { Button } from '../../../components/common/Button';
import { OrdersService } from '../../../services/orders';
import { Order } from '../../../types/orders';
import { globalStyles } from '../../../styles/global';
import { formatCurrency } from '../../../utils/formatters';

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await OrdersService.getOrderDetails(id as string);
      setOrder(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await OrdersService.updateOrderStatus(id as string, status);
      loadOrder();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (!order) return null;

  return (
    <View style={{ flex: 1 }}>
      <Header title={`Order #${order.id.slice(-6)}`} />
      <ScrollView style={globalStyles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{order.status.toUpperCase()}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text>{item.quantity}x Item Name (ID: {item.menuItemId})</Text>
              <Text>{formatCurrency(item.price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.total}>{formatCurrency(order.totalAmount)}</Text>
        </View>

        <View style={styles.actions}>
          {order.status === 'pending' && (
            <Button title="Accept Order" onPress={() => updateStatus('preparing')} />
          )}
          {order.status === 'preparing' && (
            <Button title="Mark Ready" onPress={() => updateStatus('ready')} />
          )}
          {order.status === 'ready' && (
            <Button title="Mark Delivered" onPress={() => updateStatus('delivered')} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  actions: {
    gap: 16,
    marginBottom: 32,
  },
});
