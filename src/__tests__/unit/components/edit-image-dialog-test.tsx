import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { AccessibilityInfo, Keyboard, Platform } from 'react-native';

import { ALT_TEXT_HINT, PICKER_ERROR_MESSAGE } from '@/components/image-fields';
import {
  DELETE_ERROR_MESSAGE,
  EDIT_SAVE_ERROR_MESSAGE,
} from '@/components/edit-dialog-frame';
import { ALT_TEXT_MAX_LENGTH, CAPTION_MAX_LENGTH } from '@/constants/limits';
import { Colors, Layout, Sizes } from '@/constants/theme';
import {
  EditImageDialogHarness,
  SEEDED_IMAGE,
  seededImageAdapters,
} from '@/test-utils/edit-image-dialog-harness';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { GatedSqlDatabase } from '@/test-utils/gated-sql-database';
import { writeFixturePhoto, type NodePhotoStore } from '@/test-utils/node-photo-store';
import { TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const button = (name: string) => screen.getByRole('button', { name });
const altField = () => screen.getByLabelText('Texto alternativo');
const captionField = () => screen.getByLabelText('Pie de foto');
const stored = () => screen.queryAllByTestId('stored-image').map((node) => node.props.children);
const STORED = `id-2.png|${SEEDED_IMAGE.altText}|${SEEDED_IMAGE.caption}`;

beforeEach(() => launch.mockReset());

async function openDialog(adapters?: AppAdapters, onClosed = jest.fn()) {
  const used = adapters ?? (await seededImageAdapters());
  await render(<EditImageDialogHarness adapters={used} onClosed={onClosed} />);
  await waitFor(() => expect(stored()).toHaveLength(1));
  await fireEvent.press(button('Abrir imagen'));
  return { onClosed, adapters: used };
}

function pickReturns(uri = writeFixturePhoto('new.png'), width = 100, height = 400) {
  launch.mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri, width, height, mimeType: 'image/png' }],
  } as never);
  return uri;
}

