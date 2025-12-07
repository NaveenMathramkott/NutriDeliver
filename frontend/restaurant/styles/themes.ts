import { Colors } from '../constants/Colors';

export const lightTheme = {
  dark: false,
  colors: {
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.secondary,
  },
};

export const darkTheme = {
  dark: true,
  colors: {
    primary: Colors.primary,
    background: '#000',
    card: '#1c1c1e',
    text: '#fff',
    border: '#2c2c2e',
    notification: Colors.secondary,
  },
};
