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
        console.log('assertionsinstate:', assertions);

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
          const candidates: any[][] = [];

          if (request.assertions?.length > 0) {
            candidates.push(request.assertions);
          }

          const fromIDB = await storageManager.getAssertions(request.id);
          if (fromIDB?.length > 0) {
            candidates.push(fromIDB);
          }

          const fromSecure = secureStorage.loadEncrypted(
            `assertions_${request.id}`,
          );
          if (fromSecure?.assertions?.length > 0) {
            candidates.push(fromSecure.assertions);
          }

          const execMap =
            secureStorage.loadEncrypted('lastExecutionByRequest') || {};
          if (execMap[request.id]?.assertions?.length > 0) {
            candidates.push(execMap[request.id].assertions);
          }

          if (candidates.length > 0) {
            // Pick the source with the most ENABLED assertions
            // This respects user removals (disabled assertions) rather than raw count
            loadedAssertions[request.id] = candidates.reduce(
              (best, current) => {
                const bestEnabled = best.filter(
                  (a: any) => a.enabled !== false,
                ).length;
                const currentEnabled = current.filter(
                  (a: any) => a.enabled !== false,
                ).length;
                // Prefer more enabled assertions; on tie, prefer fewer total (user removed some)
                if (currentEnabled > bestEnabled) return current;
                if (
                  currentEnabled === bestEnabled &&
                  current.length < best.length
                )
                  return current;
                return best;
              },
            );
          }
        }

        if (Object.keys(loadedAssertions).length > 0) {
          skipNextPersistRef.current = true;
          setAssertionsByRequest((prev) => {
            const merged: Record<string, any[]> = { ...prev };
            for (const [requestId, loaded] of Object.entries(
              loadedAssertions,
            )) {
              const existing = prev[requestId];
              if (!existing || existing.length === 0) {
                merged[requestId] = loaded;
                continue;
              }
              // Compare by enabled count — respect user's removals
              const existingEnabled = existing.filter(
                (a: any) => a.enabled !== false,
              ).length;
              const loadedEnabled = loaded.filter(
                (a: any) => a.enabled !== false,
              ).length;
              if (loadedEnabled > existingEnabled) {
                merged[requestId] = loaded;
              }
              // If in-memory already has same or more enabled assertions, keep it
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
        if (assertions.length === 0) continue;
        await persistAssertionsToStorage(requestId, assertions);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [assertionsByRequest, persistAssertionsToStorage]);

  return {
    assertionsByRequest,
    setAssertionsByRequest,
    persistAssertionsToStorage,
  };
}
