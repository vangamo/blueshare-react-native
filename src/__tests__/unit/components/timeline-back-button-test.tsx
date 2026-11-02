import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { spyOnBackHandler } from '@/test-utils/back-handler';
import { journey } from '@/test-utils/timeline-journey';

describe('Android back button on the Timeline', () => {
  test('with the box open, it closes the box and is handled', async () => {
    const back = spyOnBackHandler();
    await renderRouter('./src/app');
    await journey.startText();
    await fireEvent.changeText(journey.textArea(), 'Borrador');

    let handled = false;
    await act(async () => {
      handled = back.press();
    });

    expect(handled).toBe(true);
    expect(screen.queryByText('Crear nuevo elemento de texto:')).toBeNull();
    expect(screen).toHavePathname('/');
    expect(journey.button('Create')).toBeOnTheScreen();
    expect(journey.cardTexts()).toEqual([]);
  });

  test('with the box closed, it is not handled (the app exits)', async () => {
    const back = spyOnBackHandler();
    await renderRouter('./src/app');
    const listeners = back.listenerCount();

    await journey.openBox();
    expect(back.listenerCount()).toBe(listeners + 1);
    await fireEvent.press(journey.button('Cancelar'));
    expect(back.listenerCount()).toBe(listeners);

    let handled = true;
    await act(async () => {
      handled = back.press();
    });
    expect(handled).toBe(false);
  });

  test('on Events with a draft pending, it returns to Timeline without cancelling', async () => {
    const back = spyOnBackHandler();
    await renderRouter('./src/app');
    await journey.startText();
    await fireEvent.changeText(journey.textArea(), 'Mañana hay bingo');
    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));

    await act(async () => {
      back.press();
    });

    expect(screen).toHavePathname('/');
    expect(screen.getByText('Crear nuevo elemento de texto:')).toBeOnTheScreen();
    expect(journey.textArea()).toHaveProp('value', 'Mañana hay bingo');
  });
});
