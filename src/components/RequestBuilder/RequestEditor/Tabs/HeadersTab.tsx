import React from 'react';
import KeyValueEditor from '@/components/ui/KeyValueEditor';
import { useRequestEditor } from '../context/RequestEditorContext';
import { collectionActions } from '@/store/collectionStore';

const HeadersTab = React.memo(() => {
  const { headers, addHeader, updateHeader, removeHeader, activeRequestId } =
    useRequestEditor();

  // Wrap handlers to mark unsaved changes
  const handleAdd = React.useCallback(() => {
    addHeader();
    if (activeRequestId) {
      collectionActions.markUnsaved(activeRequestId);
    }
  }, [addHeader, activeRequestId]);

  const handleUpdate = React.useCallback(
    (index: number, updates: Partial<any>) => {
      updateHeader(index, updates);
      if (activeRequestId) {
        collectionActions.markUnsaved(activeRequestId);
      }
    },
    [updateHeader, activeRequestId],
  );

  const handleRemove = React.useCallback(
    (index: number) => {
      removeHeader(index);
      if (activeRequestId) {
        collectionActions.markUnsaved(activeRequestId);
      }
    },
    [removeHeader, activeRequestId],
  );

  return (
    <KeyValueEditor
      items={headers}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onRemove={handleRemove}
      title='Headers'
      addButtonLabel='Add Header'
      emptyMessage='No headers added yet.'
    />
  );
});

export default HeadersTab;
