import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { globalStyles } from '@/styles/global';
import { Colors } from '@/constants/Colors';
import { Card } from '@/components/common/Card';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New Order Received', message: 'You have a new order #AB123. Please accept it.', time: '2 mins ago', type: 'order', isRead: false },
    { id: '2', title: 'Payment Confirmed', message: 'Payout for last week has been processed.', time: '1 hour ago', type: 'system', isRead: true },
    { id: '3', title: 'Menu Item Low Stock', message: "Your 'Classic Burger' is running low on stock.", time: '5 hours ago', type: 'alert', isRead: true },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return 'cart';
      case 'system': return 'cash';
      case 'alert': return 'warning';
      default: return 'notifications';
    }
  };

  return (
    <View style={globalStyles.container as ViewStyle}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title as TextStyle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => markAsRead(item.id)}>
            <Card style={StyleSheet.flatten([styles.notifCard, !item.isRead && styles.unreadCard]) as ViewStyle}>
              <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: item.isRead ? Colors.gray : Colors.primary + '20' }]) as ViewStyle}>
                <Ionicons name={getIcon(item.type) as any} size={24} color={item.isRead ? Colors.text + '60' : Colors.primary} />
              </View>
              <View style={styles.notifInfo as ViewStyle}>
                <View style={styles.notifHeader as ViewStyle}>
                  <Text style={StyleSheet.flatten([styles.notifTitle, !item.isRead && styles.bold]) as TextStyle}>{item.title}</Text>
                  {!item.isRead && <View style={styles.unreadDot as ViewStyle} />}
                </View>
                <Text style={styles.notifMessage as TextStyle}>{item.message}</Text>
                <Text style={styles.notifTime as TextStyle}>{item.time}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
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
  notifCard: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifInfo: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 16,
    color: Colors.text,
  },
  bold: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifMessage: {
    fontSize: 14,
    color: Colors.text + '80',
    marginTop: 2,
  },
  notifTime: {
    fontSize: 12,
    color: Colors.text + '40',
    marginTop: 4,
  },
});
