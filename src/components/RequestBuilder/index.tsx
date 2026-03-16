'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  GripVertical,
  GripHorizontal,
  PanelLeft,
  PanelRight,
  Layers,
} from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { useIsMobile } from '@/hooks/use-mobile';
import RequestEditor from './RequestEditor/RequestEditor';
import ResponseViewer from './ResponseViewer/ResponseViewer';
import Sidebar from './Sidebar/Sidebar';
import { useRequest } from '@/hooks/useRequest';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import WelcomeImage from '../../assests/images/Welcome_optra.webp';
import { SanitizeTestRunner } from '@/components/RequestBuilder/sanitizeTest/sanitizeTest';
import SecurityScanView from '@/components/RequestBuilder/SecurityScan/SecurityScanView';
import SecurityScanWizard from '@/components/RequestBuilder/SecurityScan/Securityscanwizard';

import { useCollectionStore, collectionActions } from '@/store/collectionStore';
import { useDataManagement } from '@/hooks/useDataManagement';
import PerformanceTesting from './PerformanceTesting/PerformanceTesting';
import { useToast } from '@/hooks/use-toast';
import PerformanceScanView from './PerformanceSecurityScan/PerformanceView';
import { RequestEditorProvider } from './RequestEditor/context/RequestEditorContext';

