import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { globalStyles } from '@/styles/global';
import { Colors } from '@/constants/Colors';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { OrdersService } from '@/services/orders';
import { Order } from '@/types/orders';

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const fetchDashboardData = async () => {
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
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const todayRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard as ViewStyle} key={item.id}>
      <View style={styles.orderHeader as ViewStyle}>
        <Text style={styles.orderId as TextStyle}>Order #{item.id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: Colors.warning + '20' }] as ViewStyle}>
          <Text style={[styles.statusText, { color: Colors.warning }] as TextStyle}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.orderFooter as ViewStyle}>
        <Text style={styles.orderTime as TextStyle}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.orderAmount as TextStyle}>${item.totalAmount.toFixed(2)}</Text>
      </View>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={[globalStyles.container, styles.loadingContainer] as ViewStyle}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={globalStyles.container as ViewStyle}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header as ViewStyle}>
        <Text style={globalStyles.title as TextStyle}>Dashboard</Text>
        <Text style={styles.subtitle as TextStyle}>Today's Overview</Text>
      </View>

      <View style={styles.statsRow as ViewStyle}>
        <StatCard 
          title="Orders" 
          value={orders.length} 
          icon="cart" 
          color={Colors.primary} 
        />
        <StatCard 
          title="Revenue" 
          value={`$${todayRevenue.toFixed(0)}`} 
          icon="cash" 
          color={Colors.success} 
        />
      </View>

      <View style={[styles.statsRow, { marginTop: 8 }] as ViewStyle}>
        <StatCard 
          title="Pending" 
          value={pendingOrders.length} 
          icon="time" 
          color={Colors.warning} 
        />
        <StatCard 
          title="Rating" 
          value="4.8" 
          icon="star" 
          color="#F1C40F" 
        />
      </View>

      <View style={styles.sectionHeader as ViewStyle}>
        <Text style={styles.sectionTitle as TextStyle}>Active Orders ({pendingOrders.length + preparingOrders.length})</Text>
        <Text style={styles.viewAll as TextStyle} onPress={() => navigation.navigate('Orders')}>View All</Text>
      </View>

      {pendingOrders.length === 0 && preparingOrders.length === 0 ? (
        <Card style={styles.emptyCard as ViewStyle}>
          <Ionicons name="cafe-outline" size={48} color={Colors.text + '40'} />
          <Text style={styles.emptyText as TextStyle}>No active orders at the moment</Text>
        </Card>
      ) : (
        <View>
          {[...pendingOrders, ...preparingOrders].slice(0, 5).map(order => (
            renderOrderItem({ item: order })
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text + '80',
    marginTop: -8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 14,
    color: Colors.text + '60',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.gray + '50',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text + '60',
    textAlign: 'center',
  },
});
