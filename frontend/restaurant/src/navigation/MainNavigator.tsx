import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

import { TabNavigator } from './TabNavigator';
import { DrawerContent } from '@/components/navigation/DrawerContent';

import ProfileDetailsScreen from '../screens/restaurant/ProfileDetailsScreen';
import NotificationsScreen from '../screens/restaurant/NotificationsScreen';
import SettingsScreen from '../screens/restaurant/SettingsScreen';
import SupportScreen from '../screens/restaurant/SupportScreen';

// Sub-screens for Menu/Orders (nested stacks)
import MenuDetailScreen from '../screens/restaurant/menu/MenuDetailScreen';
import CategoriesScreen from '../screens/restaurant/menu/CategoriesScreen';
import InventoryScreen from '../screens/restaurant/menu/InventoryScreen';
import MenuItemDetailScreen from '../screens/restaurant/menu/MenuItemDetailScreen';
import OrderDetailScreen from '../screens/restaurant/orders/OrderDetailScreen';
import OrderHistoryScreen from '../screens/restaurant/orders/OrderHistoryScreen';
import EarningsScreen from '../screens/restaurant/analytics/EarningsScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Stack that includes Tabs and sub-screens not in the bottom tab bar but reachable from them
const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="MenuDetail" component={MenuDetailScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
    </Stack.Navigator>
  );
};

export const MainNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerTintColor: Colors.primary,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.text,
        drawerLabelStyle: {
          marginLeft: -20,
          fontSize: 16,
          fontWeight: '500',
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={MainStack}
        options={{
          drawerLabel: 'Dashboard',
          title: 'NutriDeliver',
          drawerIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ProfileDetails"
        component={ProfileDetailsScreen}
        options={{
          drawerLabel: 'Profile Details',
          title: 'Restaurant Profile',
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          drawerLabel: 'Notifications',
          title: 'Notifications',
          drawerIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
          drawerIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Support"
        component={SupportScreen}
        options={{
          drawerLabel: 'Support',
          title: 'Support',
          drawerIcon: ({ color }) => (
            <Ionicons name="help-circle-outline" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};
