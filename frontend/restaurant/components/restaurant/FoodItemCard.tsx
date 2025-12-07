import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MenuItem } from '../../types/restaurant';
import { componentStyles } from '../../styles/components';
import { formatCurrency } from '../../utils/formatters';

interface FoodItemCardProps {
  item: MenuItem;
  onPress: () => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={componentStyles.card} onPress={onPress}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ecc71',
  },
});
