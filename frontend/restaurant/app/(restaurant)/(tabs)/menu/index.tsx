import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../../../components/ui/Header';
import { FoodItemCard } from '../../../../components/restaurant/FoodItemCard';
import { Button } from '../../../../components/common/Button';
import { useRestaurant } from '../../../../hooks/useRestaurant';
import { globalStyles } from '../../../../styles/global';
import { useAuth } from '../../../../hooks/useAuth';

export default function Menu() {
  const { menu, isLoading } = useRestaurant();
  const router = useRouter();
  const {logout} = useAuth();
  const logoutHandler = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Menu Management" />
      <View style={globalStyles.container}>
        <Button
          title="Add New Item"
          onPress={logoutHandler}
          // onPress={() => router.push('/(restaurant)/menu/new')}
          style={{ marginBottom: 16 }}
        />
        <FlatList
          data={menu}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FoodItemCard
              item={item}
              onPress={() => router.push(`/(restaurant)/menu/${item.id}`)}
            />
          )}
          refreshing={isLoading}
          onRefresh={() => {}} // Implement refresh logic
        />
      </View>
    </View>
  );
}
