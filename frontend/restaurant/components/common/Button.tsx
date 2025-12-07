import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { componentStyles } from '../../styles/components';

interface ButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[componentStyles.button, style, disabled && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={componentStyles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
