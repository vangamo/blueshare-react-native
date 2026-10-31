import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TitleSearchField } from '@/components/title-search-field';
import { FontSize, FontWeight, Layout, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Fixed header: menu button, title/search field and avatar. Rendered once by the root layout. */
export function AppHeader() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          height: Layout.headerHeight + insets.top,
          paddingTop: insets.top,
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
          { backgroundColor: theme.creationBg, borderColor: theme.primaryBlue },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.menuGlyph, { color: theme.primaryBlue }]}>≡</Text>
      </Pressable>

      <TitleSearchField style={styles.title} />

      <View
        accessible
        accessibilityLabel="Profile"
        style={[styles.avatar, { backgroundColor: theme.avatarBg, borderColor: theme.primaryDark }]}>
        <Text style={styles.avatarEmoji}>👵</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: Layout.borderWidth,
  },
  menu: {
    minWidth: Layout.touchTarget,
    minHeight: Layout.touchTarget,
    borderWidth: Layout.borderWidth,
    borderRadius: Layout.controlRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGlyph: {
    fontSize: FontSize.titleCard,
    fontWeight: FontWeight.bold,
  },
  title: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  avatar: {
    width: Layout.avatarSize,
    height: Layout.avatarSize,
    borderRadius: Layout.avatarSize / 2,
    borderWidth: Layout.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: Layout.avatarEmojiSize,
  },
  pressed: {
    opacity: 0.7,
  },
});
