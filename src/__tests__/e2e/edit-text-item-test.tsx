import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { journey } from '@/test-utils/timeline-journey';

const { button, cardTexts } = journey;
const editText = () => screen.getByLabelText('Editar elemento de texto');
const editCard = (index: number) =>
  fireEvent.press(screen.getAllByRole('button', { name: 'Editar' })[index]);
const dialogClosed = () => waitFor(() => expect(screen.queryByTestId('edit-text-dialog')).toBeNull());

async function twoTexts() {
  await renderRouter('./src/app');
  await journey.createText('Antiguo');
  await journey.createText('Nuevo');
}

describe('editing and deleting a text item', () => {
  test('editing the older item changes it and keeps its place', async () => {
    await twoTexts();
    await editCard(1);
    await fireEvent.changeText(editText(), 'Antiguo corregido');
    await fireEvent.press(button('Guardar'));
    await dialogClosed();
    expect(cardTexts()).toEqual(['Nuevo', 'Antiguo corregido']);
  });

  test('Cancelar leaves the item unchanged', async () => {
    await twoTexts();
    await editCard(0);
    await fireEvent.changeText(editText(), 'Otra cosa');
    await fireEvent.press(button('Cancelar'));
    await dialogClosed();
    expect(cardTexts()).toEqual(['Nuevo', 'Antiguo']);
  });

  test('Borrar este texto, No, volver, then Guardar saves the edit', async () => {
    await twoTexts();
    await editCard(0);
    await fireEvent.changeText(editText(), 'Nuevo editado');
    await fireEvent.press(button('Borrar este texto'));
    await fireEvent.press(button('No, volver'));
    expect(editText()).toHaveProp('value', 'Nuevo editado');
    await fireEvent.press(button('Guardar'));
    await dialogClosed();
    expect(cardTexts()).toEqual(['Nuevo editado', 'Antiguo']);
  });

  test('Borrar este texto, Sí, borrar removes the card', async () => {
    await twoTexts();
    await editCard(0);
    await fireEvent.press(button('Borrar este texto'));
    await fireEvent.press(button('Sí, borrar'));
    await dialogClosed();
    expect(cardTexts()).toEqual(['Antiguo']);
  });

  test('a creation draft is still there after editing a card', async () => {
    await twoTexts();
    await journey.startText();
    await fireEvent.changeText(journey.textArea(), 'Borrador');

    await editCard(0);
    await fireEvent.changeText(editText(), 'Nuevo editado');
    await fireEvent.press(button('Guardar'));
    await dialogClosed();

    expect(journey.textArea()).toHaveProp('value', 'Borrador');
    expect(cardTexts()).toEqual(['Nuevo editado', 'Antiguo']);
  });
});
