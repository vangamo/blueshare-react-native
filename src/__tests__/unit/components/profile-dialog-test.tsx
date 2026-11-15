import { launchImageLibraryAsync } from 'expo-image-picker';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Keyboard, Platform, StyleSheet } from 'react-native';

import { DISCARD_TEXT, DISCARD_TITLE, EDIT_SAVE_ERROR_MESSAGE } from '@/components/edit-dialog-frame';
import { PICKER_ERROR_MESSAGE } from '@/components/image-fields';
import {
  AVATAR_UNUSABLE_MESSAGE,
  NAME_HINT,
  NAME_REQUIRED_MESSAGE,
  PROFILE_LOAD_ERROR_MESSAGE,
  PROFILE_TITLE,
} from '@/components/profile-dialog';
import { PROFILE_NAME_MAX_LENGTH } from '@/constants/limits';
import { Colors, Layout, Sizes } from '@/constants/theme';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { GatedSqlDatabase } from '@/test-utils/gated-sql-database';
import { writeFixturePhoto } from '@/test-utils/node-photo-store';
import { cancelledPick, pickedResult } from '@/test-utils/picker-assets';
import { ProfileDialogHarness, profileAdapters } from '@/test-utils/profile-dialog-harness';
import { setMockColorScheme } from '@/test-utils/test-values';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const button = (name: string) => screen.getByRole('button', { name });
const queryButton = (name: string) => screen.queryByRole('button', { name });
const nameField = () => screen.getByLabelText('Nombre');
const back = () => fireEvent(screen.getByTestId('profile-dialog'), 'requestClose');
const savedRow = async (adapters: { raw: { getFirst: <T>(sql: string) => Promise<T | null> } }) =>
  adapters.raw.getFirst<{ display_name: string | null; avatar_file: string | null }>(
    'SELECT display_name, avatar_file FROM people WHERE is_me = 1',
  );

async function open(options: Parameters<typeof profileAdapters>[0] = {}) {
  const adapters = await profileAdapters(options);
  const onClose = jest.fn();
  await render(<ProfileDialogHarness adapters={adapters} onClose={onClose} />);
  await screen.findByText(PROFILE_TITLE);
  return { adapters, onClose };
}

const photo = () => ({ uri: writeFixturePhoto(), width: 300, height: 200, mimeType: 'image/png' });

beforeEach(() => launch.mockReset());

describe('ProfileDialog form', () => {
  test('a profile with no photo shows the emoji, "Elegir foto" and no "Quitar foto"', async () => {
    await open();
    expect(screen.getByText(PROFILE_TITLE)).toBeOnTheScreen();
    expect(nameField()).toHaveProp('value', '');
    expect(nameField().props.autoFocus).toBeFalsy();
    expect(screen.getByTestId('avatar-image-emoji')).toBeOnTheScreen();
    expect(screen.getByRole('image', { name: 'Sin foto de perfil' })).toBeOnTheScreen();
    for (const name of ['Cerrar', 'Elegir foto', 'Cancelar', 'Guardar', 'Compartir por Bluetooth']) {
      expect(button(name)).toBeOnTheScreen();
    }
    expect(queryButton('Quitar foto')).toBeNull();
    // The hint is hidden from screen readers on purpose: the field's accessibilityHint carries it.
    expect(screen.getByText(NAME_HINT, { includeHiddenElements: true })).toBeOnTheScreen();
  });

  test('a saved profile starts with its name and photo, "Cambiar foto" and "Quitar foto"', async () => {
    await open({ name: 'Abuela Carmen', avatar: photo() });
    expect(nameField()).toHaveProp('value', 'Abuela Carmen');
    expect(screen.getByRole('image', { name: 'Foto de perfil' })).toBeOnTheScreen();
    expect(screen.getByTestId('avatar-image-photo')).toBeOnTheScreen();
    expect(button('Cambiar foto')).toBeOnTheScreen();
    expect(button('Quitar foto')).toBeOnTheScreen();
  });

  test('the name field is limited, capitalizes words and has a label and a hint', async () => {
    await open();
    expect(nameField()).toHaveProp('maxLength', PROFILE_NAME_MAX_LENGTH);
    expect(nameField()).toHaveProp('autoCapitalize', 'words');
    expect(nameField()).toHaveProp('accessibilityHint', NAME_HINT);
  });

  test.each(['light', 'dark'] as const)('the preview uses the %s avatar colors', async (scheme) => {
    setMockColorScheme(scheme);
    await open();
    expect(screen.getByTestId('avatar-image')).toHaveStyle({
      width: Sizes.phone.profileAvatar,
      backgroundColor: Colors[scheme].avatarBg,
      borderColor: Colors[scheme].primaryDark,
    });
  });
});

