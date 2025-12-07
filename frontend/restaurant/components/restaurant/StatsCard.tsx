import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { componentStyles } from '../../styles/components';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: any; // Placeholder for icon
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value }) => {
  return (
    <View style={componentStyles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
