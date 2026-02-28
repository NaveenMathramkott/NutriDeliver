import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { globalStyles } from '@/styles/global';
import { Colors } from '@/constants/Colors';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';

export default function AnalyticsScreen() {
  // Mock data for analytics
  const popularItems = [
    { name: 'Margherita Pizza', orders: 45, growth: '+12%' },
    { name: 'Garden Salad', orders: 32, growth: '+5%' },
    { name: 'Spaghetti Carbonara', orders: 28, growth: '-2%' },
  ];

  const peakHours = [
    { hour: '12:00 PM', intensity: 0.8 },
    { hour: '01:00 PM', intensity: 1.0 },
    { hour: '07:00 PM', intensity: 0.9 },
    { hour: '08:00 PM', intensity: 0.7 },
  ];

  return (
    <ScrollView style={globalStyles.container as ViewStyle}>
      <Text style={globalStyles.title as TextStyle}>Analytics</Text>
      
      <View style={styles.statsRow as ViewStyle}>
        <StatCard title="Total Sales" value="$4,250" icon="trending-up" color={Colors.success} />
        <StatCard title="Avg Order" value="$28.5" icon="bar-chart" color={Colors.primary} />
      </View>

      <Text style={styles.sectionTitle as TextStyle}>Popular Items</Text>
      <Card>
        {popularItems.map((item, index) => (
          <View key={index} style={StyleSheet.flatten([styles.itemRow, index === popularItems.length - 1 && { borderBottomWidth: 0 }]) as ViewStyle}>
            <View>
              <Text style={styles.itemName as TextStyle}>{item.name}</Text>
              <Text style={styles.itemOrders as TextStyle}>{item.orders} orders this week</Text>
            </View>
            <Text style={StyleSheet.flatten([styles.growthText, { color: item.growth.startsWith('+') ? Colors.success : Colors.error }]) as TextStyle}>
              {item.growth}
            </Text>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle as TextStyle}>Peak Hours</Text>
      <Card>
        {peakHours.map((hour, index) => (
          <View key={index} style={styles.peakRow as ViewStyle}>
            <Text style={styles.hourLabel as TextStyle}>{hour.hour}</Text>
            <View style={styles.progressBarBg as ViewStyle}>
              <View style={StyleSheet.flatten([styles.progressBarFill, { width: `${hour.intensity * 100}%` }]) as ViewStyle} />
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.footer as ViewStyle}>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color={Colors.primary} />
          <Text style={styles.exportText as TextStyle}>Export Detailed Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  itemOrders: {
    fontSize: 12,
    color: Colors.text + '60',
    marginTop: 2,
  },
  growthText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hourLabel: {
    width: 80,
    fontSize: 14,
    color: Colors.text,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  footer: {
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  exportText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
});
