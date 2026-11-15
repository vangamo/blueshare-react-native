import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const AVATAR_EMOJI = '👵';

type AvatarImageProps = {
  /** Where to load the photo from. `null` shows the emoji. */
  uri: string | null;
  /** Outer diameter, border included. */
  size: number;
  emojiSize: number;
  /**
   * Screen reader name. When given, the circle is an `image` named so; when not, it is
   * hidden from screen readers (the control around it already has a name).
   */
  label?: string;
};

/**
 * The user's avatar: a circle with the strong-ink border on the avatar background, showing
 * the photo cropped to fill it, or `👵` when there is no photo or it can't be read. Used by
 * the header avatar and the profile dialog's preview.
 */
export function AvatarImage({ uri, size, emojiSize, label }: AvatarImageProps) {
  const theme = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showPhoto = uri !== null && failedUri !== uri;

  return (
    <View
      testID="avatar-image"
      accessible={label !== undefined}
      accessibilityRole={label !== undefined ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label !== undefined ? 'yes' : 'no-hide-descendants'}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.avatarBg,
          borderColor: theme.primaryDark,
        },
      ]}>
      {showPhoto ? (
        <Image
          testID="avatar-image-photo"
          source={{ uri }}
          contentFit="cover"
          accessible={false}
          style={styles.photo}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <Text testID="avatar-image-emoji" style={{ fontSize: emojiSize }}>
          {AVATAR_EMOJI}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: Layout.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
