import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import {
  DISCARD_TEXT,
  DISCARD_TITLE,
  EDIT_SAVE_ERROR_MESSAGE,
  EditDialogFrame,
} from '@/components/edit-dialog-frame';

const button = (name: string) => screen.getByRole('button', { name });
const queryButton = (name: string) => screen.queryByRole('button', { name });
const back = () => fireEvent(screen.getByTestId('frame'), 'requestClose');

type HostProps = {
  confirmDiscard?: boolean;
  withDeletion?: boolean;
  footer?: boolean;
  editable?: boolean;
  onSave?: () => Promise<unknown>;
  saveErrorMessage?: (error: unknown) => string;
  onClose?: () => void;
};

/** A minimal body: one field, with a real change once the text differs from "base". */
function Host({
  confirmDiscard,
  withDeletion,
  footer,
  editable,
  onSave = async () => undefined,
  saveErrorMessage,
  onClose = () => {},
}: HostProps) {
  const [text, setText] = useState('base');
  return (
    <EditDialogFrame
      testID="frame"
      title="Editar prueba:"
      confirmDiscard={confirmDiscard}
      editable={editable}
      deletion={
        withDeletion
          ? { label: 'Borrar esto', confirmTitle: '¿Borrar esto?', onDelete: async () => undefined }
          : undefined
      }
      footer={footer ? <Text>Pie de prueba</Text> : undefined}
      saveErrorMessage={saveErrorMessage}
      canSave={text !== 'base'}
      onSave={onSave}
      onClose={onClose}>
      {({ clearError }) => (
        <TextInput
          accessibilityLabel="Campo"
          value={text}
          onChangeText={(value) => {
            setText(value);
            clearError();
          }}
        />
      )}
    </EditDialogFrame>
  );
}

describe('EditDialogFrame without a deletion', () => {
  test('shows no deletion button', async () => {
    await render(<Host />);
    expect(queryButton('Borrar esto')).toBeNull();
    expect(button('Guardar')).toBeOnTheScreen();
  });

  test('draws the footer after the buttons', async () => {
    await render(<Host footer />);
    expect(screen.getByText('Pie de prueba')).toBeOnTheScreen();
  });

  test('a deletion is still asked for and confirmed', async () => {
    await render(<Host withDeletion />);
    await fireEvent.press(button('Borrar esto'));
    expect(screen.getByText('¿Borrar esto?')).toBeOnTheScreen();
    expect(button('Sí, borrar')).toBeOnTheScreen();
  });
});

describe('EditDialogFrame with confirmDiscard', () => {
  test('closes at once while nothing changed, from Cancelar, Cerrar and back', async () => {
    const onClose = jest.fn();
    await render(<Host confirmDiscard onClose={onClose} />);
    await fireEvent.press(button('Cancelar'));
    await fireEvent.press(button('Cerrar'));
    await back();
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(screen.queryByText(DISCARD_TITLE)).toBeNull();
  });

  test.each([
    ['Cancelar', () => fireEvent.press(button('Cancelar'))],
    ['Cerrar', () => fireEvent.press(button('Cerrar'))],
    ['back', () => back()],
  ])('%s with changes asks before discarding', async (_name, trigger) => {
    const onClose = jest.fn();
    await render(<Host confirmDiscard onClose={onClose} />);
    await fireEvent.changeText(screen.getByLabelText('Campo'), 'otro');

    await trigger();

    expect(screen.getByText(DISCARD_TITLE)).toBeOnTheScreen();
    expect(screen.getByText(DISCARD_TEXT)).toBeOnTheScreen();
    expect(button('No, volver')).toBeOnTheScreen();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('"Sí, descartar" closes', async () => {
    const onClose = jest.fn();
    await render(<Host confirmDiscard onClose={onClose} />);
    await fireEvent.changeText(screen.getByLabelText('Campo'), 'otro');
    await fireEvent.press(button('Cancelar'));
    await fireEvent.press(button('Sí, descartar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('"No, volver", Cerrar and back return to the body with its state kept', async () => {
    await render(<Host confirmDiscard />);
    await fireEvent.changeText(screen.getByLabelText('Campo'), 'otro');
    for (const undo of [
      () => fireEvent.press(button('No, volver')),
      () => fireEvent.press(button('Cerrar')),
      () => back(),
    ]) {
      await fireEvent.press(button('Cancelar'));
      await undo();
      expect(screen.queryByText(DISCARD_TITLE)).toBeNull();
      expect(screen.getByLabelText('Campo')).toHaveProp('value', 'otro');
    }
  });

  test('without confirmDiscard a changed dialog still closes at once', async () => {
    const onClose = jest.fn();
    await render(<Host onClose={onClose} />);
    await fireEvent.changeText(screen.getByLabelText('Campo'), 'otro');
    await fireEvent.press(button('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('EditDialogFrame save errors', () => {
  test('shows the default message when onSave rejects', async () => {
    await render(<Host onSave={() => Promise.reject(new Error('x'))} />);
    await fireEvent.changeText(screen.getByLabelText('Campo'), 'otro');
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(screen.getByText(EDIT_SAVE_ERROR_MESSAGE)).toBeOnTheScreen());
  });

  test('saveErrorMessage replaces the default message', async () => {
    await render(
      <Host
        onSave={() => Promise.reject(new Error('x'))}
        saveErrorMessage={(error) => `Mensaje: ${(error as Error).message}`}
      />,
    );
    await fireEvent.changeText(screen.getByLabelText('Campo'), 'otro');
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(screen.getByText('Mensaje: x')).toBeOnTheScreen());
    expect(screen.queryByText(EDIT_SAVE_ERROR_MESSAGE)).toBeNull();
  });
});

describe('EditDialogFrame with editable false', () => {
  test('shows only the body and Cancelar', async () => {
    const onClose = jest.fn();
    await render(<Host editable={false} withDeletion footer onClose={onClose} />);
    expect(screen.getByLabelText('Campo')).toBeOnTheScreen();
    expect(queryButton('Guardar')).toBeNull();
    expect(queryButton('Borrar esto')).toBeNull();
    expect(screen.queryByText('Pie de prueba')).toBeNull();
    await fireEvent.press(button('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
