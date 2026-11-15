import { launchImageLibraryAsync } from 'expo-image-picker';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { DISCARD_TITLE } from '@/components/edit-dialog-frame';
import { Frames, Sizes } from '@/constants/theme';
import { pickedResult } from '@/test-utils/picker-assets';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';
import { journey } from '@/test-utils/timeline-journey';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const { button, textArea } = journey;
const rotate = (window: (typeof TEST_WINDOWS)[keyof typeof TEST_WINDOWS]) =>
  act(async () => setMockWindow(window));
const tabList = () => screen.getByRole('tab', { name: 'Circles' }).parent!;

describe('rotating mid-task', () => {
  test('typing in the creation box: text and the same text input survive both rotations', async () => {
    await renderRouter('./src/app');
    await journey.startText();
    await fireEvent.changeText(textArea(), 'Hola');
    const input = textArea();

    await rotate(TEST_WINDOWS.phoneLandscape);
    expect(textArea()).toBe(input);
    expect(textArea()).toHaveProp('value', 'Hola');

    await rotate(TEST_WINDOWS.phonePortrait);
    expect(textArea()).toBe(input);
    expect(textArea()).toHaveProp('value', 'Hola');
  });

  test('an open edit dialog keeps its step and changed text', async () => {
    await renderRouter('./src/app');
    await journey.createText('Antiguo');
    await fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    await fireEvent.changeText(screen.getByLabelText('Editar elemento de texto'), 'Cambiado');
    const input = screen.getByLabelText('Editar elemento de texto');

    await rotate(TEST_WINDOWS.phoneLandscape);
    expect(screen.getByLabelText('Editar elemento de texto')).toBe(input);
    expect(input).toHaveProp('value', 'Cambiado');
    expect(screen.getByText('Editar elemento de texto:')).toBeOnTheScreen();
  });

  test('an open profile dialog keeps its changed name, picked photo and step, and the section under it', async () => {
    launch.mockReset();
    launch.mockResolvedValueOnce(pickedResult(1));
    await renderRouter('./src/app', { initialUrl: '/circles' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Profile' }));
    await screen.findByText('Editar perfil:');
    await fireEvent.press(button('Elegir foto'));
    await screen.findByRole('image', { name: 'Foto de perfil' });
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Carmen');
    const input = screen.getByLabelText('Nombre');

    await rotate(TEST_WINDOWS.phoneLandscape);
    expect(screen.getByLabelText('Nombre')).toBe(input);
    expect(input).toHaveProp('value', 'Carmen');
    expect(screen.getByRole('image', { name: 'Foto de perfil' })).toBeOnTheScreen();
    expect(screen).toHavePathname('/circles');

    // The discard step survives a rotation too.
    await fireEvent.press(button('Cancelar'));
    expect(screen.getByText(DISCARD_TITLE)).toBeOnTheScreen();
    await rotate(TEST_WINDOWS.tabletPortrait);
    expect(screen.getByText(DISCARD_TITLE)).toBeOnTheScreen();
    await rotate(TEST_WINDOWS.phonePortrait);
    await fireEvent.press(button('No, volver'));
    expect(screen.getByLabelText('Nombre')).toHaveProp('value', 'Carmen');
    expect(screen.getByRole('image', { name: 'Foto de perfil' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Circles' })).toBeSelected();
  });

  test('a draft left while on Circles is shown in the same step after rotating and returning', async () => {
    await renderRouter('./src/app');
    await journey.startText();
    await fireEvent.changeText(textArea(), 'Borrador');
    await fireEvent.press(screen.getByRole('tab', { name: 'Circles' }));

    await rotate(TEST_WINDOWS.phoneLandscape);
    await fireEvent.press(screen.getByRole('tab', { name: 'Timeline' }));
    expect(textArea()).toHaveProp('value', 'Borrador');
    expect(button('Crear')).toBeOnTheScreen();
  });

  test('Circles stays active, and the tab bar is drawn at the top in landscape and at the bottom in portrait', async () => {
    await renderRouter('./src/app', { initialUrl: '/circles' });
    expect(tabList()).not.toHaveStyle({ position: 'absolute' });
    expect(tabList()).toHaveStyle({ borderTopWidth: 2 });

    await rotate(TEST_WINDOWS.phoneLandscape);
    expect(screen).toHavePathname('/circles');
    expect(screen.getByRole('tab', { name: 'Circles' })).toBeSelected();
    expect(tabList()).toHaveStyle({
      position: 'absolute',
      top: 0,
      height: Frames['phone-landscape'].tabBarHeight,
      borderBottomWidth: 2,
    });

    await rotate(TEST_WINDOWS.phonePortrait);
    expect(screen.getByRole('tab', { name: 'Circles' })).toBeSelected();
    expect(tabList()).not.toHaveStyle({ position: 'absolute' });
  });

  test('tablet portrait to tablet landscape keeps the tablet sizes', async () => {
    await renderRouter('./src/app');
    await journey.createText('Hola');
    await rotate(TEST_WINDOWS.tabletPortrait);
    expect(StyleSheet.flatten(screen.getByTestId('text-item-body').props.style).fontSize).toBe(
      Sizes.tablet.cardText,
    );

    await rotate(TEST_WINDOWS.tabletLandscape);
    expect(StyleSheet.flatten(screen.getByTestId('text-item-body').props.style).fontSize).toBe(
      Sizes.tablet.cardText,
    );
    expect(screen.getByTestId('timeline-feed')).toHaveProp(
      'contentContainerStyle',
      expect.objectContaining({
        width: Frames['tablet-landscape'].column! + 2 * Sizes.tablet.contentPadding,
      }),
    );
  });
});
