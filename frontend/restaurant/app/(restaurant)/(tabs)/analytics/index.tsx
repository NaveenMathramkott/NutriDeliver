import React from 'react';
import { View, Text } from 'react-native';
import { globalStyles } from '../../../../styles/global';
import { Header } from '../../../../components/ui/Header';

export default function Analytics() {
  return (
    <View style={{ flex: 1 }}>
      <Header title="Analytics" />
      <View style={globalStyles.container}>
        <Text>Analytics Dashboard Coming Soon</Text>
      </View>
    </View>
  );
}
