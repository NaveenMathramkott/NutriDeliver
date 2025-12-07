import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This is a placeholder as Expo Router handles tabs usually, but creating a custom one if needed
export const BottomTab = () => {
  return (
    <View style={styles.container}>
      <Text>Bottom Tab</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
