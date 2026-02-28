import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  SlideInUp, 
  SlideOutUp 
} from 'react-native-reanimated';
import { RootState } from '../../store';
import { hideToast } from '../../store/slices/uiSlice';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const Toast = () => {
  const dispatch = useDispatch();
  const toast = useSelector((state: RootState) => state.ui.toast);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (toast?.visible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      timerRef.current = setTimeout(() => {
        dispatch(hideToast());
      }, 4000);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast?.visible, dispatch]);

  if (!toast || !toast.visible) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case 'success': return Colors.success;
      case 'error': return Colors.error;
      case 'info': return Colors.primary;
      default: return Colors.primary;
    }
  };

  return (
    <Animated.View 
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutUp}
      style={[
        styles.container,
        { borderLeftColor: getIconColor() }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={getIcon() as any} size={24} color={getIconColor()} />
        <Text style={styles.message}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5.46,
    elevation: 9,
    borderLeftWidth: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  message: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
});
