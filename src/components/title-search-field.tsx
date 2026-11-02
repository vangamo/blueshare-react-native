import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputInstance,
  type ViewStyle,
} from 'react-native';

import { FontWeight, Layout, Radius, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useWindowSize } from '@/hooks/use-window-size';
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
  const { sizes } = useShellLayout();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

  // Latest window size, read by the keyboard listeners below.
  const windowSize = useWindowSize();
  const windowRef = useRef(windowSize);
  useEffect(() => {
    windowRef.current = windowSize;
  });

  // Android keeps the field focused when the keyboard is dismissed (back button or
  // keyboard arrow). Blur it so the field returns to its rest state. A rotation also fires
  // `keyboardDidHide`, so the blur waits a grace period and is skipped when the keyboard
  // comes back or the window size changed meanwhile (design D4).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      cancel();
      const { width, height } = windowRef.current;
      timer = setTimeout(() => {
        timer = undefined;
        const now = windowRef.current;
        if (now.width === width && now.height === height) inputRef.current?.blur();
      }, Layout.keyboardHideGraceMs);
    });
    const show = Keyboard.addListener('keyboardDidShow', cancel);
    return () => {
      cancel();
      hide.remove();
      show.remove();
    };
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
          height: sizes.fieldHeight,
          fontSize: sizes.fieldFont,
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
    borderWidth: Layout.borderWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    // Android adds vertical padding by default, which would break the field height.
    paddingVertical: 0,
    fontWeight: FontWeight.bold,
  },
});
