import { useState } from 'react';

import { EditDialogFrame } from '@/components/edit-dialog-frame';
import { EventFields } from '@/components/event-fields';
import { appendPhotos, storedDrafts, type EventPhotoDraft } from '@/components/event-photo-grid';
import { useTimeline, type EventPhotoInput } from '@/hooks/use-timeline';
import type { EventItem } from '@/items/domain/event-item';

type EditEventDialogProps = {
  item: EventItem;
  /** Closes the dialog. The parent stops rendering it, so each open starts from the stored item. */
  onClose: () => void;
};

/** Whether the drafts are the stored photos, in the same order, with nothing newly picked. */
function samePhotos(drafts: readonly EventPhotoDraft[], item: EventItem): boolean {
  return (
    drafts.length === item.photos.length &&
    drafts.every((draft, index) => draft.kind === 'stored' && draft.photo.file === item.photos[index].file)
  );
}

/**
 * Dialog over the Timeline to edit or delete an event item: the shared `EventFields`
 * (thumbnails, "Añadir fotos", title, category with suggestions, description) in the
 * shared [`EditDialogFrame`]. Photo changes only show in the dialog until Guardar.
 * Render it with `key={item.id}`.
 */
export function EditEventDialog({ item, onClose }: EditEventDialogProps) {
  const { updateEvent, deleteItem } = useTimeline();
  const [photos, setPhotos] = useState(() => storedDrafts(item.photos));
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description ?? '');
  const [pickerFailed, setPickerFailed] = useState(false);

  const valid = photos.length >= 1 && title.trim().length > 0 && category.trim().length > 0;
  const changed =
    !samePhotos(photos, item) ||
    title.trim() !== item.title ||
    category.trim() !== item.category ||
    description.trim() !== (item.description ?? '');

  const inputs = (): EventPhotoInput[] =>
    photos.map((draft) =>
      draft.kind === 'stored' ? { kind: 'stored', photo: draft.photo } : { kind: 'picked', photo: draft.photo },
    );

  return (
    <EditDialogFrame
      testID="edit-event-dialog"
      title="Editar elemento de evento:"
      deleteLabel="Borrar este evento"
      confirmTitle="¿Borrar este evento?"
      canSave={valid && changed}
      onSave={() => updateEvent(item.id, { photos: inputs(), title, category, description })}
      onDelete={() => deleteItem(item.id)}
      onClose={onClose}>
      {({ clearError }) => {
        // Any edit hides the gallery and save messages.
        const touched = () => {
          setPickerFailed(false);
          clearError();
        };
        return (
          <EventFields
            photos={photos}
            title={title}
            category={category}
            description={description}
            onPhotosAdded={(added) => {
              setPhotos((list) => appendPhotos(list, added));
              touched();
            }}
            onPhotoRemoved={(key) => {
              setPhotos((list) => list.filter((draft) => draft.key !== key));
              touched();
            }}
            onTitleChange={(text) => {
              setTitle(text);
              touched();
            }}
            onCategoryChange={(text) => {
              setCategory(text);
              touched();
            }}
            onDescriptionChange={(text) => {
              setDescription(text);
              touched();
            }}
            onPickerFailed={() => setPickerFailed(true)}
            pickerFailed={pickerFailed}
          />
        );
      }}
    </EditDialogFrame>
  );
}
