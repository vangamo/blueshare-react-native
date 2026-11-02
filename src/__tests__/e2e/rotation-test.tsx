import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { Frames, Sizes } from '@/constants/theme';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';
import { journey } from '@/test-utils/timeline-journey';

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
