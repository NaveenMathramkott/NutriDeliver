import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../../../../components/ui/Header';
import { StatsCard } from '../../../../components/restaurant/StatsCard';
import { globalStyles } from '../../../../styles/global';
import { useRestaurant } from '../../../../hooks/useRestaurant';
import { useOrders } from '../../../../hooks/useOrders';

export default function Dashboard() {
  const { profile } = useRestaurant();
  const { orders } = useOrders();

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Dashboard" />
      <ScrollView style={globalStyles.container}>
        <View style={styles.statsContainer}>
          <StatsCard title="Pending Orders" value={pendingOrders} />
          <StatsCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
          <StatsCard title="Rating" value={profile?.rating || 'N/A'} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
});
