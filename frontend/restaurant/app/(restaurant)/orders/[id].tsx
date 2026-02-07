import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { globalStyles } from '../../../styles/global';
import { Colors } from '../../../constants/Colors';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { OrdersService } from '../../../services/orders';
import { RestaurantService } from '../../../services/restaurant';
import { Order } from '../../../types/orders';
import { MenuItem } from '../../../types/restaurant';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [menuItems, setMenuItems] = useState<Record<string, MenuItem>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderData, menuData] = await Promise.all([
          OrdersService.getOrderDetails(id as string),
          RestaurantService.getMenu()
        ]);
        setOrder(orderData);
        
        const menuMap = menuData.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {} as Record<string, MenuItem>);
        setMenuItems(menuMap);
      } catch (error) {
        console.error('Error fetching order details:', error);
        Alert.alert('Error', 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const updatedOrder = await OrdersService.updateOrderStatus(id as string, newStatus);
      setOrder(updatedOrder);
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center] as ViewStyle}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[globalStyles.container, styles.center] as ViewStyle}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'preparing': return Colors.primary;
      case 'ready': return Colors.success;
      case 'delivered': return Colors.text + '80';
      default: return Colors.text;
    }
  };

  return (
    <ScrollView style={globalStyles.container as ViewStyle} contentContainerStyle={styles.content}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle as TextStyle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <Card style={styles.statusCard as ViewStyle}>
        <View style={styles.statusRow as ViewStyle}>
          <Text style={styles.label as TextStyle}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }] as ViewStyle}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }] as TextStyle}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.orderId as TextStyle}>Order #{order.id.toUpperCase()}</Text>
        <Text style={styles.orderDate as TextStyle}>{new Date(order.createdAt).toLocaleString()}</Text>
      </Card>

      <Text style={styles.sectionTitle as TextStyle}>Items</Text>
      <Card>
        {order.items.map((item, index) => (
          <View key={index} style={[styles.itemRow, index === order.items.length - 1 && { borderBottomWidth: 0 }] as ViewStyle}>
            <View style={styles.itemInfo as ViewStyle}>
              <Text style={styles.itemName as TextStyle}>{menuItems[item.menuItemId]?.name || 'Unknown Item'}</Text>
              <Text style={styles.itemQuantity as TextStyle}>x{item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice as TextStyle}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow as ViewStyle}>
          <Text style={styles.totalLabel as TextStyle}>Total Amount</Text>
          <Text style={styles.totalAmount as TextStyle}>${order.totalAmount.toFixed(2)}</Text>
        </View>
      </Card>

      <View style={styles.actions as ViewStyle}>
        {order.status === 'pending' && (
          <Button 
            title="Accept Order" 
            onPress={() => handleUpdateStatus('preparing')} 
            isLoading={updating}
          />
        )}
        {order.status === 'preparing' && (
          <Button 
            title="Mark as Ready" 
            onPress={() => handleUpdateStatus('ready')} 
            isLoading={updating}
            style={{ backgroundColor: Colors.success }}
          />
        )}
        {order.status === 'ready' && (
          <Button 
            title="Mark as Delivered" 
            onPress={() => handleUpdateStatus('delivered')} 
            isLoading={updating}
            style={{ backgroundColor: Colors.text }}
          />
        )}
      </View>
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
  statusCard: {
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: Colors.text + '60',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.text + '60',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.text + '60',
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  actions: {
    marginTop: 32,
  },
});
