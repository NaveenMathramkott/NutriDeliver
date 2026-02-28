import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { globalStyles } from '@/styles/global';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Password reset instructions sent to your email.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send reset instructions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Reset Password</Text>
      <Text style={globalStyles.text}>Enter your email address to receive password reset instructions.</Text>
      <View style={{ height: 20 }} />
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button title="Send Instructions" onPress={handleReset} isLoading={isLoading} />
    </View>
  );
}
