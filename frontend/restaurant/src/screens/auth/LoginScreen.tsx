import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';
import { globalStyles } from '@/styles/global';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { showToast } from '@/store/slices/uiSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      dispatch(showToast({ message: 'Please enter both email and password', type: 'error' }));
      return;
    }
    
    try {
      await login({ email, password }).unwrap();
      dispatch(showToast({ message: 'Login successful!', type: 'success' }));
      // RootNavigator will automatically switch to Main stack because isAuthenticated changes
    } catch (err: any) {
      dispatch(showToast({ message: err || 'Login failed. Please check your credentials.', type: 'error' }));
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
          
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPassword as any}>
            <Text style={styles.linkText as any}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button 
            title="Login" 
            onPress={handleLogin} 
            isLoading={isLoading} 
            style={styles.loginButton as ViewStyle}
          />
        </Card>

        <View style={styles.footer as ViewStyle}>
          <Text style={styles.footerText as TextStyle}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={StyleSheet.flatten([styles.linkText, styles.bold]) as TextStyle}>Register Now</Text>
          </TouchableOpacity>
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
