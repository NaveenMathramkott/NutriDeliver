import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ViewStyle, TextStyle } from 'react-native';
import { globalStyles } from '../../../../styles/global';
import { Colors } from '../../../../constants/Colors';
import { Card } from '../../../../components/common/Card';
import { OrdersService } from '../../../../services/orders';
import { Order } from '../../../../types/orders';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchHistory = async () => {
    try {
      const data = await OrdersService.getOrders();
      // Filter for completed/cancelled orders for history
      setOrders(data.filter(o => o.status === 'delivered' || o.status === 'cancelled'));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => router.push(`/(restaurant)/orders/${item.id}`)}>
      <Card style={styles.orderCard as ViewStyle}>
        <View style={styles.orderHeader as ViewStyle}>
          <Text style={styles.orderId as TextStyle}>Order #{item.id.slice(-6).toUpperCase()}</Text>
          <Text style={StyleSheet.flatten([styles.statusText, { color: item.status === 'delivered' ? Colors.success : Colors.error }]) as TextStyle}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <View style={styles.orderFooter as ViewStyle}>
          <Text style={styles.orderDate as TextStyle}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.orderAmount as TextStyle}>${item.totalAmount.toFixed(2)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container as ViewStyle}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title as TextStyle}>Order History</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer as ViewStyle}>
            <Ionicons name="archive-outline" size={64} color={Colors.text + '30'} />
            <Text style={styles.emptyText as TextStyle}>No past orders found</Text>
          </View>
        }
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
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDate: {
    fontSize: 14,
    color: Colors.text + '60',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text + '40',
  },
});
