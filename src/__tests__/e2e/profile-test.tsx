import { launchImageLibraryAsync } from 'expo-image-picker';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';

import { DISCARD_TITLE } from '@/components/edit-dialog-frame';
import { NAME_REQUIRED_MESSAGE, PROFILE_TITLE } from '@/components/profile-dialog';
import * as appAdapters from '@/items/infrastructure/app-adapters';
import { pickedResult } from '@/test-utils/picker-assets';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';
import { journey } from '@/test-utils/timeline-journey';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

// The first journey also pays for transforming the whole app on a cold cache.
jest.setTimeout(15_000);

const { button } = journey;
const nameField = () => screen.getByLabelText('Nombre');
const profileButton = () => screen.findByRole('button', { name: 'Profile' });
const openProfile = async () => {
  await fireEvent.press(await profileButton());
  await screen.findByText(PROFILE_TITLE);
};
/** The photo in the header's avatar button (the dialog has its own preview). */
const headerPhoto = () =>
  within(screen.getByRole('button', { name: 'Profile', includeHiddenElements: true })).queryByTestId(
    'avatar-image-photo',
    { includeHiddenElements: true },
  );

/** Captures the adapters the next app render uses, so a test can look inside them or render again on them. */
function captureAdapters() {
  const adapters = appAdapters.createAppAdapters();
  jest.spyOn(appAdapters, 'createAppAdapters').mockReturnValue(adapters);
  return adapters;
}

beforeEach(() => launch.mockReset());

describe('the profile journey', () => {
  test('saving a name and a photo from Circles returns to Circles with the photo in the header', async () => {
    await renderRouter('./src/app', { initialUrl: '/circles' });
    expect(headerPhoto()).toBeNull();

    await openProfile();
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));
    await screen.findByRole('image', { name: 'Foto de perfil' });
    await fireEvent.changeText(nameField(), '  Abuela Carmen ');
    await fireEvent.press(button('Guardar'));

    await waitFor(() => expect(screen.queryByText(PROFILE_TITLE)).toBeNull());
    expect(screen).toHavePathname('/circles');
    expect(screen.getByRole('tab', { name: 'Circles' })).toBeSelected();
    expect(headerPhoto()).toBeOnTheScreen();

    await openProfile();
    expect(nameField()).toHaveProp('value', 'Abuela Carmen');
  });

  test('cancelling with no changes keeps the Timeline and its creation box draft', async () => {
    await renderRouter('./src/app');
    await journey.startText();
    await fireEvent.changeText(journey.textArea(), 'Borrador');

    await openProfile();
    // The creation box has its own Cancelar behind the dialog.
    await fireEvent.press(
      within(screen.getByTestId('profile-dialog')).getByRole('button', { name: 'Cancelar' }),
    );

    await waitFor(() => expect(screen.queryByText(PROFILE_TITLE)).toBeNull());
    expect(screen).toHavePathname('/');
    expect(journey.textArea()).toHaveProp('value', 'Borrador');
  });

  test('back asks before discarding, "No, volver" keeps the edit, "Sí, descartar" drops it', async () => {
    await renderRouter('./src/app');
    await openProfile();
    await fireEvent.changeText(nameField(), 'Carmen');

    await fireEvent(screen.getByTestId('profile-dialog'), 'requestClose');
    expect(screen.getByText(DISCARD_TITLE)).toBeOnTheScreen();

    await fireEvent.press(button('No, volver'));
    expect(nameField()).toHaveProp('value', 'Carmen');

    await fireEvent.press(button('Cancelar'));
    await fireEvent.press(button('Sí, descartar'));
    await waitFor(() => expect(screen.queryByText(PROFILE_TITLE)).toBeNull());

    // Reopening shows the saved (empty) profile, not the discarded edit.
    await openProfile();
    expect(nameField()).toHaveProp('value', '');
    expect(headerPhoto()).toBeNull();
  });

  test('a photo without a name stays open with the message and saves nothing', async () => {
    const adapters = captureAdapters();
    await renderRouter('./src/app');
    await openProfile();
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));
    await screen.findByRole('image', { name: 'Foto de perfil' });
    await fireEvent.press(button('Guardar'));

    expect(await screen.findByText(NAME_REQUIRED_MESSAGE)).toBeOnTheScreen();
    expect(screen.getByText(PROFILE_TITLE)).toBeOnTheScreen();
    expect(headerPhoto()).toBeNull();
    expect(await adapters.db.getFirst('SELECT display_name FROM people WHERE is_me = 1')).toEqual({
      display_name: null,
    });
  });

  test('after a restart the saved name and photo are back, with the same UUID', async () => {
    const adapters = captureAdapters();
    const first = await renderRouter('./src/app');
    await openProfile();
    launch.mockResolvedValueOnce(pickedResult(1));
    await fireEvent.press(button('Elegir foto'));
    await screen.findByRole('image', { name: 'Foto de perfil' });
    await fireEvent.changeText(nameField(), 'Carmen');
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(screen.queryByText(PROFILE_TITLE)).toBeNull());
    const uuid = await adapters.db.getFirst<{ id: string }>('SELECT id FROM people WHERE is_me = 1');

    await act(async () => first.unmount());
    await renderRouter('./src/app');
    await waitFor(() => expect(headerPhoto()).toBeOnTheScreen());
    await openProfile();

    expect(nameField()).toHaveProp('value', 'Carmen');
    expect(await adapters.db.getAll('SELECT id FROM people')).toEqual([uuid]);
  });

  test('on a tablet the dialog is as wide as the content column, not the screen', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await renderRouter('./src/app');
    await openProfile();
    const box = screen.getByText(PROFILE_TITLE).parent!.parent!;
    expect(box).toHaveStyle({ width: 500 });
  });
});
