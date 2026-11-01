import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { EMPTY_TIMELINE_MESSAGE } from '@/components/timeline-feed';
import { journey } from '@/test-utils/timeline-journey';

const { button, textArea, cardTexts } = journey;

describe('creating a text item', () => {
  test('open, choose Texto, Guardar, type, Crear: the card is on top and + is back', async () => {
    await renderRouter('./src/app');
    await screen.findByText(EMPTY_TIMELINE_MESSAGE);
    await journey.createText('Uno');

    await journey.openBox();
    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
    await journey.chooseType('📝 Texto');
    await fireEvent.press(button('Guardar'));
    await fireEvent.changeText(textArea(), '  Hoy hemos jugado al parchís.  ');
    await fireEvent.press(button('Crear'));

    expect(await screen.findByRole('button', { name: 'Create' })).toBeOnTheScreen();
    expect(screen.queryByText('Crear nuevo elemento de texto:')).toBeNull();
    expect(cardTexts()).toEqual(['Hoy hemos jugado al parchís.', 'Uno']);
  });

  test('Cancelar discards the text', async () => {
    await renderRouter('./src/app');
    await journey.startText();
    await fireEvent.changeText(textArea(), 'No lo guardes');
    await fireEvent.press(button('Cancelar'));

    expect(button('Create')).toBeOnTheScreen();
    expect(cardTexts()).toEqual([]);
    expect(await screen.findByText(EMPTY_TIMELINE_MESSAGE)).toBeOnTheScreen();

    await journey.openBox();
    expect(button('Crear nuevo elemento')).toHaveAccessibilityValue({
      text: 'Selecciona una opción',
    });
  });

  test('a tab switch keeps the step and the text, and they come back on Timeline', async () => {
    await renderRouter('./src/app');
    await journey.startText();
    await fireEvent.changeText(textArea(), 'Mañana hay bingo');

    await fireEvent.press(screen.getByRole('tab', { name: 'Circles' }));
    expect(screen).toHavePathname('/circles');
    expect(button('Create')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByText('Crear nuevo elemento de texto:')).toBeOnTheScreen();
    expect(textArea()).toHaveProp('value', 'Mañana hay bingo');
    expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
  });

  test('Evento with Guardar does nothing', async () => {
    await renderRouter('./src/app');
    await journey.openBox();
    await journey.chooseType('📅 Evento');
    await fireEvent.press(button('Guardar'));

    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
    expect(button('Crear nuevo elemento')).toHaveAccessibilityValue({ text: '📅 Evento' });
    expect(cardTexts()).toEqual([]);
  });
});
