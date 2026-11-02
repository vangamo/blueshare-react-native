import { useState } from 'react';

import { EditDialogFrame } from '@/components/edit-dialog-frame';
import { ImageFields } from '@/components/image-fields';
import { usePhotoUri } from '@/hooks/use-photo-uri';
import { useTimeline } from '@/hooks/use-timeline';
import type { ImageItem, PickedPhoto } from '@/items/domain/image-item';

type EditImageDialogProps = {
  item: ImageItem;
  /** Closes the dialog. The parent stops rendering it, so each open starts from the stored item. */
  onClose: () => void;
};

/**
 * Dialog over the Timeline to edit or delete an image item: the photo, "Cambiar foto" and
 * the two text fields in the shared [`EditDialogFrame`]. A photo picked here only shows in
 * the dialog until Guardar. Render it with `key={item.id}`.
 */
export function EditImageDialog({ item, onClose }: EditImageDialogProps) {
  const { updateImage, deleteItem } = useTimeline();
  const storedUri = usePhotoUri(item.photo.file);
  const [newPhoto, setNewPhoto] = useState<PickedPhoto | null>(null);
  const [altText, setAltText] = useState(item.altText ?? '');
  const [caption, setCaption] = useState(item.caption ?? '');
  const [pickerFailed, setPickerFailed] = useState(false);

  const canSave =
    newPhoto !== null ||
    altText.trim() !== (item.altText ?? '') ||
    caption.trim() !== (item.caption ?? '');

  return (
    <EditDialogFrame
      testID="edit-image-dialog"
      title="Editar elemento de imagen:"
      deleteLabel="Borrar esta imagen"
      confirmTitle="¿Borrar esta imagen?"
      canSave={canSave}
      onSave={() => updateImage(item.id, { newPhoto, altText, caption })}
      onDelete={() => deleteItem(item.id)}
      onClose={onClose}>
      {({ clearError }) => (
        <ImageFields
          photo={newPhoto ?? { uri: storedUri, width: item.photo.width, height: item.photo.height }}
          altText={altText}
          caption={caption}
          onAltTextChange={(text) => {
            setAltText(text);
            setPickerFailed(false);
            clearError();
          }}
          onCaptionChange={(text) => {
            setCaption(text);
            setPickerFailed(false);
            clearError();
          }}
          onPhotoPicked={(photo) => {
            setNewPhoto(photo);
            setPickerFailed(false);
            clearError();
          }}
          onPickerFailed={() => setPickerFailed(true)}
          pickerFailed={pickerFailed}
        />
      )}
    </EditDialogFrame>
  );
}
