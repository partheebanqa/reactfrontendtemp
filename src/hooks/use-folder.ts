'use client';

import { useState } from 'react';
import {
  addFolder,
  type AddFolderInput,
  type Folder,
} from '@/services/folder.service';

export type UseAddFolderResult = {
  mutateAsync: (input: AddFolderInput) => Promise<Folder>;
  loading: boolean;
  data: Folder | null;
  error: Error | null;
};

export function useAddFolder(): UseAddFolderResult {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Folder | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = async (input: AddFolderInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await addFolder(input);
      setData(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create folder');
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutateAsync, loading, data, error };
}
