import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MISSING_PHOTO_MESSAGE } from '@/components/photo-preview';
import { Layout, Spacing } from '@/constants/theme';
import { usePhotoUri } from '@/hooks/use-photo-uri';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

type EventPhotoTileProps = {
  /** The stored photo's file name. */
  file: string;
  /** Screen reader name, e.g. "Foto 2 de 5 de Viaje a Cádiz". */
  label: string;
};

/**
 * One square tile of an event card's photo row: `eventTileSize` on the image backdrop,
 * sized before the photo loads, the photo cropped around its center. When the file can't
 * be read, it shows "⚠️ Imagen no disponible".
 */
export function EventPhotoTile({ file, label }: EventPhotoTileProps) {
  const theme = useTheme();
  const { sizes, eventTileSize } = useShellLayout();
  const uri = usePhotoUri(file);
  const [failedUri, setFailedUri] = useState<string | null>(null);

  return (
    <View
      testID="event-photo-tile"
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[
        styles.tile,
        { width: eventTileSize, height: eventTileSize, backgroundColor: theme.imageBackdrop },
      ]}>
      {failedUri === uri ? (
        <Text style={[styles.message, { fontSize: sizes.captionText, color: theme.textMuted }]}>
          {MISSING_PHOTO_MESSAGE}
        </Text>
      ) : (
        <Image
          testID="event-photo-tile-image"
          source={{ uri }}
          contentFit="cover"
          accessible={false}
          style={styles.image}
          onError={() => setFailedUri(uri)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
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
    padding: Spacing.sm,
  },
});
