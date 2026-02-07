import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { globalStyles } from '../../../../styles/global';
import { Colors } from '../../../../constants/Colors';
import { Card } from '../../../../components/common/Card';
import { OrdersService } from '../../../../services/orders';
import { Order } from '../../../../types/orders';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const data = await OrdersService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  const tabs: { label: string; value: OrderStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Ready', value: 'ready' },
    { label: 'Delivered', value: 'delivered' },
  ];

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => router.push(`/(restaurant)/orders/${item.id}`)}>
      <Card style={styles.orderCard as ViewStyle}>
        <View style={styles.orderHeader as ViewStyle}>
          <View>
            <Text style={styles.orderId as TextStyle}>Order #{item.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderDate as TextStyle}>{new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
          </View>
          <Text style={styles.orderAmount as TextStyle}>${item.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.orderFooter as ViewStyle}>
          <Text style={styles.itemsCount as TextStyle}>{item.items.length} Items</Text>
          <View style={styles.detailsButton as ViewStyle}>
            <Text style={styles.detailsButtonText as TextStyle}>Details</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[globalStyles.container, styles.center as ViewStyle]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container as ViewStyle}>
      <Text style={[globalStyles.title, styles.title] as TextStyle}>Order Management</Text>
      
      <View style={styles.tabContainer as ViewStyle}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tab,
              activeTab === tab.value && styles.activeTab
            ] as ViewStyle}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.value && styles.activeTabText
            ] as TextStyle}>
              {tab.label}
            </Text>
            {orders.filter(o => o.status === tab.value).length > 0 && (
              <View style={styles.badge as ViewStyle}>
                <Text style={styles.badgeText as TextStyle}>
                  {orders.filter(o => o.status === tab.value).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent as ViewStyle}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer as ViewStyle}>
            <Ionicons name="receipt-outline" size={64} color={Colors.text + '30'} />
            <Text style={styles.emptyText as TextStyle}>No {activeTab} orders found</Text>
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
  title: {
    marginTop: 20,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.gray,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text + '80',
  },
  activeTabText: {
    color: Colors.primary,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.text + '60',
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsCount: {
    fontSize: 14,
    color: Colors.text + '80',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text + '40',
    fontWeight: '600',
  },
});
