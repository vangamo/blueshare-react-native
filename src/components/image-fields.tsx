import { useRef } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';

import { BoxButton } from '@/components/box-button';
import { BoxTextArea } from '@/components/box-text-area';
import { BoxTextField } from '@/components/box-text-field';
import { FieldLabel } from '@/components/field-label';
import { PhotoPreview } from '@/components/photo-preview';
import { ALT_TEXT_MAX_LENGTH, CAPTION_MAX_LENGTH } from '@/constants/limits';
import { FontWeight, Spacing } from '@/constants/theme';
import { usePickPhoto } from '@/hooks/use-pick-photo';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';
import type { PickedPhoto } from '@/items/domain/image-item';

export const PICKER_ERROR_MESSAGE = '⚠️ No se pudo abrir la galería. Inténtalo de nuevo.';
export const ALT_TEXT_HINT = 'Describe la foto para quien no pueda verla.';

type ImageFieldsProps = {
  /** What to preview: the chosen or the stored photo, or `null` when there is none yet. */
  photo: { uri: string; width: number; height: number } | null;
  altText: string;
  caption: string;
  onAltTextChange: (text: string) => void;
  onCaptionChange: (text: string) => void;
  /** Called with the photo the user picked. Not called when the picker is cancelled. */
  onPhotoPicked: (photo: PickedPhoto) => void;
  onPickerFailed: () => void;
  /** Shows the gallery error message. */
  pickerFailed: boolean;
};

/**
 * The form of an image item: the photo button and preview, "Texto alternativo" with its
 * hint, and "Pie de foto". Shared by the image step of the creation box and the image
 * dialog, which keep the state and decide what the buttons below do.
 */
export function ImageFields({
  photo,
  altText,
  caption,
  onAltTextChange,
  onCaptionChange,
  onPhotoPicked,
  onPickerFailed,
  pickerFailed,
}: ImageFieldsProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  const pickPhoto = usePickPhoto();
  // Guards against a second tap while the picker is opening.
  const pickingRef = useRef(false);

  const choose = async () => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    try {
      const picked = await pickPhoto();
      if (picked) onPhotoPicked(picked);
    } catch {
      onPickerFailed();
      // Android reads the live region; iOS needs an explicit announcement.
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(PICKER_ERROR_MESSAGE);
    } finally {
      pickingRef.current = false;
    }
  };

  return (
    <>
      {photo ? (
        <PhotoPreview uri={photo.uri} width={photo.width} height={photo.height} label="Foto elegida" />
      ) : null}
      <BoxButton
        label={photo ? 'Cambiar foto' : 'Elegir foto'}
        variant="secondary"
        onPress={() => {
          void choose();
        }}
      />
      {pickerFailed ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.error, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
          {PICKER_ERROR_MESSAGE}
        </Text>
      ) : null}
      <View style={styles.field}>
        <FieldLabel label="Texto alternativo" hint={ALT_TEXT_HINT} />
        <BoxTextArea
          value={altText}
          onChangeText={onAltTextChange}
          accessibilityLabel="Texto alternativo"
          accessibilityHint={ALT_TEXT_HINT}
          maxLength={ALT_TEXT_MAX_LENGTH}
        />
      </View>
      <View style={styles.field}>
        <FieldLabel label="Pie de foto" />
        <BoxTextField
          value={caption}
          onChangeText={onCaptionChange}
          accessibilityLabel="Pie de foto"
          maxLength={CAPTION_MAX_LENGTH}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.sm,
  },
  error: {
    fontWeight: FontWeight.bold,
  },
});
