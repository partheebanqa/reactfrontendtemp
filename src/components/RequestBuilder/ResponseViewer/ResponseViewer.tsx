'use client';

import type React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import {
  Copy,
  Download,
  Search,
  X,
  CheckCircle,
  Clock,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Code,
  Hash,
  Cookie,
  FlaskConical,
  Stars,
  Plus,
  ListChecks,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';
import AssertionModal from './AssertionModal';
import {
  getCategoryForAssertionType,
  removeDuplicateAssertions,
} from '@/lib/assertion-utils';
import ApiAssertionInterface from '../../Shared/Assertion/ApiAssertionInterface';
import { useCollection } from '@/hooks/useCollection';
import { collectionActions } from '@/store/collectionStore';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  generateAssertionsForPath,
  generateAssertionsWithStats,
  ASSERTION_LIMITS,
} from '@/utils/assertionGenerator';
import VirtualizedJsonViewer from './VirtualizedJsonViewer';
import { useToast } from '@/hooks/use-toast';
import { storageManager } from '@/utils/storage-manager';
import { secureStorage } from '@/utils/secure-storage';

interface JsonNode {
  key: string;
  value: any;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  parentPath: string;
  childCount?: number;
}

export interface Assertion {
  id: string | number;
  type: string;
  displayType?: string;
  category?: string;
  description: string;
  field?: string;
  path?: string;
  value?: any;
  expectedValue?: any;
  enabled?: boolean;
  isGeneral?: boolean;
  operator?: string;
  comparison?: string;
  expectedTime?: string;
  expectedSize?: string;
  scope?: 'full' | 'field';
  dataType?: string;
}

interface ResponseViewerProps {
  isBottomLayout: boolean;
  usedStaticVariables?: Array<{ name: string; value: string }>;
  usedDynamicVariables?: Array<{ name: string; value: string }>;
  onRedirectToTab?: (tabName: string) => void;
  onSaveAssertions?: () => Promise<void>;
  onExtractVariable?: (extraction: {
    variableName: string;
    name: string;
    source: 'response_body' | 'response_header' | 'response_cookie';
    path: string;
    value: any;
    transform?: string;
  }) => void;
  extractedVariables?: Record<string, any>;
  existingExtractions?: Array<{ name: string; path: string; source?: string }>;
  onRemoveExtraction?: (name: string) => void;
}

// ---------------------------------------------------------------------------
// Pure helpers (defined outside component — never recreated)
// ---------------------------------------------------------------------------

function getStatusColor(status: number) {
  if (status >= 200 && status < 300)
    return 'text-green-600 dark:text-green-400';
  if (status >= 300 && status < 400)
    return 'text-yellow-600 dark:text-yellow-400';
  if (status >= 400 && status < 500)
    return 'text-orange-600 dark:text-orange-400';
  if (status >= 500) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const kb = bytes / 1024;
  return Number.parseFloat(kb.toFixed(2)) + ' KB';
}

function calculateResponseSize(data: any): string {
  try {
    return formatBytes(new Blob([JSON.stringify(data)]).size);
  } catch {
    return formatBytes(0);
  }
}

function getChildCount(obj: any): number {
  if (Array.isArray(obj)) return obj.length;
  if (obj && typeof obj === 'object') return Object.keys(obj).length;
  return 0;
}

function normalizeFieldPath(path: string): string {
  if (path.startsWith('headers.'))
    return path.replace(/^headers\./, '').toLowerCase();
  return path;
}

function sanitizeVariableName(name: string): string {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function parseJsonToNodes(
  obj: any,
  parentPath = 'root',
  level = 0,
): JsonNode[] {
  const nodes: JsonNode[] = [];
  if (obj === null) {
    return [
      {
        key: 'null',
        value: null,
        path: parentPath,
        type: 'null',
        level,
        parentPath: '',
      },
    ];
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath =
        parentPath === 'root' ? `[${index}]` : `${parentPath}[${index}]`;
      const itemType = Array.isArray(item)
        ? 'array'
        : item === null
          ? 'null'
          : typeof item === 'object'
            ? 'object'
            : (typeof item as JsonNode['type']);
      nodes.push({
        key: `[${index}]`,
        value: item,
        path: currentPath,
        type: itemType,
        level,
        parentPath,
        childCount: getChildCount(item),
      });
      if (typeof item === 'object' && item !== null) {
        nodes.push(...parseJsonToNodes(item, currentPath, level + 1));
      }
    });
  } else if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = parentPath === 'root' ? key : `${parentPath}.${key}`;
      const valueType = Array.isArray(value)
        ? 'array'
        : value === null
          ? 'null'
          : typeof value === 'object'
            ? 'object'
            : (typeof value as JsonNode['type']);
      nodes.push({
        key,
        value,
        path: currentPath,
        type: valueType,
        level,
        parentPath,
        childCount: getChildCount(value),
      });
      if (typeof value === 'object' && value !== null) {
        nodes.push(...parseJsonToNodes(value, currentPath, level + 1));
      }
    });
  }
  return nodes;
}

/** Collect every path in a JSON tree (used for expand-all). */
function collectAllPaths(
  obj: any,
  path = 'root',
  result = new Set<string>(),
): Set<string> {
  result.add(path);
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        const newPath = path === 'root' ? `[${idx}]` : `${path}[${idx}]`;
        collectAllPaths(item, newPath, result);
      });
    } else {
      Object.keys(obj).forEach((key) => {
        const newPath = path === 'root' ? key : `${path}.${key}`;
        collectAllPaths((obj as any)[key], newPath, result);
      });
    }
  }
  return result;
}

/** Build a Set of only top-level (level-0) paths for lazy initial expansion. */
function collectTopLevelPaths(obj: any): Set<string> {
  const result = new Set<string>(['root']);
  if (!obj || typeof obj !== 'object') return result;
  if (Array.isArray(obj)) {
    obj.forEach((_, idx) => result.add(`[${idx}]`));
  } else {
    Object.keys(obj).forEach((key) => result.add(key));
  }
  return result;
}

// ---------------------------------------------------------------------------
// JsonRow — memoized individual row to prevent re-render storms
// ---------------------------------------------------------------------------

interface JsonRowProps {
  node: JsonNode;
  index: number;
  isExpanded: boolean;
  isExtractionDone: boolean;
  copiedItem: string;
  onToggle: (path: string) => void;
  onCopy: (text: string, id: string) => void;
  onExtract: (
    source: 'response_body',
    path: string,
    value: any,
    e: React.MouseEvent,
  ) => void;
  onAssert: (path: string, value: any, e: React.MouseEvent) => void;
}

