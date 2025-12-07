import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Sidebar = () => {
  return (
    <View style={styles.container}>
      <Text>Sidebar</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: 250,
    padding: 20,
  },
});
