import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ViewStyle, TextStyle } from 'react-native';
import { globalStyles } from '../../../../styles/global';
import { Colors } from '../../../../constants/Colors';
import { Card } from '../../../../components/common/Card';
import { StatCard } from '../../../../components/common/StatCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function EarningsScreen() {
  const [activeFilter, setActiveFilter] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const router = useRouter();

  const transactions = [
    { id: '1', date: '2024-05-20', amount: 125.50, status: 'paid' },
    { id: '2', date: '2024-05-19', amount: 84.20, status: 'paid' },
    { id: '3', date: '2024-05-18', amount: 210.00, status: 'pending' },
    { id: '4', date: '2024-05-17', amount: 145.00, status: 'paid' },
  ];

  return (
    <View style={globalStyles.container as ViewStyle}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title as TextStyle}>Earnings</Text>
      </View>

      <View style={styles.filterContainer as ViewStyle}>
        {['daily', 'weekly', 'monthly'].map((filter) => (
          <TouchableOpacity 
            key={filter} 
            style={StyleSheet.flatten([styles.filterButton, activeFilter === filter && styles.activeFilterButton]) as ViewStyle}
            onPress={() => setActiveFilter(filter as any)}
          >
            <Text style={StyleSheet.flatten([styles.filterText, activeFilter === filter && styles.activeFilterText]) as TextStyle}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow as ViewStyle}>
          <StatCard title="Net Earnings" value="$1,450.00" icon="wallet" color={Colors.success} />
          <StatCard title="Orders" value="52" icon="cart" color={Colors.primary} />
        </View>

        <Card style={styles.nextPayoutCard as ViewStyle}>
          <View>
            <Text style={styles.payoutLabel as TextStyle}>Next Payout</Text>
            <Text style={styles.payoutDate as TextStyle}>May 25, 2024</Text>
          </View>
          <Text style={styles.payoutAmount as TextStyle}>$450.00</Text>
        </Card>

        <Text style={styles.sectionTitle as TextStyle}>Recent Transactions</Text>
        {transactions.map((t) => (
          <Card key={t.id} style={styles.transactionCard as ViewStyle}>
            <View>
              <Text style={styles.transactionDate as TextStyle}>{new Date(t.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
              <View style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: t.status === 'paid' ? Colors.success + '20' : Colors.warning + '20' }]) as ViewStyle}>
                <Text style={StyleSheet.flatten([styles.statusText, { color: t.status === 'paid' ? Colors.success : Colors.warning }]) as TextStyle}>
                  {t.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.transactionAmount as TextStyle}>${t.amount.toFixed(2)}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: Colors.gray,
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text + '80',
  },
  activeFilterText: {
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
    marginBottom: 20,
  },
  nextPayoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    marginBottom: 32,
  },
  payoutLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  payoutDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  payoutAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
});
