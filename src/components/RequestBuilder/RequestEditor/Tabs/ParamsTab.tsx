import React from 'react';
import KeyValueEditor from '@/components/ui/KeyValueEditor';
import { useRequestEditor } from '../context/RequestEditorContext';
import { collectionActions } from '@/store/collectionStore';

const ParamsTab = React.memo(() => {
  const { params, addParam, updateParam, removeParam, activeRequestId } =
    useRequestEditor();

  // Wrap handlers to mark unsaved changes
  const handleAdd = React.useCallback(() => {
    addParam();
    if (activeRequestId) {
      collectionActions.markUnsaved(activeRequestId);
    }
  }, [addParam, activeRequestId]);

  const handleUpdate = React.useCallback(
    (index: number, updates: Partial<any>) => {
      updateParam(index, updates);
      if (activeRequestId) {
        collectionActions.markUnsaved(activeRequestId);
      }
    },
    [updateParam, activeRequestId],
  );

  const handleRemove = React.useCallback(
    (index: number) => {
      removeParam(index);
      if (activeRequestId) {
        collectionActions.markUnsaved(activeRequestId);
      }
    },
    [removeParam, activeRequestId],
  );

  return (
    <KeyValueEditor
      items={params}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onRemove={handleRemove}
      title='Query Parameters'
      addButtonLabel='Add Parameters'
      emptyMessage='No query parameters added yet.'
    />
  );
});

export default ParamsTab;
