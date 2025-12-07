import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log('isAuthenticated----------------', JSON.stringify(isAuthenticated, null, 2));

  if (isAuthenticated) {
    return <Redirect href="/(restaurant)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