describe('ProfileDialog Guardar enabled state', () => {
  test('is disabled and announced as disabled with no change', async () => {
    await open({ name: 'Carmen' });
    expect(button('Guardar')).toBeDisabled();
    expect(button('Guardar')).toHaveProp('accessibilityState', { disabled: true });
  });

  test('stays disabled when only spaces are added', async () => {
    await open({ name: 'Carmen' });
    await fireEvent.changeText(nameField(), '  Carmen  ');
    expect(button('Guardar')).toBeDisabled();
  });

  test('is enabled by a new name, a picked photo, or a removed photo', async () => {
    await open({ name: 'Carmen', avatar: photo() });
    await fireEvent.changeText(nameField(), 'Abuela');
    expect(button('Guardar')).toBeEnabled();
    await fireEvent.changeText(nameField(), 'Carmen');
    expect(button('Guardar')).toBeDisabled();

    await fireEvent.press(button('Quitar foto'));
    expect(button('Guardar')).toBeEnabled();
  });

  test('a picked photo enables it without touching the name', async () => {
    await open({ name: 'Carmen' });
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));
    await waitFor(() => expect(button('Guardar')).toBeEnabled());
  });

  test('picking and then removing a photo the profile never had is no change', async () => {
    await open({ name: 'Carmen' });
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Quitar foto' }));
    expect(button('Guardar')).toBeDisabled();
    expect(screen.getByTestId('avatar-image-emoji')).toBeOnTheScreen();
  });
});

describe('ProfileDialog photo', () => {
  test('a picked photo replaces the preview and nothing is saved yet', async () => {
    const { adapters } = await open({ name: 'Carmen' });
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));

    expect(await screen.findByTestId('avatar-image-photo')).toBeOnTheScreen();
    expect(button('Cambiar foto')).toBeOnTheScreen();
    expect(button('Quitar foto')).toBeOnTheScreen();
    expect((await savedRow(adapters))?.avatar_file).toBeNull();
  });

  test('cancelling the picker changes nothing', async () => {
    await open({ name: 'Carmen' });
    launch.mockResolvedValueOnce(cancelledPick);
    await fireEvent.press(button('Elegir foto'));
    await waitFor(() => expect(launch).toHaveBeenCalledTimes(1));
    expect(button('Elegir foto')).toBeOnTheScreen();
    expect(button('Guardar')).toBeDisabled();
  });

  test('a picker failure shows the gallery message and keeps the preview', async () => {
    await open({ name: 'Carmen' });
    launch.mockRejectedValueOnce(new Error('no gallery'));
    await fireEvent.press(button('Elegir foto'));
    expect(await screen.findByText(PICKER_ERROR_MESSAGE)).toBeOnTheScreen();
    expect(screen.getByTestId('avatar-image-emoji')).toBeOnTheScreen();
  });

  test('on iOS the picker failure is announced', async () => {
    const original = Platform.OS;
    Platform.OS = 'ios';
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    try {
      await open();
      launch.mockRejectedValueOnce(new Error('x'));
      await fireEvent.press(button('Elegir foto'));
      await screen.findByText(PICKER_ERROR_MESSAGE);
      expect(announce).toHaveBeenCalledWith(PICKER_ERROR_MESSAGE);
    } finally {
      Platform.OS = original;
    }
  });

  test('"Quitar foto" shows the emoji and the header avatar still has the saved photo until Guardar', async () => {
    const { adapters } = await open({ name: 'Carmen', avatar: photo() });
    await fireEvent.press(button('Quitar foto'));
    expect(screen.getByTestId('avatar-image-emoji')).toBeOnTheScreen();
    expect(button('Elegir foto')).toBeOnTheScreen();
    expect(queryButton('Quitar foto')).toBeNull();
    expect((await savedRow(adapters))?.avatar_file).not.toBeNull();
  });
});

