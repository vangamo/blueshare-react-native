import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TitleSearchField } from '@/components/title-search-field';
import { FontWeight, Layout, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

/** Fixed header: menu button, title/search field and avatar. Rendered once by the root layout. */
export function AppHeader() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { frame, sizes } = useShellLayout();

  return (
    <View
      style={[
        styles.header,
        {
          height: frame.headerHeight + insets.top,
          paddingTop: insets.top,
          paddingHorizontal: sizes.headerPaddingHorizontal,
          paddingLeft: sizes.headerPaddingHorizontal + insets.left,
          paddingRight: sizes.headerPaddingHorizontal + insets.right,
          backgroundColor: theme.cardBg,
          borderBottomColor: theme.borderColor,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menu"
        // The side menu is not built yet.
        onPress={() => {}}
        style={({ pressed }) => [
          styles.menu,
          {
            minWidth: sizes.menuButton,
            minHeight: sizes.menuButton,
            backgroundColor: theme.creationBg, borderColor: theme.primaryBlue,
          },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.menuGlyph, { fontSize: sizes.menuGlyph, color: theme.primaryBlue }]}>≡</Text>
      </Pressable>

      <TitleSearchField
        style={[
          styles.title,
          // Auto margins center a field that stops growing at its maximum width.
          frame.titleMaxWidth === null
            ? null
            : { maxWidth: frame.titleMaxWidth, marginHorizontal: 'auto' },
        ]}
      />

      <View
        accessible
        accessibilityLabel="Profile"
        style={[
          styles.avatar,
          {
            width: sizes.avatar,
            height: sizes.avatar,
            borderRadius: sizes.avatar / 2,
            backgroundColor: theme.avatarBg,
            borderColor: theme.primaryDark,
          },
        ]}>
        <Text style={{ fontSize: sizes.avatarEmoji }}>👵</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: Layout.borderWidth,
  },
  menu: {
    borderWidth: Layout.borderWidth,
    borderRadius: Layout.controlRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGlyph: {
    fontWeight: FontWeight.bold,
  },
  title: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  avatar: {
    borderWidth: Layout.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
