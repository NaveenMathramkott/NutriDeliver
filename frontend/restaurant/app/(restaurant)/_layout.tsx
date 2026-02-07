import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { DrawerContent } from '../../components/navigation/DrawerContent';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function RestaurantLayout() {
  return (
    <Drawer
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
        name="(tabs)"
        options={{
          drawerLabel: 'Dashboard',
          title: 'NutriDeliver',
          drawerIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile-details"
        options={{
          drawerLabel: 'Profile Details',
          title: 'Restaurant Profile',
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerLabel: 'Notifications',
          title: 'Notifications',
          drawerIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={22} color={color} />
          ),
        }}
      />
      
      {/* Hidden screens from drawer but accessible via navigation */}
      <Drawer.Screen
        name="support"
        options={{
          drawerItemStyle: { display: 'none' },
          title: 'Support',
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerItemStyle: { display: 'none' },
          title: 'Settings',
        }}
      />
      <Drawer.Screen
        name="analytics/index"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="menu/index"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
       <Drawer.Screen
        name="orders/index"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
