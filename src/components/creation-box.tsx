import { useRef } from 'react';
import { AccessibilityInfo, Keyboard, Platform, StyleSheet, Text, View } from 'react-native';

import { BoxButton } from '@/components/box-button';
import { BoxTextArea } from '@/components/box-text-area';
import { EventFields } from '@/components/event-fields';
import { ImageFields } from '@/components/image-fields';
import { TypeSelect } from '@/components/type-select';
import { FontWeight, Layout } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useCreationBox } from '@/hooks/use-creation-box';
import { useTheme } from '@/hooks/use-theme';
import { useTimeline } from '@/hooks/use-timeline';

export const SAVE_ERROR_MESSAGE = '⚠️ No se pudo guardar. Inténtalo de nuevo.';

/**
 * Inline box at the top of the Timeline for creating an item. Choose step: type
 * select, Cancelar and Guardar. Write step (Texto): text area, Cancelar and Crear.
 * Image step (Imagen): photo, alternative text and caption, Cancelar and Crear. Event
 * step (Evento): photos, title, category and description, Cancelar and Crear.
 * Renders nothing while closed. Its state lives in `CreationBoxProvider`.
 */
export function CreationBox() {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  const { box, dispatch } = useCreationBox();
  const { createText, createImage, createEvent } = useTimeline();
  // Guards against a second tap landing before the "saving" render.
  const savingRef = useRef(false);

  if (box.step === 'closed') return null;

  const cancel = () => {
    Keyboard.dismiss();
    dispatch({ type: 'close' });
  };

  const save = async (create: () => Promise<unknown>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    dispatch({ type: 'saveStarted' });
    try {
      await create();
      Keyboard.dismiss();
      dispatch({ type: 'close' });
    } catch {
      dispatch({ type: 'saveFailed' });
      // Android reads the live region; iOS needs an explicit announcement.
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(SAVE_ERROR_MESSAGE);
    } finally {
      savingRef.current = false;
    }
  };

  const boxStyle = [
    styles.box,
    {
      borderRadius: sizes.cardRadius,
      padding: sizes.cardPadding,
      marginBottom: sizes.itemGap,
      backgroundColor: theme.creationBg,
      borderColor: theme.primaryBlue,
    },
  ];
  const titleStyle = [styles.title, { fontSize: sizes.boxTitle, color: theme.textMain }];

  if (box.step === 'choose') {
    return (
      <View style={boxStyle} testID="creation-box">
        <Text style={titleStyle}>Crear nuevo elemento:</Text>
        <TypeSelect
          value={box.type}
          onChange={(itemType) => dispatch({ type: 'chooseType', itemType })}
        />
        <View style={styles.buttons}>
          <BoxButton label="Cancelar" variant="secondary" onPress={cancel} style={styles.button} />
          <BoxButton
            label="Guardar"
            variant="primary"
            disabled={box.type === null}
            onPress={() => dispatch({ type: 'confirmType' })}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  if (box.step === 'image') {
    const { photo } = box;
    return (
      <View style={boxStyle} testID="creation-box">
        <Text style={titleStyle}>Crear nuevo elemento de imagen:</Text>
        <ImageFields
          photo={photo}
          altText={box.altText}
          caption={box.caption}
          onAltTextChange={(text) => dispatch({ type: 'setAltText', text })}
          onCaptionChange={(text) => dispatch({ type: 'setCaption', text })}
          onPhotoPicked={(picked) => dispatch({ type: 'photoPicked', photo: picked })}
          onPickerFailed={() => dispatch({ type: 'pickerFailed' })}
          pickerFailed={box.error === 'picker'}
        />
        {box.error === 'save' ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[styles.error, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
            {SAVE_ERROR_MESSAGE}
          </Text>
        ) : null}
        <View style={styles.buttons}>
          <BoxButton label="Cancelar" variant="secondary" onPress={cancel} style={styles.button} />
          <BoxButton
            label="Crear"
            variant="primary"
            disabled={!photo || box.saving}
            onPress={() => {
              if (!photo) return;
              void save(() =>
                createImage({ photo, altText: box.altText, caption: box.caption }),
              );
            }}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  if (box.step === 'event') {
    const { photos, title, category, description } = box;
    const canCreateEvent =
      photos.length >= 1 && title.trim().length > 0 && category.trim().length > 0 && !box.saving;
    return (
      <View style={boxStyle} testID="creation-box">
        <Text style={titleStyle}>Crear nuevo elemento de evento:</Text>
        <EventFields
          photos={photos}
          title={title}
          category={category}
          description={description}
          onPhotosAdded={(added) => dispatch({ type: 'photosAdded', photos: added })}
          onPhotoRemoved={(key) => dispatch({ type: 'photoRemoved', key })}
          onTitleChange={(text) => dispatch({ type: 'setTitle', text })}
          onCategoryChange={(text) => dispatch({ type: 'setCategory', text })}
          onDescriptionChange={(text) => dispatch({ type: 'setDescription', text })}
          onPickerFailed={() => dispatch({ type: 'pickerFailed' })}
          pickerFailed={box.error === 'picker'}
        />
        {box.error === 'save' ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[styles.error, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
            {SAVE_ERROR_MESSAGE}
          </Text>
        ) : null}
        <View style={styles.buttons}>
          <BoxButton label="Cancelar" variant="secondary" onPress={cancel} style={styles.button} />
          <BoxButton
            label="Crear"
            variant="primary"
            disabled={!canCreateEvent}
            onPress={() => {
              void save(() =>
                createEvent({
                  // The step only holds picked photos; they are copied now.
                  photos: photos.flatMap((draft) => (draft.kind === 'picked' ? [draft.photo] : [])),
                  title,
                  category,
                  description,
                }),
              );
            }}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  const canCreate = box.text.trim().length > 0 && !box.saving;

  return (
    <View style={boxStyle} testID="creation-box">
      <Text style={titleStyle}>Crear nuevo elemento de texto:</Text>
      <BoxTextArea
        value={box.text}
        onChangeText={(text) => dispatch({ type: 'setText', text })}
        // Mounts only when entering this step, so returning from another tab
        // (the screen stays mounted) doesn't refocus it.
        autoFocus
        accessibilityLabel="Crear nuevo elemento de texto"
      />
      {box.failed ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.error, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
          {SAVE_ERROR_MESSAGE}
        </Text>
      ) : null}
      <View style={styles.buttons}>
        <BoxButton label="Cancelar" variant="secondary" onPress={cancel} style={styles.button} />
        <BoxButton
          label="Crear"
          variant="primary"
          disabled={!canCreate}
          onPress={() => {
            void save(() => createText(box.text));
          }}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: Layout.borderWidth,
    borderStyle: 'dashed',
    gap: Layout.creationGap,
  },
  title: {
    fontWeight: FontWeight.bold,
  },
  error: {
    fontWeight: FontWeight.bold,
  },
  buttons: {
    flexDirection: 'row',
    gap: Layout.creationGap,
  },
  button: {
    flex: 1,
  },
});