const JsonRow = memo(function JsonRow({
  node,
  index,
  isExpanded,
  isExtractionDone,
  copiedItem,
  onToggle,
  onCopy,
  onExtract,
  onAssert,
}: JsonRowProps) {
  const hasChildren = node.type === 'object' || node.type === 'array';

  return (
    <div className='group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative'>
      <div
        tabIndex={0}
        className='group flex items-start py-2 pr-2 text-sm border-l-2 border-transparent hover:border-blue-500 focus:border-blue-500'
      >
        {/* Line number */}
        <span className='text-gray-400 dark:text-gray-600 select-none text-xs w-8 sm:w-10 text-right mr-2 flex-shrink-0'>
          {index + 1}
        </span>

        <div
          className='flex flex-col sm:flex-row sm:items-center flex-1 min-w-0 gap-1'
          style={{ paddingLeft: `${node.level * 16}px` }}
        >
          {/* Key + value */}
          <div className='flex items-center flex-wrap min-w-0'>
            {hasChildren ? (
              <button
                onClick={() => onToggle(node.path)}
                className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1'
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3 text-gray-600 dark:text-gray-400' />
                ) : (
                  <ChevronRight className='w-3 h-3 text-gray-600 dark:text-gray-400' />
                )}
              </button>
            ) : (
              <div className='w-4' />
            )}

            <span className='text-blue-600 dark:text-blue-400 font-medium mr-1 text-xs'>
              {node.key}:
            </span>

            {hasChildren ? (
              <span className='text-gray-600 dark:text-gray-400 text-xs'>
                {node.type === 'array'
                  ? `[${Array.isArray(node.value) ? node.value.length : 0}]`
                  : `{${Object.keys(node.value || {}).length}}`}
              </span>
            ) : (
              <span
                className={`text-xs font-mono break-all ${
                  node.type === 'string'
                    ? 'text-green-600 dark:text-green-400'
                    : node.type === 'number'
                      ? 'text-purple-600 dark:text-purple-400'
                      : node.type === 'boolean'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {node.type === 'string'
                  ? `"${node.value}"`
                  : String(node.value)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className='flex flex-wrap items-center gap-2 mt-1 sm:mt-0 sm:ml-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity'>
            {!hasChildren && (
              <>
                <button
                  onClick={() =>
                    onCopy(String(node.value), `copy-${node.path}`)
                  }
                  className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700'
                >
                  {copiedItem === `copy-${node.path}` ? (
                    <CheckCircle className='w-3.5 h-3.5 text-green-500' />
                  ) : (
                    <Copy className='w-3.5 h-3.5' />
                  )}
                </button>

                {isExtractionDone ? (
                  <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs'>
                    <CheckCircle className='w-3 h-3' />
                    <span>Extracted</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) =>
                      onExtract('response_body', node.path, node.value, e)
                    }
                    className='px-2 py-1 bg-[#136fb0] text-white rounded text-xs hover:bg-blue-700'
                  >
                    <Plus className='w-3 h-3 mr-1 inline' />
                    Extract
                  </button>
                )}
              </>
            )}

            <button
              onClick={(e) => onAssert(node.path, node.value, e)}
              className='px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded'
            >
              + Assert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ResponseViewer = ({
  isBottomLayout,
  usedStaticVariables = [],
  usedDynamicVariables = [],
  onRedirectToTab,
  onSaveAssertions,
  onExtractVariable,
  extractedVariables = {},
  existingExtractions = [],
  onRemoveExtraction,
}: ResponseViewerProps) => {
  const { responseData, assertions, setAssertions } = useRequest();
  console.log('assertions1231:', assertions);

  const { activeCollection, activeRequest } = useCollection();

  const [activeTab, setActiveTab] = useState<
    | 'body'
    | 'headers'
    | 'cookies'
    | 'test-results'
    | 'schema'
    | 'actual-request'
  >('body');

  // Raw search input — typed value
  const [searchInput, setSearchInput] = useState('');
  const { toast } = useToast();

  // Debounced search query — used for actual filtering
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showSearch, setShowSearch] = useState(false);

  // FIX: Lazy initial expansion — only expand root-level keys, not entire tree.
  // Previously a useEffect would walk the whole tree (O(n)) on every body change.
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root']),
  );

  const [copiedItem, setCopiedItem] = useState<string>('');
  const [showAssertionModal, setShowAssertionModal] = useState(false);
  const [activeFieldPath, setActiveFieldPath] = useState<string>('');
  const [activeFieldValue, setActiveFieldValue] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStats, setGenerationStats] = useState<any>(null);
  const [showAssertionUI, setShowAssertionUI] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [extractionModal, setExtractionModal] = useState<{
    isOpen: boolean;
    source: 'response_body' | 'response_header' | 'response_cookie';
    path: string;
    value: any;
    suggestedName: string;
  } | null>(null);
  const [variableName, setVariableName] = useState<string>('');

  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  useEffect(() => {
    if (responseData?.body) {
      setExpandedNodes(collectTopLevelPaths(responseData.body));
    }
  }, [responseData?.body]);

  // ---------------------------------------------------------------------------
  // FIX: Debounce search to avoid O(n) tree traversal on every keystroke.
  // ---------------------------------------------------------------------------
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchInput(val);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => setSearchQuery(val), 200);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // FIX: Memoize the full flattened node list — only recomputes when body changes.
  // ---------------------------------------------------------------------------
  const jsonNodes = useMemo(() => {
    if (!responseData?.body) return [];
    return parseJsonToNodes(responseData.body);
  }, [responseData?.body]);

  // ---------------------------------------------------------------------------
  // FIX: Move nodesToShow and visibleNodes computation OUT of renderJsonTree
  // into useMemo so they aren't recalculated on every render (e.g. hover state
  // changes, copiedItem changes, etc.)
  // ---------------------------------------------------------------------------
  const nodesToShow = useMemo(() => {
    if (!searchQuery) return null; // null = "not filtering"
    const searchLower = searchQuery.toLowerCase();
    const result = new Set<string>();
    jsonNodes.forEach((node) => {
      const hasChildren = node.type === 'object' || node.type === 'array';
      const matchesKey = node.key.toLowerCase().includes(searchLower);
      const matchesValue =
        !hasChildren && String(node.value).toLowerCase().includes(searchLower);
      const matchesPath = node.path.toLowerCase().includes(searchLower);
      if (matchesKey || matchesValue || matchesPath) {
        result.add(node.path);
        // Walk up to surface ancestor nodes
        let parentPath = node.parentPath;
        while (parentPath && parentPath !== 'root') {
          result.add(parentPath);
          const parentNode = jsonNodes.find((n) => n.path === parentPath);
          parentPath = parentNode ? parentNode.parentPath : '';
        }
      }
    });
    return result;
  }, [jsonNodes, searchQuery]);

  const visibleNodes = useMemo(() => {
    return jsonNodes.filter((node) => {
      if (node.level === 0) return true;
      if (nodesToShow) {
        return (
          nodesToShow.has(node.path) &&
          (node.parentPath === 'root' ||
            nodesToShow.has(node.parentPath) ||
            expandedNodes.has(node.parentPath))
        );
      }
      return expandedNodes.has(node.parentPath);
    });
  }, [jsonNodes, nodesToShow, expandedNodes]);

  // Pre-build extraction lookup set for O(1) per-node check in JsonRow
  const extractionPathSet = useMemo(
    () => new Set(existingExtractions.map((e) => e.path)),
    [existingExtractions],
  );

  // ---------------------------------------------------------------------------
  // FIX: Stable callbacks — prevents JsonRow from re-rendering when parent
  // state (hover, copiedItem, modals) changes unrelated to these handlers.
  // ---------------------------------------------------------------------------

  const handleCopy = useCallback((text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(''), 2000);
  }, []);

  const toggleNode = useCallback((path: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleModalClose = useCallback(() => {
    setShowAssertionModal(false);
    setActiveFieldPath('');
    setActiveFieldValue(null);
  }, []);

  const handleAddAssertionClick = useCallback(
    (fieldPath: string, value: any, event: React.MouseEvent) => {
      event.stopPropagation();
      setActiveFieldPath(fieldPath);
      setActiveFieldValue(value);
      setShowAssertionModal(true);
    },
    [],
  );

  const handleExtractClick = useCallback(
    (
      source: 'response_body' | 'response_header' | 'response_cookie',
      path: string,
      value: any,
      event: React.MouseEvent,
    ) => {
      event.stopPropagation();
      const suggestedName =
        path.split('.').pop()?.replace(/[[\]]/g, '') || 'extractedValue';
      const sanitizedName = sanitizeVariableName(suggestedName);
      setVariableName(sanitizedName);
      setExtractionModal({
        isOpen: true,
        source,
        path,
        value,
        suggestedName: sanitizedName,
      });
    },
    [],
  );

  // Typed wrapper so JsonRow's onExtract signature stays simple
  const handleBodyExtractClick = useCallback(
    (
      source: 'response_body',
      path: string,
      value: any,
      e: React.MouseEvent,
    ) => {
      handleExtractClick(source, path, value, e);
    },
    [handleExtractClick],
  );

  const handleVariableNameChange = useCallback((value: string) => {
    setVariableName(value);
  }, []);

  const handleGenerateForPath = useCallback((path: string, value: any) => {
    return generateAssertionsForPath(path, value);
  }, []);

  const handleAutoGenerateAssertions = useCallback(async () => {
    if (!responseData) {
      toast({
        title: 'No Response',
        description: 'Send a request first to generate assertions',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const responseSize =
        new Blob([JSON.stringify(responseData.body)]).size / (1024 * 1024);

      if (responseSize > 5) {
        const confirmed = window.confirm(
          `This response is ${responseSize.toFixed(1)}MB. ` +
            `Auto-generating assertions may take a while. Continue?`,
        );
        if (!confirmed) {
          setIsGenerating(false);
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      const startTime = performance.now();
      const { assertions: newAssertions, stats } =
        generateAssertionsWithStats(responseData);
      const duration = performance.now() - startTime;

      setGenerationStats(stats);

      const messages: string[] = [];
      if (stats.truncated)
        messages.push(
          `Reached limit of ${ASSERTION_LIMITS.MAX_ASSERTIONS} assertions`,
        );
      if (stats.skippedDeepPaths > 0)
        messages.push(`${stats.skippedDeepPaths} deeply nested paths skipped`);
      if (stats.skippedLargeArrays > 0)
        messages.push(
          `${stats.skippedLargeArrays} large arrays partially processed`,
        );

      const assertionsMatch = (a: any, b: any) =>
        a.description === b.description &&
        a.category === b.category &&
        a.type === b.type;

      const merged = newAssertions.map((newA) => {
        const existing = assertions.find((ex) => assertionsMatch(ex, newA));
        return existing
          ? { ...newA, enabled: existing.enabled ?? true }
          : { ...newA, enabled: false };
      });

      setAssertions(merged);

      if (messages.length > 0) {
        toast({
          title: `Generated ${stats.totalAssertions} Assertions`,
          description: messages.join(' • '),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Assertions Generated',
          description: `${merged.length} assertions ready in ${duration.toFixed(0)}ms. Enable them in Manage Assertions.`,
          variant: 'success',
        });
      }

      console.log(
        `[Performance] Generated ${merged.length} assertions in ${duration.toFixed(0)}ms`,
        messages.length ? messages : 'No limits hit',
      );
    } catch (error) {
      console.error('[Assertion Generator] Error:', error);
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate assertions',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [responseData, assertions, setAssertions, toast]);

  // ---------------------------------------------------------------------------
  // Expand / collapse all
  // ---------------------------------------------------------------------------

  const handleExpandAll = useCallback(() => {
    if (responseData?.body) {
      setExpandedNodes(collectAllPaths(responseData.body));
    }
  }, [responseData?.body]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // ---------------------------------------------------------------------------
  // Assertion select handler (v2 logic preserved exactly)
  // ---------------------------------------------------------------------------

  const handleAssertionSelect = useCallback(
    (assertionType: string, config?: any) => {
      if (assertionType === 'batch-all') {
        const {
          suggestedAssertions: suggestedToAdd = [],
          assertionsToRemove: toRemoveIds = [],
          manualAssertions: manualToAdd = [],
          generalAssertions: generalToAdd = [],
        } = config;

        let updated = [...assertions];

        // 1. Removals
        if (toRemoveIds.length > 0) {
          updated = updated.map((a: any) =>
            toRemoveIds.includes(a.id) ? { ...a, enabled: false } : a,
          );
        }

        // 2. Suggested
        suggestedToAdd.forEach((assertion: any) => {
          const idx = updated.findIndex((a: any) => a.id === assertion.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], enabled: true };
          } else {
            updated.push({ ...assertion, enabled: true });
          }
        });

        // 3. Manual
        manualToAdd.forEach((assertion: any) => {
          updated.push({ ...assertion, enabled: true });
        });

        // 4. General
        generalToAdd.forEach(
          ({ gType, config: gConfig, richDescription }: any) => {
            let description = richDescription ?? '';
            let finalType = gType;

            if (!description) {
              switch (gType) {
                case 'response_time':
                  description = `Response time should be ${gConfig.comparison === 'less' ? 'less than' : 'more than'} ${gConfig.value}ms`;
                  break;
                case 'payload_size':
                  description = `Payload size should be ${gConfig.comparison === 'less' ? 'less than' : 'more than'} ${gConfig.value}KB`;
                  break;
                case 'status_equals':
                  description = `Response status should be ${gConfig.value}`;
                  break;
                case 'contains_text':
                case 'contains_static':
                case 'contains_dynamic':
                case 'contains_extracted':
                  description = `Response should contain: "${gConfig.value}"`;
                  finalType = 'contains';
                  break;
                default:
                  description = `${gType}: ${gConfig.value}`;
              }
            }

            if (
              [
                'contains_text',
                'contains_static',
                'contains_dynamic',
                'contains_extracted',
              ].includes(gType)
            ) {
              finalType = 'contains';
            }

            updated.push({
              id: `general-${gType}-${Date.now()}-${Math.random()}`,
              type: finalType,
              displayType: gType,
              category: getCategoryForAssertionType(finalType),
              description,
              enabled: true,
              isGeneral: true,
              operator: gConfig.operator,
              value: gConfig.value,
              expectedValue: gConfig.value,
              ...(gConfig.expectedTime && {
                expectedTime: gConfig.expectedTime,
              }),
              ...(gConfig.expectedSize && {
                expectedSize: gConfig.expectedSize,
              }),
              comparison: gConfig.comparison,
            });
          },
        );

        setAssertions(removeDuplicateAssertions(updated));
        if (activeRequest?.id) collectionActions.markUnsaved(activeRequest.id);
        handleModalClose();
        return;
      }

      if (assertionType === 'suggested-multiple' && config?.assertions) {
        const assertionsToEnable: any[] = config.assertions;
        const toRemoveIds: string[] = config.assertionsToRemove || [];

        let updatedAssertions = [...assertions];

        if (toRemoveIds.length > 0) {
          updatedAssertions = updatedAssertions.map((a: any) =>
            toRemoveIds.includes(a.id) ? { ...a, enabled: false } : a,
          );
        }

        assertionsToEnable.forEach((assertion: any) => {
          const existingIndex = updatedAssertions.findIndex(
            (a: any) => a.id === assertion.id,
          );
          if (existingIndex !== -1) {
            updatedAssertions[existingIndex] = {
              ...updatedAssertions[existingIndex],
              enabled: true,
            };
          } else {
            updatedAssertions.push({ ...assertion, enabled: true });
          }
        });

        setAssertions(removeDuplicateAssertions(updatedAssertions));
        if (activeRequest?.id) collectionActions.markUnsaved(activeRequest.id);
      } else if (assertionType === 'manual-batch' && config?.assertions) {
        const newAssertions = config.assertions.map((a: any) => ({
          ...a,
          enabled: true,
        }));
        setAssertions(
          removeDuplicateAssertions([...assertions, ...newAssertions]),
        );
        if (activeRequest?.id) collectionActions.markUnsaved(activeRequest.id);
      } else if (assertionType === 'manual-direct' && config?.assertion) {
        const assertion = { ...config.assertion, enabled: true };
        setAssertions(removeDuplicateAssertions([...assertions, assertion]));
        if (activeRequest?.id) collectionActions.markUnsaved(activeRequest.id);
      } else {
        let description = '';
        let finalType = assertionType;

        if (config?.isGeneral) {
          switch (assertionType) {
            case 'response_time':
              description = `Response time should be ${config.comparison === 'less' ? 'less than' : 'more than'} ${config.value}ms`;
              break;
            case 'payload_size':
              description = `Payload size should be ${config.comparison === 'less' ? 'less than' : 'more than'} ${config.value}KB`;
              break;
            case 'status_equals':
              description = `Response status should be ${config.value}`;
              break;
            case 'contains_text':
              description = `Response should contain text: "${config.value}"`;
              finalType = 'contains';
              break;
            case 'contains_static':
              description = `Response should contain static value: "${config.value}"${config.scope === 'field' ? ` in ${activeFieldPath}` : ''}`;
              finalType = 'contains';
              break;
            case 'contains_dynamic':
              description = `Response should contain dynamic variable: ${config.value}${config.scope === 'field' ? ` in ${activeFieldPath}` : ''}`;
              finalType = 'contains';
              break;
            case 'contains_extracted':
              description = `Response should contain extracted variable: ${config.value}`;
              finalType = 'contains';
              break;
            default:
              description = `General assertion: ${assertionType}`;
          }
        } else {
          const operatorLabels: Record<string, string> = {
            equals: 'equals',
            field_not_equals: 'does not equal',
            field_greater_than: 'is greater than',
            field_less_than: 'is less than',
            field_greater_equal: 'is at least',
            field_less_equal: 'is at most',
            contains: 'contains',
            field_not_contains: 'does not contain',
            array_length: 'has length',
            greater_than: 'has more than',
            less_than: 'has fewer than',
            greater_than_or_equal: 'has at least',
            less_than_or_equal: 'has at most',
            not_equals: 'does not have',
          };
          const operatorText =
            operatorLabels[config.operator] || config.operator;
          if (config.type === 'array_length') {
            description =
              config.description ||
              `${activeFieldPath} array ${operatorText} ${config.expectedValue} elements`;
          } else {
            description = `${activeFieldPath} ${operatorText} "${config.expectedValue || config.value}"`;
          }
        }

        const baseAssertion = {
          id: `manual-${Date.now()}`,
          type: finalType,
          displayType: assertionType,
          category: getCategoryForAssertionType(finalType),
          description,
          value: activeFieldValue,
          expectedValue: config.expectedValue || config.value,
          enabled: true,
          operator: config.operator,
          ...config,
        };

        const newAssertion =
          config?.isGeneral && config.scope !== 'field'
            ? baseAssertion
            : { ...baseAssertion, field: normalizeFieldPath(activeFieldPath) };

        setAssertions(removeDuplicateAssertions([...assertions, newAssertion]));
        if (activeRequest?.id) collectionActions.markUnsaved(activeRequest.id);
      }

      handleModalClose();
    },
    [
      assertions,
      activeFieldPath,
      activeFieldValue,
      setAssertions,
      handleModalClose,
    ],
  );

  const confirmExtraction = useCallback(
    async (inputVariableName: string, transform?: string) => {
      if (!activeCollection?.id) {
        console.error('No active collection for extraction');
        return;
      }
      if (extractionModal && inputVariableName && onExtractVariable) {
        const sanitized = sanitizeVariableName(inputVariableName);
        const finalVariableName = `E_${sanitized}`;

        const isAuthToken =
          finalVariableName.toLowerCase().includes('token') ||
          finalVariableName.toLowerCase().includes('auth') ||
          finalVariableName.toLowerCase().includes('secret') ||
          finalVariableName.toLowerCase().includes('key') ||
          finalVariableName.toLowerCase().includes('password');

        const storageKey = `extracted_var_${activeCollection.id}_${finalVariableName}`;

        const payload = {
          name: finalVariableName,
          value: String(extractionModal.value),
          timestamp: Date.now(),
          collectionId: activeCollection.id,
          source: extractionModal.source,
          path: extractionModal.path,
        };

        // P1-A: IndexedDB is the primary store for ALL extracted variables.
        // Uses the generic key-value store so IDB quota is respected instead of
        // saturating localStorage with potentially large response values.
        try {
          await storageManager.saveGeneric(storageKey, payload);
        } catch (idbErr) {
          console.warn(
            '[Storage] IDB save failed, falling back to localStorage:',
            idbErr,
          );
          try {
            localStorage.setItem(storageKey, JSON.stringify(payload));
          } catch (lsErr: any) {
            if (lsErr.name === 'QuotaExceededError') {
              console.warn(
                '[Storage] localStorage quota exceeded — variable value not persisted',
              );
            } else {
              console.error(
                '[Storage] Failed to save extracted variable:',
                lsErr,
              );
            }
          }
        }

        // Additionally encrypt auth-sensitive variables in secureStorage
        // so they are never readable in plain-text from IDB/localStorage.
        if (isAuthToken) {
          secureStorage.saveEncrypted(storageKey, payload);
        }

        onExtractVariable({
          variableName: finalVariableName,
          name: finalVariableName,
          source: extractionModal.source,
          path: extractionModal.path,
          value: extractionModal.value,
          transform,
        });

        setExtractionModal(null);
        setVariableName('');
        if (activeRequest?.id) collectionActions.markUnsaved(activeRequest.id);
      }
    },
    [
      activeCollection?.id,
      activeRequest?.id,
      extractionModal,
      onExtractVariable,
    ],
  );

  // ---------------------------------------------------------------------------
  // Parse request
  // ---------------------------------------------------------------------------

  const requestDetails = useMemo(() => {
    if (responseData?.actualRequest) return responseData.actualRequest;
    if (!responseData?.requestCurl) return null;
    const curl = responseData.requestCurl;
    const methodMatch = curl.match(/-X '(\w+)'/);
    const urlMatch = curl.match(/'(https?:\/\/[^']+)'/);
    const bodyMatch = curl.match(/-d '({[^']+})'/);
    const headers: Record<string, string> = {};
    for (const match of curl.matchAll(/-H '([^:]+):\s*([^']+)'/g)) {
      headers[match[1]] = match[2];
    }
    return {
      method: methodMatch?.[1] || 'GET',
      url: urlMatch?.[1] || '',
      headers,
      body: bodyMatch?.[1] ? JSON.parse(bodyMatch[1]) : null,
    };
  }, [responseData?.actualRequest, responseData?.requestCurl]);

  // ---------------------------------------------------------------------------
  // Download helpers (unchanged logic, defined outside render path)
  // ---------------------------------------------------------------------------

  const downloadResponse = useCallback(() => {
    if (!responseData) return;
    const assertionLogs = responseData.assertionLogs || [];
    const hasAssertions = assertionLogs.length > 0;
    const passedCount = assertionLogs.filter(
      (a: any) => a.status === 'passed',
    ).length;
    const failedCount = assertionLogs.length - passedCount;
    const successRate =
      assertionLogs.length > 0
        ? Math.round((passedCount / assertionLogs.length) * 100)
        : 0;

    const exportData: any = {
      metadata: {
        exportedAt: new Date().toISOString(),
        ...(hasAssertions && {
          testSummary: {
            totalAssertions: assertionLogs.length,
            passed: passedCount,
            failed: failedCount,
            successRate: `${successRate}%`,
          },
        }),
      },
      request: {
        curl: responseData.requestCurl || '',
        details: {
          method: responseData.actualRequest?.method || 'GET',
          url: responseData.actualRequest?.url || '',
          headers: responseData.actualRequest?.headers || {},
          body: responseData.actualRequest?.body || null,
        },
      },
      response: {
        status:
          `${responseData.status || responseData.statusCode} ${responseData.statusText || ''}`.trim(),
        headers: responseData.headers || {},
        body: responseData.body || null,
        performance: {
          responseTime: responseData.metrics?.responseTime
            ? `${responseData.metrics.responseTime}ms`
            : 'N/A',
          size: responseData.metrics?.bytesReceived
            ? `${responseData.metrics.bytesReceived} bytes`
            : 'N/A',
        },
      },
    };

    if (hasAssertions) {
      exportData.assertionResults = assertionLogs.map((log: any) => ({
        assertion: {
          category: log.category || 'Unknown',
          type: log.type || 'Unknown',
          description: log.description || 'No description',
          field: log.field || '',
          operator: log.operator || '',
          expectedValue: log.expectedValue || '',
          priority: log.priority || log.severity || 'Medium',
          impact: log.impact || 'No impact specified',
          group: log.group || 'general',
        },
        result: {
          passed: log.status === 'passed',
          actualValue: log.actualValue,
          message:
            log.errorMessage ||
            (log.status === 'passed'
              ? `${log.description}`
              : `${log.description} - Failed`),
        },
      }));
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [responseData]);

  const downloadPostmanCollection = useCallback(() => {
    if (!responseData) return;
    const assertionLogs = responseData.assertionLogs || [];
    const passedCount = assertionLogs.filter(
      (a: any) => a.status === 'passed',
    ).length;
    const failedCount = assertionLogs.length - passedCount;
    const successRate =
      assertionLogs.length > 0
        ? Math.round((passedCount / assertionLogs.length) * 100)
        : 0;

    let urlComponents = {
      protocol: 'https',
      host: [] as string[],
      path: [] as string[],
    };
    if (responseData.actualRequest?.url) {
      try {
        const u = new URL(responseData.actualRequest.url);
        urlComponents = {
          protocol: u.protocol.replace(':', ''),
          host: u.hostname.split('.'),
          path: u.pathname.split('/').filter(Boolean),
        };
      } catch {
        urlComponents = {
          protocol: 'https',
          host: ['localhost'],
          path: ['api'],
        };
      }
    }

    const convertHeaders = (h: Record<string, string>) =>
      Object.entries(h || {}).map(([key, value]) => ({
        key,
        value,
        type: 'text',
      }));

    const createRequestBody = (body: any) => {
      if (!body) return undefined;
      return {
        mode: 'raw',
        raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
        options: { raw: { language: 'json' } },
      };
    };

    const postmanCollection = {
      info: {
        name: 'api result',
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: `API Test Results - ${passedCount}/${assertionLogs.length} assertions passed (${successRate}% success rate)`,
      },
      item: [
        {
          name: `API Test - ${responseData.actualRequest?.url || 'Unknown URL'}`,
          request: {
            method: responseData.actualRequest?.method || 'GET',
            header: convertHeaders(responseData.actualRequest?.headers || {}),
            url: {
              raw: responseData.actualRequest?.url || '',
              protocol: urlComponents.protocol,
              host: urlComponents.host,
              path: urlComponents.path,
            },
            ...(responseData.actualRequest?.body && {
              body: createRequestBody(responseData.actualRequest.body),
            }),
          },
          response: [
            {
              name: 'Response',
              originalRequest: {
                method: responseData.actualRequest?.method || 'GET',
                header: convertHeaders(
                  responseData.actualRequest?.headers || {},
                ),
                url: responseData.actualRequest?.url || '',
                ...(responseData.actualRequest?.body && {
                  body: createRequestBody(responseData.actualRequest.body),
                }),
              },
              status: responseData.status || 200,
              code: responseData.status || 200,
              _postman_previewlanguage: 'json',
              header: convertHeaders(responseData.headers || {}),
              body:
                typeof responseData.body === 'string'
                  ? responseData.body
                  : JSON.stringify(responseData.body, null, 2),
            },
          ],
          event:
            assertionLogs.length > 0
              ? [
                  {
                    listen: 'test',
                    script: {
                      exec: [
                        '// Generated API Test Results',
                        `// Total Assertions: ${assertionLogs.length}`,
                        `// Passed: ${passedCount}`,
                        `// Failed: ${failedCount}`,
                        `// Success Rate: ${successRate}%`,
                        '',
                        '// Assertion Results:',
                        ...assertionLogs.map(
                          (log: any, i: number) =>
                            `// ${i + 1}. ${log.status === 'passed' ? '✅ PASS' : '❌ FAIL'}: ${log.description || 'Unknown assertion'} - ${log.errorMessage || 'Success'}`,
                        ),
                      ],
                      type: 'text/javascript',
                    },
                  },
                ]
              : [],
        },
      ],
      variable: [
        {
          key: 'baseUrl',
          value: responseData.actualRequest?.url
            ? new URL(responseData.actualRequest.url).origin
            : 'https://api.example.com',
          type: 'string',
        },
      ],
    };

    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-result-postman-collection-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [responseData]);

  // ---------------------------------------------------------------------------
  // Tabs config
  // ---------------------------------------------------------------------------

  const executedAssertionCount = useMemo(
    () => responseData?.assertionLogs?.length ?? 0,
    [responseData?.assertionLogs],
  );

  const tabs = useMemo(
    () => [
      { id: 'body', label: 'Body' },
      {
        id: 'headers',
        label: 'Headers',
        count: Object.keys(responseData?.headers || {}).length,
      },
      { id: 'cookies', label: 'Cookies' },
      {
        id: 'test-results',
        label: executedAssertionCount === 1 ? 'Assertion' : 'Assertions',
        hasIndicator: false,
      },
      {
        id: 'schema',
        label: 'Schema',
        hasIndicator: !!responseData?.schemaValidation,
      },
      {
        id: 'actual-request',
        label: 'Actual Request',
        hasIndicator: !!responseData?.requestCurl,
      },
    ],
    [
      responseData?.assertionLogs,
      responseData?.schemaValidation,
      responseData?.requestCurl,
    ],
  );

  // ---------------------------------------------------------------------------
  // Total top-level rows count (for the "N rows" label)
  // ---------------------------------------------------------------------------
  const totalRows = useMemo(
    () => jsonNodes.filter((n) => n.level === 0).length,
    [jsonNodes],
  );

  // ---------------------------------------------------------------------------
  // Early return — no data
  // ---------------------------------------------------------------------------

  if (!responseData) {
    return (
      <div className='flex-1 flex items-center justify-center bg-white dark:bg-gray-900 p-2'>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>
            No response yet
          </p>
          <p className='text-sm text-gray-500'>
            Send a request to see the response here
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-full'
      }`}
    >
      {/* ── Header ── */}
      <div className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
        {/* Tab bar + status */}
        <div className='flex items-center justify-between border-b border-gray-200 dark:border-gray-700'>
          <nav className='flex space-x-6 px-4 whitespace-nowrap overflow-x-auto scrollbar-thin no-scrollbar'>
            <TooltipProvider>
              {tabs.map((tab) => {
                const isTooltipTab =
                  tab.id === 'test-results' || tab.id === 'schema';
                const tooltipText =
                  tab.id === 'test-results'
                    ? 'Assertion results'
                    : tab.id === 'schema'
                      ? 'Schema comparison results'
                      : '';

                const button = (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {/* <span className='text-xs md:text-sm'>{tab.label}</span> */}

                    <span className='text-xs md:text-sm'>
                      {tab.label}
                      {tab.id === 'test-results' &&
                        executedAssertionCount > 0 && (
                          <span className='relative -top-1.5 text-[0.7rem] font-semibold text-gray-500 dark:text-gray-400 ml-px'>
                            {executedAssertionCount}
                          </span>
                        )}
                      {tab.id === 'headers' && (tab.count ?? 0) > 0 && (
                        <span className='relative -top-1.5 text-[0.7rem] font-semibold text-gray-500 dark:text-gray-400 ml-px'>
                          {tab.count}
                        </span>
                      )}
                      {tab.hasIndicator && (
                        <span className='relative -top-1.5 ml-0.5 inline-block w-1.5 h-1.5 bg-blue-500 rounded-full' />
                      )}
                    </span>
                  </button>
                );

                if (!isTooltipTab) return button;
                return (
                  <Tooltip key={tab.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent>{tooltipText}</TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </nav>

          {/* Status summary — inline to avoid extra component re-renders */}
          <div className='px-4 flex items-center space-x-4 text-sm'>
            <div className='flex items-center space-x-1'>
              <CheckCircle
                className={`h-3 md:h-4 w-3 md:w-4 ${getStatusColor(responseData.status)}`}
              />
              <span
                className={`text-xs md:text-md font-medium ${getStatusColor(responseData.status)}`}
              >
                {responseData.status} {responseData.statusText || ''}
              </span>
            </div>
            <div className='flex items-center space-x-1'>
              <Clock className='h-3 md:h-4 w-3 md:w-4 text-gray-600 dark:text-gray-400' />
              <span className='text-xs md:text-md font-medium text-gray-900 dark:text-gray-100'>
                {responseData?.metrics?.responseTime || 0}ms
              </span>
            </div>
            <div className='flex items-center space-x-1'>
              <HardDrive className='h-3 md:h-4 w-3 md:w-4 text-gray-600 dark:text-gray-400' />
              <span className='text-xs md:text-md font-medium text-gray-900 dark:text-gray-100'>
                {calculateResponseSize(responseData.body)}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className='flex items-center justify-between px-4 py-1'>
          <div className='flex items-center space-x-4'>
            <button className='flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'>
              <Stars className='w-4 h-4' />
              <span className='text-xs md:text-sm'>Pretty</span>
            </button>
            <button className='flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'>
              <Code className='w-4 h-4' />
              <span className='text-xs md:text-sm'>Raw</span>
            </button>
            {/* <button
              onClick={handleAutoGenerateAssertions}
              disabled={!responseData || isGenerating}
              className='flex items-center space-x-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 disabled:opacity-50'
            >
              {isGenerating ? (
                <>
                  <svg
                    className='w-4 h-4 animate-spin'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8v8z'
                    />
                  </svg>
                  <span className='text-xs md:text-sm hidden md:block'>
                    Generating...
                  </span>
                </>
              ) : (
                <>
                  <Stars className='w-4 h-4' />
                  <span className='text-xs md:text-sm hidden md:block'>
                    Auto-Generate
                  </span>
                </>
              )}
            </button> */}
            <button
              onClick={() => setShowAssertionUI(true)}
              disabled={
                !responseData ||
                responseData.status < 200 ||
                responseData.status >= 300
              }
              className='flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-blue-600 dark:disabled:hover:text-blue-400'
            >
              <ListChecks className='w-4 h-4' />
              <span className='text-xs md:text-sm hidden md:block'>
                Manage Assertions
              </span>
              <span className='text-xs md:text-sm md:hidden block'>
                Assertions
              </span>
            </button>
          </div>

          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setShowSearch((s) => !s)}
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              title='Search in response'
            >
              <Search className='h-4 w-4' />
            </button>
            <button
              onClick={() =>
                handleCopy(
                  JSON.stringify(responseData.body, null, 2),
                  'full-response',
                )
              }
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              title='Copy response'
            >
              {copiedItem === 'full-response' ? (
                <CheckCircle className='h-4 w-4 text-green-600' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </button>
            <div className='relative group'>
              <button
                className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                title='Download Options'
              >
                <Download className='h-4 w-4' />
              </button>
              <div className='absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10'>
                <button
                  onClick={downloadResponse}
                  className='w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-md'
                >
                  <Download className='w-4 h-4' />
                  Export JSON
                </button>
                <button
                  onClick={downloadPostmanCollection}
                  className='w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-md'
                >
                  <Download className='w-4 h-4' />
                  Export Postman
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsFullscreen((f) => !f)}
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'View fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className='h-4 w-4' />
              ) : (
                <Maximize2 className='h-4 w-4' />
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className='px-4 py-2 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center space-x-2'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400' />
                <input
                  type='text'
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder='Search in response...'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm'
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchInput('');
                  setSearchQuery('');
                }}
                className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab content ── */}
      <div className='flex-1 overflow-auto p-4 scrollbar-thin'>
        {/* Body tab */}
        {activeTab === 'body' && (
          <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
            <div className='bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
              <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                {totalRows} {totalRows === 1 ? 'row' : 'rows'}
              </span>
              <div className='flex items-center gap-2'>
                <button
                  onClick={handleExpandAll}
                  className='text-xs text-blue-600 dark:text-blue-400 hover:underline'
                >
                  Expand All
                </button>
                <button
                  onClick={handleCollapseAll}
                  className='text-xs text-blue-600 dark:text-blue-400 hover:underline'
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* FIX: Each row is a memoized JsonRow. copiedItem state still
                propagates but only rows matching the copied path re-render
                because of the stable callback + memo combination. */}
            <VirtualizedJsonViewer
              nodes={visibleNodes}
              renderNode={(node, index) => (
                <JsonRow
                  key={node.path}
                  node={node}
                  index={index}
                  isExpanded={expandedNodes.has(node.path)}
                  isExtractionDone={extractionPathSet.has(node.path)}
                  copiedItem={copiedItem}
                  onToggle={toggleNode}
                  onCopy={handleCopy}
                  onExtract={handleBodyExtractClick}
                  onAssert={handleAddAssertionClick}
                />
              )}
              maxHeight={600}
              threshold={100}
              overscan={10}
              estimatedRowHeight={36}
            />
          </div>
        )}

        {/* Headers tab */}
        {activeTab === 'headers' && (
          <div className='space-y-2'>
            {Object.entries(responseData?.headers || {}).map(([key, value]) => (
              <div
                key={key}
                className='group flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900'
              >
                <div className='flex-1 min-w-0 mr-4'>
                  <div className='flex items-center space-x-2'>
                    <Hash className='w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0' />
                    <span className='font-medium text-gray-900 dark:text-gray-100 text-sm'>
                      {key}
                    </span>
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-400 font-mono mt-1 break-all'>
                    {String(value)}
                  </p>
                </div>
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0'>
                  <button
                    onClick={() => handleCopy(value as string, `header-${key}`)}
                    className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                    title='Copy value'
                  >
                    {copiedItem === `header-${key}` ? (
                      <CheckCircle className='w-3.5 h-3.5 text-green-500' />
                    ) : (
                      <Copy className='w-3.5 h-3.5' />
                    )}
                  </button>

                  {existingExtractions.some(
                    (e) => e.source === 'response_header' && e.path === key,
                  ) ? (
                    <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs'>
                      <CheckCircle className='w-3 h-3' />
                      <span>Extracted</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) =>
                        handleExtractClick('response_header', key, value, e)
                      }
                      className='px-2 py-1 bg-[#136fb0] text-white rounded text-xs hover:bg-blue-700 transition-colors'
                    >
                      <Plus className='w-3 h-3 mr-1 inline' />
                      Extract
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveFieldPath(`headers.${key}`);
                      setActiveFieldValue(value);
                      setShowAssertionModal(true);
                    }}
                    className='px-1.5 py-0.5 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors'
                  >
                    + Assert
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cookies tab */}
        {activeTab === 'cookies' && (
          <div className='text-center py-8 text-gray-600 dark:text-gray-400'>
            <Cookie className='w-12 h-12 text-gray-400 mx-auto mb-3' />
            <p>No cookies found in response</p>
          </div>
        )}

        {/* Test results tab */}
        {activeTab === 'test-results' &&
          Array.isArray(responseData.assertionLogs) && (
            <div className='space-y-4'>
              {responseData.assertionLogs.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <CheckCircle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p>No assertions configured for this request</p>
                </div>
              ) : (
                <>
                  {/* ── Summary bar (same as ResponseExplorer) ── */}
                  <div className='flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                    <div className='flex items-center space-x-2'>
                      <CheckCircle className='w-5 h-5 text-green-600 dark:text-green-400' />
                      <span className='font-medium text-gray-900 dark:text-gray-100'>
                        {
                          responseData.assertionLogs.filter(
                            (a: any) => a.status === 'passed',
                          ).length
                        }{' '}
                        Passed
                      </span>
                    </div>
                    {responseData.assertionLogs.filter(
                      (a: any) => a.status !== 'passed',
                    ).length > 0 && (
                      <div className='flex items-center space-x-2'>
                        <X className='w-5 h-5 text-red-600 dark:text-red-400' />
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          {
                            responseData.assertionLogs.filter(
                              (a: any) => a.status !== 'passed',
                            ).length
                          }{' '}
                          Failed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Individual assertion rows ── */}
                  <div className='space-y-2'>
                    {responseData.assertionLogs.map(
                      (assertion: any, idx: number) => (
                        <div
                          key={idx}
                          className={`border rounded-lg p-4 ${
                            assertion.status === 'passed'
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}
                        >
                          <div className='flex items-start space-x-3 flex-1'>
                            {assertion.status === 'passed' ? (
                              <CheckCircle className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
                            ) : (
                              <X className='w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5' />
                            )}
                            <div className='flex-1 min-w-0'>
                              <h4
                                className={`font-medium ${
                                  assertion.status === 'passed'
                                    ? 'text-green-900 dark:text-green-100'
                                    : 'text-red-900 dark:text-red-100'
                                }`}
                              >
                                {assertion.description}
                              </h4>
                              {assertion.errorMessage && (
                                <p className='mt-2 text-sm text-red-700 dark:text-red-400'>
                                  {assertion.errorMessage}
                                </p>
                              )}
                              <div className='mt-2 flex flex-wrap gap-2'>
                                {assertion.expectedValue && (
                                  <span className='text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 font-mono overflow-x-auto scrollbar-thin whitespace-nowrap'>
                                    Expected: {assertion.expectedValue}
                                  </span>
                                )}
                                {assertion.operator && (
                                  <span className='text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 font-mono whitespace-nowrap'>
                                    Operator: {assertion.operator}
                                  </span>
                                )}
                                {assertion.category && (
                                  <span className='text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 capitalize'>
                                    {assertion.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        {/* Schema tab */}
        {activeTab === 'schema' && (
          <div className='p-4 overflow-auto scrollbar-thin h-full'>
            {responseData.schemaValidation ? (
              <div className='space-y-4'>
                <div
                  className={`border rounded-lg p-4 ${responseData.schemaValidation.passed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}
                >
                  <div className='flex items-center space-x-2'>
                    {responseData.schemaValidation.passed ? (
                      <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                    ) : (
                      <X className='h-5 w-5 text-red-600 flex-shrink-0' />
                    )}
                    <div>
                      <h3
                        className={`font-medium ${responseData.schemaValidation.passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}
                      >
                        Schema Validation{' '}
                        {responseData.schemaValidation.passed
                          ? 'Passed'
                          : 'Failed'}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        Schema: {responseData.schemaValidation.name}
                      </p>
                    </div>
                  </div>
                </div>

                {!responseData.schemaValidation.passed &&
                  responseData.schemaValidation.results?.length > 0 && (
                    <div className='border rounded-lg p-4 bg-white dark:bg-gray-900'>
                      <h4 className='font-medium text-sm mb-3 text-red-700 dark:text-red-400'>
                        Validation Errors:
                      </h4>
                      <ul className='space-y-2 text-sm'>
                        {responseData.schemaValidation.results.map(
                          (issue: any, idx: number) => (
                            <li
                              key={idx}
                              className='flex flex-col border-l-2 border-red-400 pl-2'
                            >
                              <span className='font-medium text-gray-800 dark:text-gray-200'>
                                {issue.field}
                              </span>
                              <span className='text-gray-600 dark:text-gray-400'>
                                {issue.description}
                              </span>
                              {issue.value !== undefined &&
                                issue.value !== null && (
                                  <span className='text-xs text-gray-400'>
                                    Value: {String(issue.value)}
                                  </span>
                                )}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <div className='text-center py-8'>
                <div className='text-gray-500 dark:text-gray-400 mb-2'>
                  No schema validation results
                </div>
                <div className='text-sm text-gray-400'>
                  Schema validation will appear here when available
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actual request tab */}
        {activeTab === 'actual-request' && requestDetails && (
          <div className='space-y-4'>
            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                Request URL:
              </h3>
              <div className='flex items-center space-x-3'>
                <span className='px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-semibold text-sm'>
                  {requestDetails.method}
                </span>
                <span className='text-sm text-gray-900 dark:text-gray-100 font-mono flex-1 truncate'>
                  {requestDetails.url}
                </span>
                <button
                  onClick={() => handleCopy(requestDetails.url, 'request-url')}
                  className='p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
                  title='Copy URL'
                >
                  {copiedItem === 'request-url' ? (
                    <CheckCircle className='w-4 h-4 text-green-600' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                Headers:
              </h3>
              <div className='overflow-x-auto scrollbar-thin'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-200 dark:border-gray-700'>
                      <th className='text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-semibold'>
                        Name
                      </th>
                      <th className='text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-semibold'>
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(requestDetails.headers).map(
                      ([name, value]) => (
                        <tr
                          key={name}
                          className='border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                        >
                          <td className='py-2 px-3 text-gray-900 dark:text-gray-100 font-medium'>
                            {name}
                          </td>
                          <td className='py-2 px-3 text-gray-600 dark:text-gray-400 font-mono'>
                            {String(value)}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {requestDetails.authorizationType &&
              requestDetails.authorizationType !== 'none' &&
              requestDetails.authorization && (
                <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                    Authorization:
                  </h3>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16 flex-shrink-0'>
                        Type
                      </span>
                      <span className='px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium capitalize'>
                        {requestDetails.authorizationType === 'bearer'
                          ? 'Bearer Token'
                          : requestDetails.authorizationType === 'basic'
                            ? 'Basic Auth'
                            : requestDetails.authorizationType === 'apiKey'
                              ? 'API Key'
                              : requestDetails.authorizationType}
                      </span>
                    </div>
                    {requestDetails.authorizationType === 'bearer' &&
                      requestDetails.authorization.token && (
                        <div className='flex items-start space-x-2'>
                          <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16 flex-shrink-0 mt-1.5'>
                            Token
                          </span>
                          <div className='flex-1 min-w-0 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 relative group'>
                            <p className='text-xs font-mono text-gray-700 dark:text-gray-300 break-all pr-8'>
                              {requestDetails.authorization.token}
                            </p>
                            <button
                              onClick={() =>
                                handleCopy(
                                  requestDetails.authorization.token,
                                  'auth-token',
                                )
                              }
                              className='absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity'
                              title='Copy token'
                            >
                              {copiedItem === 'auth-token' ? (
                                <CheckCircle className='w-3.5 h-3.5 text-green-500' />
                              ) : (
                                <Copy className='w-3.5 h-3.5' />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    {requestDetails.authorizationType === 'basic' && (
                      <>
                        {requestDetails.authorization.username && (
                          <div className='flex items-center space-x-2'>
                            <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16 flex-shrink-0'>
                              User
                            </span>
                            <span className='text-sm font-mono text-gray-700 dark:text-gray-300'>
                              {requestDetails.authorization.username}
                            </span>
                          </div>
                        )}
                        {requestDetails.authorization.password && (
                          <div className='flex items-center space-x-2'>
                            <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16 flex-shrink-0'>
                              Pass
                            </span>
                            <span className='text-sm font-mono text-gray-700 dark:text-gray-300'>
                              {'•'.repeat(8)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {requestDetails.authorizationType === 'apiKey' &&
                      requestDetails.authorization.key && (
                        <div className='flex items-center space-x-2'>
                          <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16 flex-shrink-0'>
                            Key
                          </span>
                          <span className='text-sm font-mono text-gray-700 dark:text-gray-300'>
                            {requestDetails.authorization.key}:{' '}
                            {requestDetails.authorization.value}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

            {requestDetails.body && (
              <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    Body:
                  </h3>
                  <span className='text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>
                    Body Type: application/json
                  </span>
                </div>
                <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-3 relative'>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(requestDetails.body, null, 2),
                        'request-body',
                      )
                    }
                    className='absolute top-2 right-2 p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
                    title='Copy body'
                  >
                    {copiedItem === 'request-body' ? (
                      <CheckCircle className='w-4 h-4 text-green-600' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                  </button>
                  <pre className='text-sm text-gray-900 dark:text-gray-100 font-mono overflow-x-auto scrollbar-thin'>
                    {JSON.stringify(requestDetails.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Assertion manager modal ── */}
      {showAssertionUI && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                API Assertions Manager
              </h2>
              <button
                onClick={() => setShowAssertionUI(false)}
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>
            <div className='flex-1 overflow-auto'>
              <ApiAssertionInterface
                assertions={assertions}
                responseData={responseData}
                onUpdateAssertions={setAssertions}
                onSaveAssertions={onSaveAssertions}
                mode='save'
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Assertion modal ── */}
      <AssertionModal
        fieldPath={activeFieldPath}
        fieldValue={activeFieldValue}
        isOpen={showAssertionModal}
        onSelect={handleAssertionSelect}
        onClose={handleModalClose}
        allAssertions={assertions}
        variables={usedStaticVariables}
        dynamicVariables={usedDynamicVariables}
        setAssertions={setAssertions}
        onRedirectToTab={onRedirectToTab}
        onSave={onSaveAssertions}
        onGenerateForPath={handleGenerateForPath}
      />

      {/* ── Extraction modal ── */}
      {extractionModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md'>
            <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                Extract Variable
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                Configure how to extract and store this value
              </p>
            </div>
            <div className='p-4 space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Variable Name
                </label>
                <input
                  type='text'
                  value={variableName}
                  onChange={(e) => handleVariableNameChange(e.target.value)}
                  className='w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm'
                  placeholder='variable_name'
                />
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  Only letters, numbers, and underscores allowed.
                </p>
              </div>
              <div className='flex items-center space-x-2 w-full'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 w-16'>
                  Source
                </label>
                <input
                  type='text'
                  value={extractionModal.source
                    .replace('_', ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  readOnly
                  className='flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm'
                />
              </div>
              <div className='flex items-center space-x-2 w-full'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 w-16'>
                  Path
                </label>
                <input
                  type='text'
                  value={extractionModal.path}
                  readOnly
                  className='flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Preview Value
                </label>
                <div className='p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-x-auto scrollbar-thin'>
                  <code className='text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                    {typeof extractionModal.value === 'object'
                      ? JSON.stringify(extractionModal.value, null, 2)
                      : String(extractionModal.value)}
                  </code>
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Transform (Optional)
                </label>
                <input
                  type='text'
                  id='transform'
                  className='w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm'
                  placeholder='e.g., value.toUpperCase(), parseInt(value)'
                />
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  JavaScript expression to transform the value (use 'value' as
                  variable)
                </p>
              </div>
            </div>
            <div className='flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                onClick={() => {
                  setExtractionModal(null);
                  setVariableName('');
                }}
                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300'
              >
                Cancel
              </button>
              <Button
                onClick={() => {
                  const transform = (
                    document.getElementById('transform') as HTMLInputElement
                  )?.value;
                  if (variableName)
                    confirmExtraction(variableName, transform || undefined);
                }}
                disabled={!variableName}
              >
                Extract Variable
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extracted variables banner ── */}
      {activeCollection && Object.keys(extractedVariables).length > 0 && (
        <div className='px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center gap-2 text-xs'>
            <span className='text-gray-600 dark:text-gray-400'>
              Extracted token from:
            </span>
            <span className='text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400'>
              {activeRequest?.name || 'Request'}
            </span>
            <span className='ml-auto text-gray-500'>
              {Object.keys(extractedVariables).length} variable(s)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseViewer;
