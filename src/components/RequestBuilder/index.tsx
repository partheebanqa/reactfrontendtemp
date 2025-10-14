import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  GripVertical,
  GripHorizontal,
  PanelLeft,
  PanelRight,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { useIsMobile } from "@/hooks/use-mobile";
import RequestEditor from "./RequestEditor/RequestEditor";
import ResponseViewer from "./ResponseViewer/ResponseViewer";
import Sidebar from "./Sidebar/Sidebar";
import { useRequest } from "@/hooks/useRequest";
import { HelpModal } from "@/components/HelpModal/HelpModal";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface TestAssertion {
  field: string;
  operator: string;
  expected: string;
}

const RequestBuilder = () => {
  const { currentWorkspace } = useWorkspace();
  const { refetch: refetchCollection, setActiveCollection, setActiveRequest, handleCreateRequest } = useCollection();
  const { setResponseData, setRequestData } = useRequest()
  const isMobile = useIsMobile();
  const [isBottomLayout, setIsBottomLayout] = useState(true);
  const [resizePosition, setResizePosition] = useState(isMobile ? 60 : 50); // Default 60% on mobile, 50% on desktop
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [activePanel, setActivePanel] = useState<'editor' | 'response'>(
    'editor'
  );
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
    document.body.style.cursor = isBottomLayout ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  }, [isBottomLayout]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    let newPosition;
    if (isBottomLayout) {
      newPosition = ((e.clientY - rect.top) / rect.height) * 100;
    } else {
      newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    }

    // Clamp values - different constraints for mobile
    const minSize = isMobile ? 30 : 20;
    const maxSize = isMobile ? 70 : 80;
    newPosition = Math.max(minSize, Math.min(maxSize, newPosition));

    setResizePosition(newPosition);
  }, [isBottomLayout, isMobile]);

  const handleResizeEnd = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleResizeEnd);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleResize]);

  // Toggle layout orientation
  const toggleLayout = useCallback(() => {
    if (isMobile) {
      // On mobile, toggle between editor and response view instead of changing layout
      setActivePanel(activePanel === 'editor' ? 'response' : 'editor');
    } else {
      setIsBottomLayout(!isBottomLayout);
      // Reset resize position when switching layouts
      setResizePosition(50);
    }
  }, [isMobile, isBottomLayout, activePanel]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setShowSidebar(!showSidebar);
  }, [showSidebar]);

  // Fetch collection data when workspace changes
  // Fix the useEffect dependency issue
  useEffect(() => {
    if (currentWorkspace?.id) {
      refetchCollection();
      setActiveCollection(null);
      handleCreateRequest();
    }
  }, [currentWorkspace?.id]); // Remove refetchCollection from dependencies


  // Adjust layout based on mobile/desktop
  useEffect(() => {
    if (isMobile) {
      setIsBottomLayout(true);
      setShowSidebar(false);
      setResizePosition(60); // Better default for mobile
    } else {
      setShowSidebar(true);
      // Keep current layout on desktop
    }
  }, [isMobile]);

  return (

    <div className="flex h-full relative border border-gray-200 bg-background rounded-lg mt-2">
      {/* Sidebar with conditional rendering for mobile */}
      {showSidebar && (
        <div className={`${isMobile ? 'absolute z-10 h-full shadow-lg' : ''}`}>
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        {isMobile && (
          <div className="flex justify-between items-center p-2 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              aria-label="Toggle sidebar"
            >
              {showSidebar ? <PanelRight size={18} /> : <PanelLeft size={18} />}
            </button>

            {/* Mobile Panel Toggle */}
            <button
              onClick={toggleLayout}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              aria-label="Toggle view"
            >
              <Layers size={18} />
              <span className="ml-2 text-sm">
                {activePanel === 'editor' ? 'View Response' : 'Edit Request'}
              </span>
            </button>
          </div>
        )}

        <div
          ref={containerRef}
          className={`flex-1 flex overflow-hidden ${isBottomLayout ? "flex-col" : "flex-row"
            }`}
        >
          {/* Request Editor */}
          <div
            className={`
              flex flex-col min-h-0 overflow-hidden
              ${isMobile && activePanel === 'response' ? 'hidden' : ''}
              ${isBottomLayout
                ? `h-[${resizePosition}%] min-h-[20%] max-h-[80%]`
                : `w-[${resizePosition}%] min-w-[20%] max-w-[80%] flex-1`
              }
            `}
            style={{
              height: isBottomLayout ? `${resizePosition}%` : undefined,
              width: !isBottomLayout ? `${resizePosition}%` : undefined,
            }}
          >
            <RequestEditor />
          </div>

          {/* Resizer Handle - hidden on mobile when in panel toggle mode */}
          {(!isMobile || (isMobile && isBottomLayout && activePanel === 'editor')) && (
            <div
              className={`
                flex justify-center items-center
                ${isBottomLayout ? "cursor-row-resize" : "cursor-col-resize"}
                ${isBottomLayout
                  ? "h-[6px] w-full bg-[#136fb0] dark:bg-gray-700 hover:bg-blue-300 dark:hover:bg-blue-800 transition-colors"
                  : "w-[6px] h-full bg-[#136fb0] dark:bg-gray-700 hover:bg-blue-300 dark:hover:bg-blue-800 transition-colors"
                }
                ${isMobile ? "touch-manipulation" : ""}
              `}
              onMouseDown={handleResizeStart}
              onTouchStart={(e) => {
                // Prevent scrolling on touch devices when resizing
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                  clientX: touch.clientX,
                  clientY: touch.clientY
                });
                handleResizeStart(mouseEvent as any);
              }}
            >
              {isBottomLayout ? (
                <GripHorizontal className="h-3 w-3 text-white" />
              ) : (
                <GripVertical className="h-3 w-3 text-white" />
              )}
            </div>
          )}

          {/* Response Viewer */}
          <div
            className={`
              flex flex-col min-h-0 overflow-hidden
              ${isMobile && activePanel === 'editor' ? 'hidden' : ''}
              ${isBottomLayout
                ? `h-[${100 - resizePosition}%] min-h-[20%] max-h-[80%]`
                : `w-[${100 - resizePosition}%] min-w-[20%] max-w-[80%] flex-1`
              }
            `}
            style={{
              height: isBottomLayout ? `${100 - resizePosition}%` : undefined,
              width: !isBottomLayout ? `${100 - resizePosition}%` : undefined,
            }}
          >
            <ResponseViewer isBottomLayout={isBottomLayout} />
          </div>
        </div>
      </div>

      {/* Layout toggle button - only shown on desktop */}
      {!isMobile && (
        <button
          onClick={toggleLayout}
          className="fixed bottom-4 right-4 z-10 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
          title={`Switch to ${isBottomLayout ? "side-by-side" : "top-bottom"
            } layout`}
        >
          {isBottomLayout ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="3" x2="12" y2="21"></line>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="12" x2="21" y2="12"></line>
            </svg>
          )}
        </button>
      )}

      {/* Bottom Tab Navigation for Mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-2 z-10">
          <button
            onClick={() => {
              setActivePanel('editor');
              toggleSidebar();
            }}
            className={`mx-2 p-2 rounded-md flex flex-col items-center ${activePanel === 'editor' && showSidebar
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <PanelLeft size={18} />
            <span className="text-xs mt-1">Collections</span>
          </button>

          <button
            onClick={() => {
              setActivePanel('editor');
              setShowSidebar(false);
            }}
            className={`mx-2 p-2 rounded-md flex flex-col items-center ${activePanel === 'editor' && !showSidebar
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span className="text-xs mt-1">Request</span>
          </button>

          <button
            onClick={() => {
              setActivePanel('response');
              setShowSidebar(false);
            }}
            className={`mx-2 p-2 rounded-md flex flex-col items-center ${activePanel === 'response'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <span className="text-xs mt-1">Response</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Memoize the component for better performance
export default React.memo(RequestBuilder);