describe('EditImageDialog, edit step', () => {
  test('shows the stored photo and fields, keeps the keyboard closed, and the title', async () => {
    await openDialog();
    expect(screen.getByText('Editar elemento de imagen:')).toBeOnTheScreen();
    expect(screen.getByTestId('edit-image-dialog')).toBeOnTheScreen();
    expect(screen.getByRole('image', { name: 'Foto elegida' })).toBeOnTheScreen();
    expect(button('Cambiar foto')).toBeOnTheScreen();
    expect(altField()).toHaveProp('value', SEEDED_IMAGE.altText);
    expect(altField()).toHaveProp('autoFocus', false);
    expect(altField()).toHaveProp('maxLength', ALT_TEXT_MAX_LENGTH);
    expect(altField()).toHaveProp('accessibilityHint', ALT_TEXT_HINT);
    expect(captionField()).toHaveProp('value', SEEDED_IMAGE.caption);
    expect(captionField()).toHaveProp('maxLength', CAPTION_MAX_LENGTH);
    for (const name of ['Cerrar', 'Cancelar', 'Guardar', 'Borrar esta imagen']) {
      expect(button(name)).toBeOnTheScreen();
    }
  });

  test('fields without stored texts start empty', async () => {
    const adapters = await seededImageAdapters();
    await render(<EditImageDialogHarness adapters={adapters} />);
    await waitFor(() => expect(stored()).toHaveLength(1));
    // Clear both texts through the dialog, then reopen it.
    await fireEvent.press(button('Abrir imagen'));
    await fireEvent.changeText(altField(), '');
    await fireEvent.changeText(captionField(), '');
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(screen.queryByTestId('edit-image-dialog')).toBeNull());
    await fireEvent.press(button('Abrir imagen'));
    expect(altField()).toHaveProp('value', '');
    expect(captionField()).toHaveProp('value', '');
    expect(button('Guardar')).toBeDisabled();
  });

  test.each(['light', 'dark'] as const)('box and deletion button are styled in %s mode', async (scheme) => {
    setMockColorScheme(scheme);
    const colors = Colors[scheme];
    await openDialog();
    const box = screen.getByText('Editar elemento de imagen:').parent!.parent!;
    expect(box).toHaveStyle({
      backgroundColor: colors.creationBg,
      borderColor: colors.primaryBlue,
      borderWidth: Layout.borderWidth,
    });
    expect(button('Borrar esta imagen')).toHaveStyle({
      borderColor: colors.danger,
      minHeight: Layout.touchTarget,
    });
    expect(screen.getByTestId('photo-preview')).toHaveStyle({ backgroundColor: colors.imageBackdrop });
  });

  test('Guardar is disabled when unchanged or only whitespace was added', async () => {
    await openDialog();
    expect(button('Guardar')).toBeDisabled();
    await fireEvent.changeText(captionField(), `${SEEDED_IMAGE.caption}   `);
    await fireEvent.changeText(altField(), `  ${SEEDED_IMAGE.altText}`);
    expect(button('Guardar')).toBeDisabled();
  });

  test('Guardar is enabled after clearing a field or picking a new photo', async () => {
    await openDialog();
    await fireEvent.changeText(captionField(), '');
    expect(button('Guardar')).toBeEnabled();
    await fireEvent.changeText(captionField(), SEEDED_IMAGE.caption);
    expect(button('Guardar')).toBeDisabled();

    pickReturns();
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(button('Guardar')).toBeEnabled());
  });

  test('Cambiar foto changes only the dialog until Guardar, and keeps the fields', async () => {
    await openDialog();
    const uri = pickReturns();
    await fireEvent.press(button('Cambiar foto'));

    await waitFor(() =>
      expect(screen.getByTestId('photo-preview-image')).toHaveProp('source', [{ uri }]),
    );
    expect(altField()).toHaveProp('value', SEEDED_IMAGE.altText);
    expect(stored()).toEqual([STORED]);
    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ mediaTypes: 'images' }));
  });

  test('a cancelled pick changes nothing', async () => {
    await openDialog();
    launch.mockResolvedValueOnce({ canceled: true, assets: null } as never);
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(launch).toHaveBeenCalledTimes(1));
    expect(button('Guardar')).toBeDisabled();
  });

  test('a picker error shows and announces the message', async () => {
    const platform = Platform.OS;
    Platform.OS = 'ios';
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    try {
      await openDialog();
      launch.mockRejectedValueOnce(new Error('no gallery'));
      await fireEvent.press(button('Cambiar foto'));

      expect(await screen.findByText(PICKER_ERROR_MESSAGE)).toHaveProp('accessibilityLiveRegion', 'polite');
      expect(announce).toHaveBeenCalledWith(PICKER_ERROR_MESSAGE);
      expect(button('Guardar')).toBeDisabled();
    } finally {
      Platform.OS = platform;
    }
  });

  test('Guardar saves once, trims, and the stored item changes', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { onClosed, adapters } = await openDialog();
    pickReturns();
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(button('Guardar')).toBeEnabled());
    await fireEvent.changeText(captionField(), '  Taller de cerámica  ');

    await fireEvent.press(button('Guardar'));

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()).toEqual([`id-3.png|${SEEDED_IMAGE.altText}|Taller de cerámica`]);
    expect((adapters.photos as NodePhotoStore).has('id-3.png')).toBe(true);
    expect((adapters.photos as NodePhotoStore).has('id-2.png')).toBe(true);
    expect(dismiss).toHaveBeenCalled();
  });

  test('a double tap saves once', async () => {
    const seeded = await seededImageAdapters();
    const db = new GatedSqlDatabase(seeded.db);
    const adapters = { ...seeded, db };
    await openDialog(adapters);
    await fireEvent.changeText(captionField(), 'Nuevo');
    const before = db.transactions;

    const release = db.hold();
    await fireEvent.press(button('Guardar'));
    expect(button('Guardar')).toBeDisabled();
    await fireEvent.press(button('Guardar'));
    release();

    await waitFor(() => expect(screen.queryByTestId('edit-image-dialog')).toBeNull());
    expect(db.transactions - before).toBe(1);
  });

  test('a failed save keeps the edit and shows the message, and a retry works', async () => {
    let fail = true;
    const adapters = await seededImageAdapters(
      (db) => new FailingSqlDatabase(db, (sql) => fail && sql.includes('UPDATE image_items')),
    );
    const { onClosed } = await openDialog(adapters);
    pickReturns();
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(button('Guardar')).toBeEnabled());
    await fireEvent.changeText(captionField(), 'Otro pie');

    await fireEvent.press(button('Guardar'));

    expect(await screen.findByText(EDIT_SAVE_ERROR_MESSAGE)).toBeOnTheScreen();
    expect(captionField()).toHaveProp('value', 'Otro pie');
    expect(screen.getByTestId('photo-preview')).toBeOnTheScreen();
    expect(stored()).toEqual([STORED]);
    expect(button('Guardar')).toBeEnabled();
    expect(onClosed).not.toHaveBeenCalled();

    fail = false;
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()[0]).toContain('Otro pie');
  });

  test.each(['Cancelar', 'Cerrar'])('%s after a new photo keeps the old one', async (name) => {
    const { onClosed } = await openDialog();
    pickReturns();
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(button('Guardar')).toBeEnabled());

    await fireEvent.press(button(name));

    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(stored()).toEqual([STORED]);
    await fireEvent.press(button('Abrir imagen'));
    expect(button('Guardar')).toBeDisabled();
  });

  test('the controls are named by their visible text', async () => {
    await openDialog();
    expect(screen.getByText('Texto alternativo')).toBeOnTheScreen();
    expect(screen.getByText('Pie de foto')).toBeOnTheScreen();
    expect(button('Cerrar')).toHaveStyle({ width: Layout.touchTarget, height: Layout.touchTarget });
    for (const name of ['Cambiar foto', 'Cancelar', 'Guardar', 'Borrar esta imagen']) {
      expect(button(name)).toHaveStyle({ minHeight: Sizes.phone.controlHeight });
    }
  });
});

