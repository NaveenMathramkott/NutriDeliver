import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order } from '../../types/orders';
import { componentStyles } from '../../styles/components';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  return (
    <TouchableOpacity style={componentStyles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
        <Text style={styles.status}>{order.status.toUpperCase()}</Text>
      </View>
      <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
      <View style={styles.items}>
        <Text>
          {order.items.length} items • {formatCurrency(order.totalAmount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  items: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
