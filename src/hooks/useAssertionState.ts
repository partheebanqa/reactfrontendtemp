import { useState, useRef, useEffect, useCallback } from 'react';
import { storageManager } from '@/utils/storage-manager';
import { secureStorage } from '@/utils/secure-storage';
import { useToast } from '@/hooks/use-toast';
import type { APIRequest } from '@/shared/types/requestChain.model';

interface UseAssertionStateOptions {
  chainRequests: APIRequest[] | undefined;
  chainId: string | undefined;
}

interface UseAssertionStateReturn {
  assertionsByRequest: Record<string, any[]>;
  setAssertionsByRequest: React.Dispatch<
    React.SetStateAction<Record<string, any[]>>
  >;
  persistAssertionsToStorage: (
    requestId: string,
    assertions: any[],
  ) => Promise<void>;
}

export function useAssertionState({
  chainRequests,
  chainId,
}: UseAssertionStateOptions): UseAssertionStateReturn {
  const { toast } = useToast();

  const [assertionsByRequest, setAssertionsByRequest] = useState<
    Record<string, any[]>
  >({});

  const lastSyncedRequestIdsRef = useRef<string>('');
  const skipNextPersistRef = useRef(false);

  const persistAssertionsToStorage = useCallback(
    async (requestId: string, assertions: any[]) => {
      try {
        const success = await storageManager.saveAssertions(
          requestId,
          assertions,
          chainId,
        );

        if (!success) {
          toast({
            title: 'Storage Warning',
            description:
              'Unable to save assertions. Please save your chain to persist changes.',
            variant: 'destructive',
          });
        }
      } catch (e) {
        console.error('[Storage] Failed to persist assertions:', e);
        toast({
          title: 'Storage Error',
          description: 'Failed to save assertions. Your work may not be saved.',
          variant: 'destructive',
        });
      }
    },
    [chainId, toast],
  );

  const requestIdKey = chainRequests?.map((r) => r.id).join(',') ?? '';

  useEffect(() => {
    if (requestIdKey === lastSyncedRequestIdsRef.current) return;
    lastSyncedRequestIdsRef.current = requestIdKey;

    const loadAllAssertions = async () => {
      try {
        const loadedAssertions: Record<string, any[]> = {};

        for (const request of chainRequests || []) {
          if (
            request.assertions &&
            Array.isArray(request.assertions) &&
            request.assertions.length > 0
          ) {
            loadedAssertions[request.id] = request.assertions;
            continue;
          }

          const fromIDB = await storageManager.getAssertions(request.id);
          if (fromIDB && fromIDB.length > 0) {
            loadedAssertions[request.id] = fromIDB;
            continue;
          }

          const fromSecure = secureStorage.loadEncrypted(
            `assertions_${request.id}`,
          );
          if (fromSecure?.assertions?.length > 0) {
            loadedAssertions[request.id] = fromSecure.assertions;
            continue;
          }

          const execMap =
            secureStorage.loadEncrypted('lastExecutionByRequest') || {};
          if (
            execMap[request.id]?.assertions &&
            Array.isArray(execMap[request.id].assertions) &&
            execMap[request.id].assertions.length > 0
          ) {
            loadedAssertions[request.id] = execMap[request.id].assertions;
          }
        }

        if (Object.keys(loadedAssertions).length > 0) {
          skipNextPersistRef.current = true;
          setAssertionsByRequest((prev) => {
            const merged: Record<string, any[]> = { ...prev };
            for (const [requestId, loaded] of Object.entries(
              loadedAssertions,
            )) {
              // Only load from storage if we don't already have assertions in memory
              if (!prev[requestId] || prev[requestId].length === 0) {
                merged[requestId] = loaded;
              }
            }
            return merged;
          });
        }
      } catch (e) {
        console.error('[useAssertionState] Failed to load assertions:', e);
      }
    };

    loadAllAssertions();
  }, [requestIdKey, chainRequests]);

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    if (Object.keys(assertionsByRequest).length === 0) return;

    const timer = setTimeout(async () => {
      for (const [requestId, assertions] of Object.entries(
        assertionsByRequest,
      )) {
        if (assertions.length > 0) {
          await persistAssertionsToStorage(requestId, assertions);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [assertionsByRequest, persistAssertionsToStorage]);

  return {
    assertionsByRequest,
    setAssertionsByRequest,
    persistAssertionsToStorage,
  };
}
