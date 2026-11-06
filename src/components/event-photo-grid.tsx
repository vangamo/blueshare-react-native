import { Image } from 'expo-image';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';

import { EVENT_MAX_PHOTOS } from '@/constants/limits';
import { FontWeight, Layout } from '@/constants/theme';
import { usePhotoUriFor } from '@/hooks/use-photo-uri';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';
import type { PickedPhoto, StoredPhoto } from '@/items/domain/image-item';

/**
 * One photo of an event being created or edited: one the event already holds, or one
 * picked and not yet copied. `key` is the stored file name or a unique counter, so the
 * same gallery photo picked twice still gets two thumbnails with stable keys.
 */
export type EventPhotoDraft =
  | { key: string; kind: 'stored'; photo: StoredPhoto }
  | { key: string; kind: 'picked'; photo: PickedPhoto };

let pickedCount = 0;

/** Drafts for photos just picked, each with a new unique key. */
export function pickedDrafts(photos: readonly PickedPhoto[]): EventPhotoDraft[] {
  return photos.map((photo) => ({ key: `picked-${++pickedCount}`, kind: 'picked', photo }));
}

/** Drafts for the photos an event holds, keyed by file name. */
export function storedDrafts(photos: readonly StoredPhoto[]): EventPhotoDraft[] {
  return photos.map((photo) => ({ key: photo.file, kind: 'stored', photo }));
}

/** `added` after `photos`, keeping only the first `EVENT_MAX_PHOTOS`. */
export function appendPhotos(
  photos: readonly EventPhotoDraft[],
  added: readonly EventPhotoDraft[],
): EventPhotoDraft[] {
  return [...photos, ...added].slice(0, EVENT_MAX_PHOTOS);
}

type EventPhotoGridProps = {
  photos: readonly EventPhotoDraft[];
  onRemove: (key: string) => void;
};

/**
 * The chosen photos of an event as square, cropped thumbnails in rows of
 * `sizes.thumbColumns`, each with a "✕" remove button in its top right corner. It wraps
 * instead of scrolling, so it fits inside the dialog's scroll view.
 */
export function EventPhotoGrid({ photos, onRemove }: EventPhotoGridProps) {
  const theme = useTheme();
  const { sizes, columnWidth } = useShellLayout();
  const uriFor = usePhotoUriFor();
  if (photos.length === 0) return null;

  // Same inner width as `PhotoPreview`: the box's content.
  const innerWidth = columnWidth - 2 * (sizes.cardPadding + Layout.borderWidth);
  const columns = sizes.thumbColumns;
  // A row that adds up to exactly the box's width wraps its last thumbnail on Android (seen
  // on a 411-point phone, from float rounding in the layout). The row keeps one device pixel
  // free, and the side is rounded down to whole device pixels.
  const scale = PixelRatio.get();
  const rowSpace = innerWidth - (columns - 1) * Layout.creationGap - 1 / scale;
  const side = Math.floor((rowSpace / columns) * scale) / scale;

  return (
    <View style={styles.grid} testID="event-photo-grid">
      {photos.map((draft, index) => {
        const number = index + 1;
        const uri = draft.kind === 'picked' ? draft.photo.uri : uriFor(draft.photo.file);
        return (
          <View key={draft.key} style={{ width: side, height: side }}>
            <View
              testID="event-thumbnail"
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Foto ${number} de ${photos.length}`}
              style={[styles.thumbnail, { backgroundColor: theme.imageBackdrop }]}>
              <Image
                testID="event-thumbnail-image"
                source={{ uri }}
                contentFit="cover"
                accessible={false}
                style={styles.image}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar foto ${number}`}
              onPress={() => onRemove(draft.key)}
              style={({ pressed }) => [
                styles.remove,
                {
                  width: sizes.controlHeight,
                  height: sizes.controlHeight,
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.primaryDark,
                },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.glyph, { fontSize: sizes.buttonLabel, color: theme.textMain }]}>✕</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.creationGap,
  },
  thumbnail: {
    flex: 1,
    borderRadius: Layout.photoRadius,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  remove: {
    position: 'absolute',
    top: Layout.thumbRemoveInset,
    right: Layout.thumbRemoveInset,
    borderWidth: Layout.borderWidth,
    borderRadius: Layout.controlRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  glyph: {
    fontWeight: FontWeight.bold,
  },
});
