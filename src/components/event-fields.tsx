import { useRef } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';

import { BoxButton } from '@/components/box-button';
import { BoxTextArea } from '@/components/box-text-area';
import { BoxTextField } from '@/components/box-text-field';
import { CategorySuggestions } from '@/components/category-suggestions';
import {
  EventPhotoGrid,
  pickedDrafts,
  type EventPhotoDraft,
} from '@/components/event-photo-grid';
import { FieldLabel } from '@/components/field-label';
import { PICKER_ERROR_MESSAGE } from '@/components/image-fields';
import {
  EVENT_CATEGORY_MAX_LENGTH,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_MAX_PHOTOS,
  EVENT_TITLE_MAX_LENGTH,
} from '@/constants/limits';
import { FontWeight, Spacing } from '@/constants/theme';
import { usePickPhotos } from '@/hooks/use-pick-photos';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

export const PHOTO_LIMIT_MESSAGE = `Un evento puede tener hasta ${EVENT_MAX_PHOTOS} fotos.`;

type EventFieldsProps = {
  photos: readonly EventPhotoDraft[];
  title: string;
  category: string;
  description: string;
  /** Called with the photos just picked (never more than still fit), to add at the end. */
  onPhotosAdded: (photos: EventPhotoDraft[]) => void;
  onPhotoRemoved: (key: string) => void;
  onTitleChange: (text: string) => void;
  onCategoryChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onPickerFailed: () => void;
  /** Shows the gallery error message. */
  pickerFailed: boolean;
};

/**
 * The form of an event item: the thumbnails, the photo button with the gallery and limit
 * messages, "Título", "Categoría" with its suggestions, and "Descripción". Shared by the
 * event step of the creation box and the event dialog, which keep the state.
 */
export function EventFields({
  photos,
  title,
  category,
  description,
  onPhotosAdded,
  onPhotoRemoved,
  onTitleChange,
  onCategoryChange,
  onDescriptionChange,
  onPickerFailed,
  pickerFailed,
}: EventFieldsProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  const pickPhotos = usePickPhotos();
  // Guards against a second tap while the picker is opening.
  const pickingRef = useRef(false);
  const room = EVENT_MAX_PHOTOS - photos.length;
  const atLimit = room <= 0;

  const choose = async () => {
    // Never ask for 0: the picker reads it as the system maximum.
    if (pickingRef.current || atLimit) return;
    pickingRef.current = true;
    try {
      const picked = (await pickPhotos(room)).slice(0, room);
      if (picked.length === 0) return;
      onPhotosAdded(pickedDrafts(picked));
      // Android reads the live region; iOS needs an explicit announcement.
      if (picked.length === room && Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(PHOTO_LIMIT_MESSAGE);
      }
    } catch {
      onPickerFailed();
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(PICKER_ERROR_MESSAGE);
    } finally {
      pickingRef.current = false;
    }
  };

  const messageStyle = [styles.message, { fontSize: sizes.boxTitle, color: theme.textMain }];

  return (
    <>
      <EventPhotoGrid photos={photos} onRemove={onPhotoRemoved} />
      <BoxButton
        label={photos.length > 0 ? 'Añadir fotos' : 'Elegir fotos'}
        variant="secondary"
        disabled={atLimit}
        onPress={() => {
          void choose();
        }}
      />
      {atLimit ? (
        <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={messageStyle}>
          {PHOTO_LIMIT_MESSAGE}
        </Text>
      ) : null}
      {pickerFailed ? (
        <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={messageStyle}>
          {PICKER_ERROR_MESSAGE}
        </Text>
      ) : null}
      <View style={styles.field}>
        <FieldLabel label="Título" />
        <BoxTextField
          value={title}
          onChangeText={onTitleChange}
          accessibilityLabel="Título"
          maxLength={EVENT_TITLE_MAX_LENGTH}
        />
      </View>
      <View style={styles.field}>
        <FieldLabel label="Categoría" />
        <BoxTextField
          value={category}
          onChangeText={onCategoryChange}
          accessibilityLabel="Categoría"
          maxLength={EVENT_CATEGORY_MAX_LENGTH}
        />
        <CategorySuggestions onSelect={onCategoryChange} />
      </View>
      <View style={styles.field}>
        <FieldLabel label="Descripción" />
        <BoxTextArea
          value={description}
          onChangeText={onDescriptionChange}
          accessibilityLabel="Descripción"
          maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.sm,
  },
  message: {
    fontWeight: FontWeight.bold,
  },
});
