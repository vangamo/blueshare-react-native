import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useState } from 'react';

import { EventFields, PHOTO_LIMIT_MESSAGE } from '@/components/event-fields';
import { appendPhotos, pickedDrafts, type EventPhotoDraft } from '@/components/event-photo-grid';
import { PICKER_ERROR_MESSAGE } from '@/components/image-fields';
import { ItemsProvider } from '@/components/items-provider';
import {
  EVENT_CATEGORY_MAX_LENGTH,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_MAX_PHOTOS,
  EVENT_TITLE_MAX_LENGTH,
} from '@/constants/limits';
import { Colors } from '@/constants/theme';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { cancelledPick, pickedResult } from '@/test-utils/picker-assets';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const photo = (name: string) => ({ uri: `file:///cache/${name}.jpg`, width: 4, height: 3, mimeType: null });

/** EventFields with its state held here, like the step and the dialog do. */
function Form({ initial = [] }: { initial?: EventPhotoDraft[] }) {
  const [photos, setPhotos] = useState(initial);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [failed, setFailed] = useState(false);
  return (
    <EventFields
      photos={photos}
      title={title}
      category={category}
      description={description}
      onPhotosAdded={(added) => setPhotos((list) => appendPhotos(list, added))}
      onPhotoRemoved={(key) => setPhotos((list) => list.filter((draft) => draft.key !== key))}
      onTitleChange={setTitle}
      onCategoryChange={setCategory}
      onDescriptionChange={setDescription}
      onPickerFailed={() => setFailed(true)}
      pickerFailed={failed}
    />
  );
}

async function renderForm(initial?: EventPhotoDraft[]) {
  await render(
    <ItemsProvider adapters={createAppAdapters()}>
      <Form initial={initial} />
    </ItemsProvider>,
  );
}

const button = (name: string) => screen.getByRole('button', { name });
const drafts = (count: number) => pickedDrafts(Array.from({ length: count }, (_, i) => photo(`p${i}`)));

describe('EventFields', () => {
  beforeEach(() => launch.mockReset());

  test('the photo button reads "Elegir fotos", then "Añadir fotos" once a photo is chosen', async () => {
    await renderForm();
    expect(button('Elegir fotos')).toBeEnabled();

    launch.mockResolvedValueOnce(pickedResult(2));
    await fireEvent.press(button('Elegir fotos'));

    await waitFor(() => expect(button('Añadir fotos')).toBeOnTheScreen());
    expect(screen.getAllByTestId('event-thumbnail')).toHaveLength(2);
  });

  test('a cancelled pick adds nothing', async () => {
    await renderForm(drafts(1));
    launch.mockResolvedValueOnce(cancelledPick);
    await fireEvent.press(button('Añadir fotos'));
    await waitFor(() => expect(launch).toHaveBeenCalledTimes(1));
    expect(screen.getAllByTestId('event-thumbnail')).toHaveLength(1);
  });

  test('the picker asks only for what still fits', async () => {
    await renderForm(drafts(7));
    launch.mockResolvedValueOnce(cancelledPick);
    await fireEvent.press(button('Añadir fotos'));
    await waitFor(() =>
      expect(launch).toHaveBeenCalledWith(expect.objectContaining({ selectionLimit: EVENT_MAX_PHOTOS - 7 })),
    );
  });

  test('at 10 photos the limit message shows and the button is disabled, never opening the picker', async () => {
    await renderForm(drafts(EVENT_MAX_PHOTOS));
    const message = screen.getByText(PHOTO_LIMIT_MESSAGE);
    expect(message).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(message).toHaveStyle({ color: Colors.light.textMain });
    expect(button('Añadir fotos')).toBeDisabled();
    await fireEvent.press(button('Añadir fotos'));
    expect(launch).not.toHaveBeenCalled();

    await fireEvent.press(button('Quitar foto 1'));
    expect(screen.queryByText(PHOTO_LIMIT_MESSAGE)).toBeNull();
    expect(button('Añadir fotos')).toBeEnabled();
  });

  test('a picker error shows the gallery message', async () => {
    await renderForm();
    launch.mockRejectedValueOnce(new Error('no gallery'));
    await fireEvent.press(button('Elegir fotos'));
    expect(await screen.findByText(PICKER_ERROR_MESSAGE)).toHaveProp('accessibilityLiveRegion', 'polite');
  });

  test('the three fields are labeled and limited', async () => {
    await renderForm();
    expect(screen.getByLabelText('Título')).toHaveProp('maxLength', EVENT_TITLE_MAX_LENGTH);
    expect(screen.getByLabelText('Categoría')).toHaveProp('maxLength', EVENT_CATEGORY_MAX_LENGTH);
    expect(screen.getByLabelText('Descripción')).toHaveProp('maxLength', EVENT_DESCRIPTION_MAX_LENGTH);
    for (const label of ['Título', 'Categoría', 'Descripción']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
  });

  test('a suggestion replaces the category without focusing the field', async () => {
    await renderForm();
    const field = screen.getByLabelText('Categoría');
    await fireEvent.changeText(field, 'Amig');
    await fireEvent.press(button('Familia'));
    expect(screen.getByLabelText('Categoría')).toHaveProp('value', 'Familia');
    expect(screen.getByLabelText('Categoría')).not.toHaveProp('autoFocus', true);
  });
});
