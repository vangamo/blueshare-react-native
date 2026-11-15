import { useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';

import { AvatarImage } from '@/components/avatar-image';
import { BoxButton } from '@/components/box-button';
import { BoxTextField } from '@/components/box-text-field';
import {
  EDIT_SAVE_ERROR_MESSAGE,
  EditDialogFrame,
} from '@/components/edit-dialog-frame';
import { FieldLabel } from '@/components/field-label';
import { PICKER_ERROR_MESSAGE } from '@/components/image-fields';
import { PROFILE_NAME_MAX_LENGTH } from '@/constants/limits';
import { FontWeight, Layout, Spacing } from '@/constants/theme';
import { usePhotoUriFor } from '@/hooks/use-photo-uri';
import { usePickPhoto } from '@/hooks/use-pick-photo';
import { InvalidProfileError, useProfile, type AvatarInput } from '@/hooks/use-profile';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

export const PROFILE_TITLE = 'Editar perfil:';
export const NAME_HINT = 'Tu nombre completo o cómo te llaman.';
export const NAME_REQUIRED_MESSAGE = '⚠️ Escribe tu nombre.';
export const AVATAR_UNUSABLE_MESSAGE = '⚠️ No se pudo usar esa foto. Elige otra.';
export const PROFILE_LOAD_ERROR_MESSAGE = '⚠️ No se pudo cargar tu perfil.';

type ProfileDialogProps = {
  /** Closes the dialog. The parent stops rendering it, so each open starts from the saved profile. */
  onClose: () => void;
};

function saveErrorMessage(error: unknown): string {
  if (error instanceof InvalidProfileError) {
    return error.field === 'name' ? NAME_REQUIRED_MESSAGE : AVATAR_UNUSABLE_MESSAGE;
  }
  return EDIT_SAVE_ERROR_MESSAGE;
}

/**
 * Dialog over the whole app to change the user's name and avatar photo, opened from the
 * header avatar, in the shared [`EditDialogFrame`]. It asks before discarding changes and has
 * a "Compartir por Bluetooth" button that does nothing yet. Render it with a fresh `key` on
 * every open.
 */
export function ProfileDialog({ onClose }: ProfileDialogProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  const { status, profile, updateProfile } = useProfile();
  const uriFor = usePhotoUriFor();
  const pickPhoto = usePickPhoto();
  const [name, setName] = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState<AvatarInput>({ kind: 'keep' });
  const [pickerFailed, setPickerFailed] = useState(false);
  // Guards against a second tap while the picker is opening.
  const pickingRef = useRef(false);

  if (status === 'error' || !profile) {
    return (
      <EditDialogFrame
        testID="profile-dialog"
        title={PROFILE_TITLE}
        editable={false}
        canSave={false}
        onSave={async () => undefined}
        onClose={onClose}>
        {() => (
          <Text
            accessibilityRole="alert"
            style={[styles.message, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
            {PROFILE_LOAD_ERROR_MESSAGE}
          </Text>
        )}
      </EditDialogFrame>
    );
  }

  const previewUri =
    avatar.kind === 'picked'
      ? avatar.photo.uri
      : avatar.kind === 'keep' && profile.avatar
        ? uriFor(profile.avatar.file)
        : null;
  const canSave = name.trim() !== (profile.name ?? '') || avatar.kind !== 'keep';

  return (
    <EditDialogFrame
      testID="profile-dialog"
      title={PROFILE_TITLE}
      confirmDiscard
      saveErrorMessage={saveErrorMessage}
      canSave={canSave}
      onSave={() => updateProfile({ name, avatar })}
      onClose={onClose}
      footer={
        // Bluetooth sharing arrives in Phase 4: for now the button does nothing.
        <BoxButton label="Compartir por Bluetooth" variant="secondary" onPress={() => {}} />
      }>
      {({ clearError }) => {
        const choose = async () => {
          if (pickingRef.current) return;
          pickingRef.current = true;
          try {
            const photo = await pickPhoto();
            if (photo) {
              setAvatar({ kind: 'picked', photo });
              setPickerFailed(false);
              clearError();
            }
          } catch {
            setPickerFailed(true);
            // Android reads the live region; iOS needs an explicit announcement.
            if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(PICKER_ERROR_MESSAGE);
          } finally {
            pickingRef.current = false;
          }
        };

        return (
          <>
            <View style={styles.preview}>
              <AvatarImage
                uri={previewUri}
                size={sizes.profileAvatar}
                emojiSize={sizes.profileAvatarEmoji}
                label={previewUri ? 'Foto de perfil' : 'Sin foto de perfil'}
              />
            </View>
            <View style={styles.photoButtons}>
              <BoxButton
                label={previewUri ? 'Cambiar foto' : 'Elegir foto'}
                variant="secondary"
                style={styles.photoButton}
                onPress={() => {
                  void choose();
                }}
              />
              {previewUri ? (
                <BoxButton
                  label="Quitar foto"
                  variant="secondary"
                  style={styles.photoButton}
                  onPress={() => {
                    // Removing a photo the profile never had is no change at all.
                    setAvatar(profile.avatar ? { kind: 'remove' } : { kind: 'keep' });
                    setPickerFailed(false);
                    clearError();
                  }}
                />
              ) : null}
            </View>
            {pickerFailed ? (
              <Text
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={[styles.message, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
                {PICKER_ERROR_MESSAGE}
              </Text>
            ) : null}
            <View style={styles.field}>
              <FieldLabel label="Nombre" hint={NAME_HINT} />
              <BoxTextField
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setPickerFailed(false);
                  clearError();
                }}
                accessibilityLabel="Nombre"
                accessibilityHint={NAME_HINT}
                maxLength={PROFILE_NAME_MAX_LENGTH}
                autoCapitalize="words"
              />
            </View>
          </>
        );
      }}
    </EditDialogFrame>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Layout.creationGap,
  },
  photoButton: {
    flex: 1,
  },
  field: {
    gap: Spacing.sm,
  },
  message: {
    fontWeight: FontWeight.bold,
  },
});
