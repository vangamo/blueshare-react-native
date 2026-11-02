import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Layout } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

export const MISSING_PHOTO_MESSAGE = '⚠️ Imagen no disponible';

/**
 * Height of the box for a photo `width` × `height` shown `boxWidth` points wide: its natural
 * height, but at most `Layout.imageMaxRatio` times the width and at most `maxHeight`.
 */
export function photoBoxHeight(
  width: number,
  height: number,
  boxWidth: number,
  maxHeight: number,
): number {
  const natural = (boxWidth * height) / width;
  return Math.min(natural, boxWidth * Layout.imageMaxRatio, maxHeight);
}

type PhotoPreviewProps = {
  /** Where to load the photo from: a stored file or a picked file. */
  uri: string;
  /** The photo's own size, in pixels. Only the proportions matter. */
  width: number;
  height: number;
  /** Screen reader name of the photo. */
  label: string;
};

/**
 * A photo shown whole (never cropped) in a box on the image backdrop color, as wide as a
 * card's content and as tall as its proportions allow, up to `imageMaxHeight`. The box has
 * its final size before the photo loads. When the file can't be read, the box shows
 * "⚠️ Imagen no disponible". Used by the image card, the image step and the image dialog,
 * which all have the same inner width.
 */
export function PhotoPreview({ uri, width, height, label }: PhotoPreviewProps) {
  const theme = useTheme();
  const { sizes, columnWidth, imageMaxHeight } = useShellLayout();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const boxWidth = columnWidth - 2 * (sizes.cardPadding + Layout.borderWidth);
  const boxHeight = photoBoxHeight(width, height, boxWidth, imageMaxHeight);
  const missing = failedUri === uri;

  return (
    <View
      testID="photo-preview"
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[
        styles.box,
        { width: boxWidth, height: boxHeight, backgroundColor: theme.imageBackdrop },
      ]}>
      {missing ? (
        <Text style={[styles.message, { fontSize: sizes.captionText, color: theme.textMuted }]}>
          {MISSING_PHOTO_MESSAGE}
        </Text>
      ) : (
        <Image
          testID="photo-preview-image"
          source={{ uri }}
          contentFit="contain"
          accessible={false}
          style={styles.image}
          onError={() => setFailedUri(uri)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Layout.photoRadius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  message: {
    textAlign: 'center',
  },
});
