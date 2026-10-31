import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputInstance,
  type ViewStyle,
} from 'react-native';

import { FontSize, FontWeight, Layout, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const APP_NAME = 'BlueShare';

type TitleSearchFieldProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Header field that shows the app name at rest and turns into a search input on
 * focus. Search itself is not wired up yet: submitting does nothing.
 */
export function TitleSearchField({ style }: TitleSearchFieldProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

  // Android keeps the field focused when the keyboard is dismissed (back button or
  // keyboard arrow). Blur it so the field returns to its rest state.
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidHide', () => {
      inputRef.current?.blur();
    });
    return () => subscription.remove();
  }, []);

  // At rest an empty (or blank) query shows the app name.
  const value = focused ? query : query.trim() ? query : APP_NAME;

  const handleFocus = () => {
    setFocused(true);
    if (query === APP_NAME) setQuery('');
  };

  const handleBlur = () => {
    setFocused(false);
    if (query.trim() === '') setQuery('');
  };

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={setQuery}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onSubmitEditing={() => {}}
      placeholder="Buscar..."
      placeholderTextColor={theme.textMuted}
      selectionColor={theme.primaryBlue}
      returnKeyType="search"
      accessibilityLabel="Search"
      style={[
        styles.field,
        {
          color: theme.textMain,
          textAlign: focused ? 'left' : 'center',
          borderColor: focused ? theme.primaryBlue : theme.primaryDark,
          backgroundColor: focused ? theme.cardBg : theme.surfaceMuted,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    height: Layout.fieldHeight,
    borderWidth: Layout.borderWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    // Android adds vertical padding by default, which would break the 42-point height.
    paddingVertical: 0,
    fontSize: FontSize.bodyLarge,
    fontWeight: FontWeight.bold,
  },
});
