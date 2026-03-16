import React from 'react';
import KeyValueEditor from '@/components/ui/KeyValueEditor';
import { collectionActions } from '@/store/collectionStore';
import type { Header } from '@/shared/types/request';

interface HeadersTabProps {
  headers: Header[];
  setHeaders: React.Dispatch<React.SetStateAction<Header[]>>;
  activeRequestId?: string;
}

const HeadersTab = React.memo(
  ({ headers, setHeaders, activeRequestId }: HeadersTabProps) => {
    const handleAdd = React.useCallback(() => {
      setHeaders((prev) => [...prev, { key: '', value: '', enabled: true }]);
      if (activeRequestId) collectionActions.markUnsaved(activeRequestId);
    }, [setHeaders, activeRequestId]);

    const handleUpdate = React.useCallback(
      (index: number, updates: Partial<Header>) => {
        setHeaders((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], ...updates };
          return next;
        });
        if (activeRequestId) collectionActions.markUnsaved(activeRequestId);
      },
      [setHeaders, activeRequestId],
    );

    const handleRemove = React.useCallback(
      (index: number) => {
        setHeaders((prev) => prev.filter((_, i) => i !== index));
        if (activeRequestId) collectionActions.markUnsaved(activeRequestId);
      },
      [setHeaders, activeRequestId],
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
  },
);

export default HeadersTab;
