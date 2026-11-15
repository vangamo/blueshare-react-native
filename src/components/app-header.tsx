import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarImage } from '@/components/avatar-image';
import { ProfileDialog } from '@/components/profile-dialog';
import { TitleSearchField } from '@/components/title-search-field';
import { FontWeight, Layout, Spacing } from '@/constants/theme';
import { usePhotoUriFor } from '@/hooks/use-photo-uri';
import { useProfile } from '@/hooks/use-profile';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

/**
 * Fixed header: menu button, title/search field and avatar. Rendered once by the root layout.
 * The avatar opens the profile dialog, whose open state lives here: the header never
 * remounts, so the dialog survives a rotation.
 */
export function AppHeader() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { frame, sizes } = useShellLayout();
  const { status, profile } = useProfile();
  const uriFor = usePhotoUriFor();
  // A new key on every open, so the dialog starts from the saved profile.
  const [profileOpens, setProfileOpens] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const openProfile = () => {
    // Until the profile is read there is nothing to edit (it takes milliseconds at start).
    if (status === 'loading') return;
    Keyboard.dismiss();
    setProfileOpens((count) => count + 1);
    setProfileOpen(true);
  };

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profile"
        onPress={openProfile}
        style={({ pressed }) => [
          styles.avatarButton,
          { minWidth: Layout.touchTarget, minHeight: Layout.touchTarget },
          pressed && styles.pressed,
        ]}>
        <AvatarImage
          uri={profile?.avatar ? uriFor(profile.avatar.file) : null}
          size={sizes.avatar}
          emojiSize={sizes.avatarEmoji}
        />
      </Pressable>

      {profileOpen ? (
        <ProfileDialog key={profileOpens} onClose={() => setProfileOpen(false)} />
      ) : null}
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
  avatarButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
