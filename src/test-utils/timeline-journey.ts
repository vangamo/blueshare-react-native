import { fireEvent, screen } from 'expo-router/testing-library';

/** Steps shared by the Timeline tests that run the whole app through `renderRouter`. */
export const journey = {
  button: (name: string) => screen.getByRole('button', { name }),
  textArea: () => screen.getByLabelText('Crear nuevo elemento de texto'),
  /** Card texts, top to bottom. */
  cardTexts: () => screen.queryAllByTestId('text-item-body').map((node) => node.props.children),

  async openBox() {
    await fireEvent.press(journey.button('Create'));
  },

  async chooseType(label: string) {
    await fireEvent.press(journey.button('Crear nuevo elemento'));
    await fireEvent.press(screen.getByRole('radio', { name: label }));
  },

  async startText() {
    await journey.openBox();
    await journey.chooseType('📝 Texto');
    await fireEvent.press(journey.button('Guardar'));
  },

  async createText(text: string) {
    await journey.startText();
    await fireEvent.changeText(journey.textArea(), text);
    await fireEvent.press(journey.button('Crear'));
    await screen.findByRole('button', { name: 'Create' });
  },
};
