import React from 'react';
import { View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../../../components/ui/Header';
import { OrderCard } from '../../../../components/restaurant/OrderCard';
import { useOrders } from '../../../../hooks/useOrders';
import { globalStyles } from '../../../../styles/global';

export default function Orders() {
  const { orders, isLoading, refreshOrders } = useOrders();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Header title="Orders" />
      <View style={globalStyles.container}>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              item={item} // Note: OrderCard props might need adjustment based on previous definition
              order={item}
              onPress={() => router.push(`/(restaurant)/orders/${item.id}`)}
            />
          )}
          refreshing={isLoading}
          onRefresh={refreshOrders}
        />
      </View>
    </View>
  );
}