describe('EditImageDialog, confirm step', () => {
  test('Borrar esta imagen asks first, deleting nothing', async () => {
    await openDialog();
    await fireEvent.press(button('Borrar esta imagen'));

    expect(screen.getByText('¿Borrar esta imagen?')).toBeOnTheScreen();
    expect(screen.getByText('Desaparecerá de tu línea de tiempo.')).toBeOnTheScreen();
    expect(button('No, volver')).toBeOnTheScreen();
    expect(button('Sí, borrar')).toBeOnTheScreen();
    expect(stored()).toEqual([STORED]);
  });

  test('No, volver keeps the new photo and the edits', async () => {
    await openDialog();
    const uri = pickReturns();
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(button('Guardar')).toBeEnabled());
    await fireEvent.changeText(captionField(), 'Editado');

    await fireEvent.press(button('Borrar esta imagen'));
    await fireEvent.press(button('No, volver'));

    expect(screen.getByTestId('photo-preview-image')).toHaveProp('source', [{ uri }]);
    expect(captionField()).toHaveProp('value', 'Editado');
    expect(stored()).toEqual([STORED]);
  });

  test('Sí, borrar removes the item and keeps its photo files', async () => {
    const { onClosed, adapters } = await openDialog();
    await fireEvent.press(button('Borrar esta imagen'));
    await fireEvent.press(button('Sí, borrar'));

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()).toEqual([]);
    expect((adapters.photos as NodePhotoStore).has('id-2.png')).toBe(true);
  });

  test('a failed deletion stays in the step with the message', async () => {
    const adapters = await seededImageAdapters(
      (db) => new FailingSqlDatabase(db, (sql) => sql.includes('DELETE FROM image_items')),
    );
    await openDialog(adapters);
    await fireEvent.press(button('Borrar esta imagen'));
    await fireEvent.press(button('Sí, borrar'));

    expect(await screen.findByText(DELETE_ERROR_MESSAGE)).toBeOnTheScreen();
    expect(screen.getByText('¿Borrar esta imagen?')).toBeOnTheScreen();
    expect(stored()).toEqual([STORED]);
  });
});

describe('EditImageDialog, tablet layout', () => {
  test('uses the tablet sizes', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await openDialog();
    expect(captionField()).toHaveStyle({ minHeight: Sizes.tablet.controlHeight });
    expect(screen.getByText('Texto alternativo')).toHaveStyle({ fontSize: Sizes.tablet.fieldLabel });
  });
});