describe('ProfileDialog saving', () => {
  test('saves the trimmed name and the picked photo, then closes', async () => {
    const { adapters, onClose } = await open();
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));
    await screen.findByTestId('avatar-image-photo');
    await fireEvent.changeText(nameField(), '  Abuela Carmen ');
    await fireEvent.press(button('Guardar'));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    const row = await savedRow(adapters);
    expect(row?.display_name).toBe('Abuela Carmen');
    expect(row?.avatar_file).toMatch(/\.png$/);
  });

  test('removing the photo and saving clears it', async () => {
    const { adapters, onClose } = await open({ name: 'Carmen', avatar: photo() });
    await fireEvent.press(button('Quitar foto'));
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect((await savedRow(adapters))?.avatar_file).toBeNull();
  });

  test('closes the keyboard when it closes', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await open({ name: 'Carmen' });
    await fireEvent.changeText(nameField(), 'Abuela');
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(dismiss).toHaveBeenCalled());
  });

  test('an empty name keeps the edits, shows the message and saves nothing', async () => {
    const { adapters, onClose } = await open();
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));
    await screen.findByTestId('avatar-image-photo');
    await fireEvent.press(button('Guardar'));

    expect(await screen.findByText(NAME_REQUIRED_MESSAGE)).toBeOnTheScreen();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('avatar-image-photo')).toBeOnTheScreen();
    expect((await savedRow(adapters))?.avatar_file).toBeNull();
  });

  test('a name erased after being saved shows the message', async () => {
    await open({ name: 'Carmen' });
    await fireEvent.changeText(nameField(), '   ');
    await fireEvent.press(button('Guardar'));
    expect(await screen.findByText(NAME_REQUIRED_MESSAGE)).toBeOnTheScreen();
    await fireEvent.changeText(nameField(), 'Ana');
    expect(screen.queryByText(NAME_REQUIRED_MESSAGE)).toBeNull();
  });

  test('a photo that cannot be copied shows the unusable-photo message', async () => {
    const { adapters, onClose } = await open({ name: 'Carmen' });
    launch.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: '/no/such/photo.png', width: 10, height: 10, mimeType: 'image/png' }],
    } as never);
    await fireEvent.press(button('Elegir foto'));
    await screen.findByTestId('avatar-image-photo');
    await fireEvent.press(button('Guardar'));

    expect(await screen.findByText(AVATAR_UNUSABLE_MESSAGE)).toBeOnTheScreen();
    expect(onClose).not.toHaveBeenCalled();
    expect((await savedRow(adapters))?.avatar_file).toBeNull();
  });

  test('a storage failure shows the save message and a retry can succeed', async () => {
    let failing = true;
    const adapters = await profileAdapters({
      name: 'Carmen',
      wrap: (db) => new FailingSqlDatabase(db, (sql) => failing && sql.includes('UPDATE people')),
    });
    const onClose = jest.fn();
    await render(<ProfileDialogHarness adapters={adapters} onClose={onClose} />);
    await screen.findByText(PROFILE_TITLE);
    await fireEvent.changeText(nameField(), 'Abuela');
    await fireEvent.press(button('Guardar'));
    expect(await screen.findByText(EDIT_SAVE_ERROR_MESSAGE)).toBeOnTheScreen();
    expect(nameField()).toHaveProp('value', 'Abuela');

    failing = false;
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect((await savedRow(adapters))?.display_name).toBe('Abuela');
  });

  test('a double tap saves once', async () => {
    const adapters = await profileAdapters({ name: 'Carmen', wrap: (db) => new GatedSqlDatabase(db) });
    const gated = adapters.db as GatedSqlDatabase;
    const onClose = jest.fn();
    await render(<ProfileDialogHarness adapters={adapters} onClose={onClose} />);
    await screen.findByText(PROFILE_TITLE);
    await fireEvent.changeText(nameField(), 'Abuela');
    const before = gated.transactions;
    const release = gated.hold();

    await fireEvent.press(button('Guardar'));
    await fireEvent.press(button('Guardar'));
    release();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(gated.transactions - before).toBe(1);
  });
});

