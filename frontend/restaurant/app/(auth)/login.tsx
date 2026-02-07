import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../hooks/useAuth';
import { globalStyles } from '../../styles/global';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    try {
      await login({ email, password });
      router.replace('/(restaurant)/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={globalStyles.container as ViewStyle}
    >
      <ScrollView contentContainerStyle={styles.scrollContent as ViewStyle}>
        <View style={styles.header as ViewStyle}>
          <View style={styles.logoContainer as ViewStyle}>
            <Ionicons name="restaurant" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.title as TextStyle}>NutriDeliver</Text>
          <Text style={styles.subtitle as TextStyle}>Restaurant Partner </Text>
        </View>

        <Card style={styles.card as ViewStyle}>
          <Text style={styles.cardTitle as TextStyle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle as TextStyle}>Login to manage your orders</Text>

          <Input
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Link href="/(auth)/forgot-password" style={styles.forgotPassword as ViewStyle}>
            <Text style={styles.linkText as any}>Forgot Password?</Text>
          </Link>

          <Button 
            title="Login" 
            onPress={handleLogin} 
            isLoading={isLoading} 
            style={styles.loginButton as ViewStyle}
          />
        </Card>

        <View style={styles.footer as ViewStyle}>
          <Text style={styles.footerText as TextStyle}>Don't have an account? </Text>
          <Link href="/(auth)/register">
            <Text style={StyleSheet.flatten([styles.linkText, styles.bold]) as TextStyle}>Register Now</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text + '99',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.text + '80',
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  loginButton: {
    marginTop: 10,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text + '80',
  },
  bold: {
    fontWeight: 'bold',
  },
});
