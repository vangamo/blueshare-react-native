import { useState } from 'react';

import { BoxTextArea } from '@/components/box-text-area';
import { EditDialogFrame } from '@/components/edit-dialog-frame';
import { useTimeline } from '@/hooks/use-timeline';
import type { TextItem } from '@/items/domain/text-item';

export { DELETE_ERROR_MESSAGE, EDIT_SAVE_ERROR_MESSAGE } from '@/components/edit-dialog-frame';

type EditTextDialogProps = {
  item: TextItem;
  /** Closes the dialog. The parent stops rendering it, so each open starts from the stored text. */
  onClose: () => void;
};

/**
 * Dialog over the Timeline to edit or delete a text item: the text area in the shared
 * [`EditDialogFrame`]. Edit step: text area, Cancelar, Guardar and Borrar este texto.
 * Confirm step: "¿Borrar este texto?" with No, volver and Sí, borrar. Render it with
 * `key={item.id}`.
 */
export function EditTextDialog({ item, onClose }: EditTextDialogProps) {
  const { updateText, deleteItem } = useTimeline();
  const [text, setText] = useState(item.body);

  const trimmed = text.trim();
  const canSave = trimmed.length > 0 && trimmed !== item.body;

  return (
    <EditDialogFrame
      testID="edit-text-dialog"
      title="Editar elemento de texto:"
      deleteLabel="Borrar este texto"
      confirmTitle="¿Borrar este texto?"
      canSave={canSave}
      onSave={() => updateText(item.id, text)}
      onDelete={() => deleteItem(item.id)}
      onClose={onClose}>
      {({ clearError }) => (
        <BoxTextArea
          value={text}
          onChangeText={(next) => {
            setText(next);
            clearError();
          }}
          accessibilityLabel="Editar elemento de texto"
        />
      )}
    </EditDialogFrame>
  );
}