describe('ProfileDialog closing', () => {
  test.each([
    ['Cancelar', () => fireEvent.press(button('Cancelar'))],
    ['Cerrar', () => fireEvent.press(button('Cerrar'))],
    ['back', () => back()],
  ])('%s with no changes closes at once', async (_name, trigger) => {
    const { onClose } = await open({ name: 'Carmen' });
    await trigger();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['Cancelar', () => fireEvent.press(button('Cancelar'))],
    ['Cerrar', () => fireEvent.press(button('Cerrar'))],
    ['back', () => back()],
  ])('%s with changes asks before discarding', async (_name, trigger) => {
    const { onClose } = await open({ name: 'Carmen' });
    await fireEvent.changeText(nameField(), 'Abuela');
    await trigger();

    expect(screen.getByText(DISCARD_TITLE)).toBeOnTheScreen();
    expect(screen.getByText(DISCARD_TEXT)).toBeOnTheScreen();
    expect(button('No, volver')).toBeOnTheScreen();
    expect(button('Sí, descartar')).toBeOnTheScreen();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('"Sí, descartar" closes and saves nothing', async () => {
    const { adapters, onClose } = await open({ name: 'Carmen' });
    await fireEvent.changeText(nameField(), 'Abuela');
    await fireEvent.press(button('Cancelar'));
    await fireEvent.press(button('Sí, descartar'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect((await savedRow(adapters))?.display_name).toBe('Carmen');
  });

  test('"No, volver" and back return to the form with the edits kept', async () => {
    await open({ name: 'Carmen' });
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));
    await screen.findByTestId('avatar-image-photo');
    await fireEvent.changeText(nameField(), 'Abuela');

    for (const undo of [() => fireEvent.press(button('No, volver')), () => back()]) {
      await fireEvent.press(button('Cancelar'));
      await undo();
      expect(nameField()).toHaveProp('value', 'Abuela');
      expect(screen.getByTestId('avatar-image-photo')).toBeOnTheScreen();
    }
  });

  test('tapping the overlay does nothing', async () => {
    const { onClose } = await open({ name: 'Carmen' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('profile-dialog')).toBeOnTheScreen();
  });
});

describe('ProfileDialog Bluetooth placeholder', () => {
  test('pressing it does nothing and keeps the edits', async () => {
    const { onClose } = await open({ name: 'Carmen' });
    await fireEvent.changeText(nameField(), 'Abuela');
    await fireEvent.press(button('Compartir por Bluetooth'));
    expect(nameField()).toHaveProp('value', 'Abuela');
    expect(screen.queryByText(DISCARD_TITLE)).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('ProfileDialog when the profile cannot be loaded', () => {
  test('shows only the title, the message and Cancelar, and Cancelar closes', async () => {
    const adapters = await profileAdapters({
      name: 'Carmen',
      wrap: (db) => new FailingSqlDatabase(db, (sql) => sql.includes('is_me = 1')),
    });
    const onClose = jest.fn();
    await render(<ProfileDialogHarness adapters={adapters} onClose={onClose} />);

    expect(await screen.findByText(PROFILE_LOAD_ERROR_MESSAGE)).toBeOnTheScreen();
    expect(screen.getByText(PROFILE_TITLE)).toBeOnTheScreen();
    expect(screen.queryByLabelText('Nombre')).toBeNull();
    expect(queryButton('Guardar')).toBeNull();
    expect(queryButton('Compartir por Bluetooth')).toBeNull();
    await fireEvent.press(button('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ProfileDialog accessibility', () => {
  test('every control has a role, a label equal to its text and a 44-point target', async () => {
    await open({ name: 'Carmen', avatar: photo() });
    for (const name of [
      'Cerrar',
      'Cambiar foto',
      'Quitar foto',
      'Cancelar',
      'Guardar',
      'Compartir por Bluetooth',
    ]) {
      expect(button(name)).toHaveProp('accessibilityLabel', name);
    }
    for (const name of ['Cambiar foto', 'Quitar foto', 'Cancelar', 'Guardar', 'Compartir por Bluetooth']) {
      expect(button(name)).toHaveStyle({ minHeight: Sizes.phone.controlHeight });
    }
    expect(Sizes.phone.controlHeight).toBeGreaterThanOrEqual(Layout.touchTarget);
    expect(StyleSheet.flatten(nameField().props.style).minHeight).toBeGreaterThanOrEqual(Layout.touchTarget);
    expect(screen.getByLabelText('Cerrar')).toBeOnTheScreen();
  });

  test('the message for an empty name is announced as an alert', async () => {
    await open({ name: 'Carmen' });
    await fireEvent.changeText(nameField(), '  ');
    await fireEvent.press(button('Guardar'));
    expect(await screen.findByRole('alert')).toHaveTextContent(NAME_REQUIRED_MESSAGE);
  });
});
