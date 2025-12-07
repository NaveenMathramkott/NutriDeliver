import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { componentStyles } from '../../styles/components';
import { Colors } from '../../constants/Colors';

interface InputProps extends TextInputProps {
  style?: any;
}

export const Input: React.FC<InputProps> = ({ style, ...props }) => {
  return (
    <TextInput
      style={[componentStyles.input, style]}
      placeholderTextColor={Colors.text + '80'}
      {...props}
    />
  );
};