const RequestBuilder = () => {
  const { toast } = useToast();
  const { activeEnvironment } = useDataManagement();
  const saveRequestRef = useRef<(() => Promise<void>) | null>(null);
  const [usedVariables, setUsedVariables] = useState<{
    staticVars: Array<{ name: string; value: string }>;
    dynamicVars: Array<{ name: string; value: string }>;
  }>({
    staticVars: [],
    dynamicVars: [],
  });

  const [activeRequestTab, setActiveRequestTab] = useState<string>('params');
  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, string>
  >({});

  const [existingExtractions, setExistingExtractions] = useState<
    Array<{ name: string; path: string; source?: string }>
  >([]);

  const {
    sanitizeTestRunner,
    securityScan,
    performanceScan,
    collections,
    performanceTest,
  } = useCollectionStore();
  const { currentWorkspace } = useWorkspace();
  const {
    refetch: refetchCollection,
    setActiveCollection,
    handleCreateRequest,
    activeCollection,
  } = useCollection();
  const { setResponseData, setRequestData } = useRequest();
  const isMobile = useIsMobile();
  const { activeRequest } = useCollection();

  const [isBottomLayout, setIsBottomLayout] = useState(true);
  const [resizePosition, setResizePosition] = useState(isMobile ? 60 : 50);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [activePanel, setActivePanel] = useState<'editor' | 'response'>(
    'editor',
  );
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCollection?.id) {
      const collectionVars = collectionActions.getExtractedVariables(
        activeCollection.id,
      );
      setExtractedVariables(collectionVars);
    } else {
      setExtractedVariables({});
    }
  }, [activeCollection?.id]);

  useEffect(() => {
    if (
      activeRequest?.extractVariables &&
      Array.isArray(activeRequest.extractVariables)
    ) {
      setExistingExtractions(activeRequest.extractVariables);
    } else {
      setExistingExtractions([]);
    }
  }, [activeRequest?.id, activeRequest?.extractVariables]);

  const handleExtractVariable = (extraction: {
    variableName: string;
    name: string;
    source: 'response_body' | 'response_header' | 'response_cookie';
    path: string;
    value: any;
    transform?: string;
  }) => {
    if (!activeCollection?.id) {
      console.error('No active collection - cannot extract variable');
      toast({
        title: 'Error',
        description: 'No active collection. Please select a collection first.',
      });
      return;
    }

    const collectionId = activeCollection.id;

    setExistingExtractions((prev) => {
      const exists = prev.some((e) => e.name === extraction.name);
      if (exists) {
        return prev.map((e) =>
          e.name === extraction.name
            ? {
                name: extraction.name,
                path: extraction.path,
                source: extraction.source,
              }
            : e,
        );
      }

      return [
        ...prev,
        {
          name: extraction.name,
          path: extraction.path,
          source: extraction.source,
        },
      ];
    });

    setExtractedVariables((prev) => {
      const updated = {
        ...prev,
        [extraction.name]: extraction.value,
      };

      collectionActions.setExtractedVariable(
        collectionId,
        extraction.name,
        extraction.value,
      );

      return updated;
    });
  };

  const handleRemoveExtraction = (name: string) => {
    if (!activeCollection?.id) {
      console.error('No active collection');
      return;
    }

    const collectionId = activeCollection.id;

    setExistingExtractions((prev) => prev.filter((e) => e.name !== name));

    setExtractedVariables((prev) => {
      const updated = { ...prev };
      delete updated[name];

      collectionActions.removeExtractedVariable(collectionId, name);

      return updated;
    });
  };

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = isBottomLayout ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [isBottomLayout],
  );

  const handleTouchResizeStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const startClientPos = isBottomLayout ? touch.clientY : touch.clientX;
      const containerEl = containerRef.current;
      if (!containerEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const containerSize = isBottomLayout
        ? containerRect.height
        : containerRect.width;
      const containerStart = isBottomLayout
        ? containerRect.top
        : containerRect.left;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
        const moveTouch = moveEvent.touches[0];
        const currentPos = isBottomLayout
          ? moveTouch.clientY
          : moveTouch.clientX;

        const newPosition =
          ((currentPos - containerStart) / containerSize) * 100;
        const minSize = isMobile ? 30 : 20;
        const maxSize = isMobile ? 70 : 80;
        setResizePosition(Math.max(minSize, Math.min(maxSize, newPosition)));
      };

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleTouchEnd);
    },
    [isBottomLayout, isMobile],
  );

  const handleRedirectToTab = useCallback((tabName: string) => {
    setActiveRequestTab(tabName);
  }, []);

  const sanitizeCollection = useMemo(() => {
    if (!sanitizeTestRunner.isOpen || !sanitizeTestRunner.collectionId) {
      return null;
    }
    return (
      collections.find((c) => c.id === sanitizeTestRunner.collectionId) || null
    );
  }, [sanitizeTestRunner.isOpen, sanitizeTestRunner.collectionId, collections]);

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      let newPosition;

      if (isBottomLayout) {
        newPosition = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      }

      const minSize = isMobile ? 30 : 20;
      const maxSize = isMobile ? 70 : 80;
      newPosition = Math.max(minSize, Math.min(maxSize, newPosition));
      setResizePosition(newPosition);
    },
    [isBottomLayout, isMobile],
  );

  const handleResizeEnd = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleResize]);

  const toggleLayout = useCallback(() => {
    if (isMobile) {
      setActivePanel(activePanel === 'editor' ? 'response' : 'editor');
    } else {
      setIsBottomLayout(!isBottomLayout);
      setResizePosition(50);
    }
  }, [isMobile, isBottomLayout, activePanel]);

  const toggleSidebar = useCallback(() => {
    setShowSidebar(!showSidebar);
  }, [showSidebar]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      refetchCollection();
      setActiveCollection(null);
      handleCreateRequest();
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (isMobile) {
      setIsBottomLayout(true);
      setShowSidebar(false);
      setResizePosition(60);
    } else {
      setShowSidebar(true);
    }
  }, [isMobile]);

  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setOpen(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  return (
    <>
      <RequestEditorProvider>
        <div className='flex h-full relative border border-gray-200 bg-background rounded-lg mt-2'>
          {showSidebar && (
            <div
              className={`${isMobile ? 'absolute z-10 h-full shadow-lg bg-white' : ''}`}
            >
              <Sidebar toggleSidebar={toggleSidebar} />
            </div>
          )}

          <div className='flex-1 flex flex-col overflow-hidden'>
            {isMobile && (
              <div className='flex justify-between items-center p-2 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700'>
                <button
                  onClick={toggleSidebar}
                  className='p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  aria-label='Toggle sidebar'
                >
                  {showSidebar ? (
                    <PanelRight size={18} />
                  ) : (
                    <PanelLeft size={18} />
                  )}
                </button>

                {/* <button
                onClick={toggleLayout}
                className="flex items-center gap-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                aria-label="Toggle view"
              >
                <Layers size={15} />
                <span className="text-xs md:text-sm whitespace-nowrap">
                  {activePanel === 'editor' ? 'View Response' : 'Edit Request'}
                </span>
              </button> */}
              </div>
            )}

            <div
              ref={containerRef}
              className={`flex-1 flex overflow-hidden ${
                isBottomLayout ? 'flex-col' : 'flex-row'
              }`}
            >
              {sanitizeTestRunner.isOpen && sanitizeCollection ? (
                <div className='flex-1 w-full h-full'>
                  <SanitizeTestRunner
                    collection={sanitizeCollection}
                    collections={collections}
                    environments={[]}
                    activeEnvironment={activeEnvironment}
                  />
                </div>
              ) : securityScan.isOpen && securityScan.request ? (
                <div className='flex-1 w-full h-full overflow-auto'>
                  <SecurityScanView
                    request={{
                      id: securityScan.request.id || '',
                      name: securityScan.request.name || 'Untitled Request',
                      method: securityScan.request.method,
                      url: securityScan.request.url || '',
                    }}
                    workspaceId={currentWorkspace?.id || ''}
                    environmentId={activeEnvironment?.id}
                    preRequestId={activeCollection?.preRequestId}
                    onClose={() => collectionActions.closeSecurityScan()}
                  />
                </div>
              ) : performanceScan?.isOpen && performanceScan.request ? (
                <>
                  <div className='flex-1 w-full h-full overflow-auto'>
                    <PerformanceScanView
                      request={{
                        id: performanceScan.request.id || '',
                        name:
                          performanceScan.request.name || 'Untitled Request',
                        method: performanceScan.request.method,
                        url: performanceScan.request.url || '',
                      }}
                      workspaceId={currentWorkspace?.id || ''}
                      environmentId={activeEnvironment?.id}
                      preRequestId={activeCollection?.preRequestId}
                      onClose={() => collectionActions.closePerformanceScan()}
                    />
                  </div>
                </>
              ) : performanceTest?.isOpen && performanceTest?.request ? (
                <div className='flex-1 w-full h-full overflow-auto'>
                  <PerformanceTesting
                    request={{
                      id: performanceTest.request.id || '',
                      name: performanceTest.request.name || 'Untitled Request',
                      method: performanceTest.request.method,
                      url: performanceTest.request.url || '',
                    }}
                    workspaceId={currentWorkspace?.id || ''}
                    environmentId={activeEnvironment?.id}
                    preRequestId={activeCollection?.preRequestId}
                    onClose={() => collectionActions.closePerformanceTesting()}
                  />
                </div>
              ) : (
                <>
                  {/* Request Editor */}
                  <div
                    className={`flex flex-col min-h-0 overflow-hidden ${
                      isMobile && activePanel === 'response' ? 'hidden' : ''
                    }`}
                    style={{
                      height: isBottomLayout ? `${resizePosition}%` : undefined,
                      width: !isBottomLayout ? `${resizePosition}%` : undefined,
                    }}
                  >
                    <RequestEditor
                      onUsedVariablesChange={setUsedVariables}
                      activeTab={activeRequestTab}
                      onTabChange={setActiveRequestTab}
                      onRegisterSave={(saveFn) => {
                        saveRequestRef.current = saveFn;
                      }}
                      onExtractVariable={handleExtractVariable}
                      extractedVariables={extractedVariables}
                      existingExtractions={existingExtractions}
                      onRemoveExtraction={handleRemoveExtraction}
                    />
                  </div>

                  {/* Resizer Handle */}
                  {!isMobile ||
                  (isMobile && isBottomLayout && activePanel === 'editor') ? (
                    <div
                      className={`flex justify-center items-center ${
                        isBottomLayout
                          ? 'cursor-row-resize'
                          : 'cursor-col-resize'
                      } ${
                        isBottomLayout
                          ? 'h-[4px] w-full bg-[#136fb0] dark:bg-[#136fb0] hover:h-[5px] transition-all duration-150 relative group'
                          : 'w-[4px] h-full bg-[#136fb0] dark:bg-[#136fb0] hover:w-[5px] transition-all duration-150 relative group'
                      } ${isMobile ? 'touch-none' : ''}`}
                      onMouseDown={handleResizeStart}
                      // onTouchStart={(e) => {
                      //   e.preventDefault();
                      //   const touch = e.touches[0];
                      //   const mouseEvent = new MouseEvent('mousedown', {
                      //     clientX: touch.clientX,
                      //     clientY: touch.clientY,
                      //   });
                      //   handleResizeStart(mouseEvent as any);
                      // }}

                      onTouchStart={handleTouchResizeStart}
                    >
                      {isBottomLayout ? (
                        <GripHorizontal className='h-3 w-3 text-white' />
                      ) : (
                        <GripVertical className='h-3 w-3 text-white' />
                      )}
                    </div>
                  ) : null}

                  {/* Response Viewer */}
                  <div
                    className={`flex flex-col min-h-0 overflow-hidden`}
                    style={{
                      height: isBottomLayout
                        ? `${100 - resizePosition}%`
                        : undefined,
                      width: !isBottomLayout
                        ? `${100 - resizePosition}%`
                        : undefined,
                    }}
                  >
                    <ResponseViewer
                      isBottomLayout={isBottomLayout}
                      usedStaticVariables={usedVariables.staticVars}
                      usedDynamicVariables={usedVariables.dynamicVars}
                      onRedirectToTab={handleRedirectToTab}
                      onSaveAssertions={async () => {
                        if (saveRequestRef.current) {
                          await saveRequestRef.current();
                        }
                      }}
                      onExtractVariable={handleExtractVariable}
                      extractedVariables={extractedVariables}
                      existingExtractions={existingExtractions}
                      onRemoveExtraction={handleRemoveExtraction}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {!isMobile && (
            <button
              onClick={toggleLayout}
              className='fixed bottom-4 right-4 z-10 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg'
              title={`Switch to ${
                isBottomLayout ? 'side-by-side' : 'top-bottom'
              } layout`}
            >
              {isBottomLayout ? (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
                  <line x1='12' y1='3' x2='12' y2='21'></line>
                </svg>
              ) : (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
                  <line x1='3' y1='12' x2='21' y2='12'></line>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Welcome Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className='max-w-5xl'>
            <DialogDescription asChild>
              <div className='max-h-[88vh] overflow-y-auto scrollbar-thin pr-2'>
                <div className='rounded-xl bg-white'>
                  <div className='p-2 sm:p-4'>
                    <div className='grid gap-3 md:grid-cols-2 md:items-center'>
                      <div>
                        <h2 className='text-2xl sm:text-3xl font-bold text-slate-900 mb-4'>
                          Welcome to Optraflow.com
                        </h2>

                        <p className='text-slate-600 mb-4'>
                          Inside your workspace, you can:
                        </p>

                        <ul className='space-y-3 text-slate-700'>
                          <li className='flex items-start gap-3'>
                            <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                            <span>
                              Import OpenAPI specs, Postman collections, curl
                              commands — or add APIs manually
                            </span>
                          </li>
                          <li className='flex items-start gap-3'>
                            <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                            <span>
                              Run APIs, add response assertions, and validate
                              schemas
                            </span>
                          </li>
                          <li className='flex items-start gap-3'>
                            <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                            <span>
                              Auto-generate test cases for your APIs in the Test
                              Suite
                            </span>
                          </li>
                          <li className='flex items-start gap-3'>
                            <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                            <span>
                              Create static or dynamic variables using built-in
                              functions
                            </span>
                          </li>
                          <li className='flex items-start gap-3'>
                            <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                            <span>
                              Perform integration testing across workflows using
                              request chains
                            </span>
                          </li>
                          <li className='flex items-start gap-3'>
                            <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                            <span>
                              Test APIs across multiple environments
                              effortlessly
                            </span>
                          </li>
                          <li className='flex items-start gap-3'>
                            <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                            <span>
                              Run jobs manually, schedule them, or trigger via
                              CI/CD pipelines
                            </span>
                          </li>
                          <li className='flex items-start gap-3'>
                            <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                            <span>
                              Receive status updates via email, Slack, or
                              Microsoft Teams
                            </span>
                          </li>
                        </ul>

                        <div className='mt-6'>
                          <h3 className='text-lg font-semibold text-slate-900 mb-2'>
                            What's next?
                          </h3>
                          <p className='text-slate-600'>
                            Create a new workspace, set up environments, import
                            your APIs — and start testing with confidence
                          </p>
                        </div>
                        <div className='mt-6'>
                          <Button
                            onClick={() => {
                              setOpen(false);
                            }}
                            className='bg-[#136fb0] hover:bg-[#136fb0] text-white shadow-sm'
                          >
                            Start testing
                          </Button>
                        </div>
                      </div>

                      <div className='relative mx-auto w-full max-w-[480px]'>
                        <div className='relative rounded-2xl  p-6'>
                          <img src={WelcomeImage} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='px-6 sm:px-8 pb-6'>
                    <DialogFooter className='justify-center'>
                      <DialogClose asChild></DialogClose>
                    </DialogFooter>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </RequestEditorProvider>
    </>
  );
};

export default React.memo(RequestBuilder);
