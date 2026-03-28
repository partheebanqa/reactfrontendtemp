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
          // ─── FIX 2 & 3: Explicit priority order — IDB is the single source of
          // truth because it's the only store we write to on every user edit
          // (including deletions). Falling back to the chain model covers the
          // very first load before anything has been persisted. secureStorage
          // is a last-resort for the single-request editor path.
          //
          // The previous "most enabled" race between all four candidates
          // (model, IDB, secureStorage, lastExecutionByRequest) meant that a
          // stale execution-cache entry could always win over a shorter,
          // user-trimmed list — causing deleted assertions to reappear.
          //
          // lastExecutionByRequest is intentionally excluded: it records
          // run results for display purposes, not the user's intended
          // assertion list. Reading it here was the primary resurrection path.

          // 1. IDB — reflects every persisted user edit, including deletions.
          //    getAssertions returns null when no entry exists yet (first load),
          //    and [] when the user has deleted everything — both are meaningful.
          const fromIDB = await storageManager.getAssertions(request.id);
          if (fromIDB !== null && fromIDB !== undefined) {
            loadedAssertions[request.id] = fromIDB; // [] is a valid "cleared" state
            continue;
          }

          // 2. Chain model — used only on the very first load before IDB has
          //    any entry for this request.
          if (request.assertions?.length > 0) {
            loadedAssertions[request.id] = request.assertions;
            continue;
          }

          // 3. secureStorage — fallback for the single-request editor, which
          //    persists via `assertions_<id>` rather than IDB.
          const fromSecure = secureStorage.loadEncrypted(
            `assertions_${request.id}`,
          );
          if (fromSecure?.assertions?.length > 0) {
            loadedAssertions[request.id] = fromSecure.assertions;
          }

          // NOTE: lastExecutionByRequest is intentionally NOT used as a load
          // source. It stores post-run generated assertions for result display
          // and will always contain a superset of the user's trimmed list,
          // which caused deleted assertions to be resurrected on every run.
        }

        if (Object.keys(loadedAssertions).length > 0) {
          skipNextPersistRef.current = true;
          setAssertionsByRequest((prev) => {
            const merged: Record<string, any[]> = { ...prev };
            for (const [requestId, loaded] of Object.entries(
              loadedAssertions,
            )) {
              const existing = prev[requestId];

              // If nothing is in memory yet, take whatever we loaded from storage.
              if (!existing) {
                merged[requestId] = loaded;
                continue;
              }

              // In-memory state already exists — it reflects the most recent
              // user interaction (e.g. a deletion that happened before this
              // effect re-ran). Trust it and do not overwrite with the
              // (potentially stale) loaded value.
              //
              // The previous logic compared enabled-assertion counts and would
              // replace in-memory state with a loaded source that had "more
              // enabled" assertions — exactly the wrong behaviour after a
              // deletion, where the user intentionally reduced the count.
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
        // ─── FIX 1: Always persist, even when assertions is [].
        //
        // The previous `if (assertions.length === 0) continue` guard meant
        // that deleting all assertions for a request never wrote an empty
        // array back to IDB. The next loadAllAssertions call would then find
        // the old (non-empty) IDB entry and restore the deleted assertions.
        //
        // Writing [] to IDB is the correct deletion signal — storageManager
        // already handles empty arrays gracefully.
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
