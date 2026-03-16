import React from 'react';
import KeyValueEditor from '@/components/ui/KeyValueEditor';
import { collectionActions } from '@/store/collectionStore';
import type { Param } from '@/shared/types/request';

interface ParamsTabProps {
  params: Param[];
  setParams: React.Dispatch<React.SetStateAction<Param[]>>;
  activeRequestId?: string;
}

const ParamsTab = React.memo(
  ({ params, setParams, activeRequestId }: ParamsTabProps) => {
    const handleAdd = React.useCallback(() => {
      setParams((prev) => [...prev, { key: '', value: '', enabled: true }]);
      if (activeRequestId) collectionActions.markUnsaved(activeRequestId);
    }, [setParams, activeRequestId]);

    const handleUpdate = React.useCallback(
      (index: number, updates: Partial<Param>) => {
        setParams((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], ...updates };
          return next;
        });
        if (activeRequestId) collectionActions.markUnsaved(activeRequestId);
      },
      [setParams, activeRequestId],
    );

    const handleRemove = React.useCallback(
      (index: number) => {
        setParams((prev) => prev.filter((_, i) => i !== index));
        if (activeRequestId) collectionActions.markUnsaved(activeRequestId);
      },
      [setParams, activeRequestId],
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
  },
);

export default ParamsTab;
