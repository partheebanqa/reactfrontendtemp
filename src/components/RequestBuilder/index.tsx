import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  GripVertical,
  GripHorizontal,
} from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import RequestEditor from "./RequestEditor/RequestEditor";
import ResponseViewer from "./ResponseViewer/ResponseViewer";
import Sidebar from "./Sidebar/Sidebar";

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
  const { refetch: refetchCollection } = useCollection();
  const [isBottomLayout, setIsBottomLayout] = useState(true);
  const [resizePosition, setResizePosition] = useState(50); // Default 50%
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
    document.body.style.cursor = isBottomLayout ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleResize = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    let newPosition;
    if (isBottomLayout) {
      newPosition = ((e.clientY - rect.top) / rect.height) * 100;
    } else {
      newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    }

    // Clamp the values to ensure panels don't get too small
    newPosition = Math.max(20, Math.min(80, newPosition));
    setResizePosition(newPosition);
  };

  const handleResizeEnd = () => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleResizeEnd);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  // Toggle layout orientation
  const toggleLayout = () => {
    setIsBottomLayout(!isBottomLayout);
    // Reset resize position when switching layouts
    setResizePosition(50);
  };

  useEffect(() => {
    refetchCollection();
  }, [currentWorkspace?.id]);

  return (
    <div className="flex h-full bg-background">
      <Sidebar />

      <div
        ref={containerRef}
        className={`flex-1 flex overflow-hidden ${
          isBottomLayout ? "flex-col" : "flex-col lg:flex-row"
        }`}
      >
        {/* Request Editor */}
        <div
          className={`flex flex-col min-h-0 overflow-hidden ${
            isBottomLayout
              ? `h-[${resizePosition}%] min-h-[20%] max-h-[80%]`
              : `lg:w-[${resizePosition}%] min-w-[20%] max-w-[80%] flex-1`
          }`}
          style={{
            height: isBottomLayout ? `${resizePosition}%` : undefined,
            width: !isBottomLayout ? `${resizePosition}%` : undefined,
          }}
        >
          <RequestEditor />
        </div>

        {/* Resizer Handle */}
        <div
          className={`flex justify-center items-center cursor-${
            isBottomLayout ? "row" : "col"
          }-resize ${
            isBottomLayout
              ? "h-[6px] w-full bg-gray-200 dark:bg-gray-700 hover:bg-blue-300 dark:hover:bg-blue-800 transition-colors"
              : "w-[6px] h-full bg-gray-200 dark:bg-gray-700 hover:bg-blue-300 dark:hover:bg-blue-800 transition-colors"
          }`}
          onMouseDown={handleResizeStart}
        >
          {isBottomLayout ? (
            <GripHorizontal className="h-3 w-3 text-gray-500" />
          ) : (
            <GripVertical className="h-3 w-3 text-gray-500" />
          )}
        </div>

        <div
          className={`flex flex-col min-h-0 overflow-hidden ${
            isBottomLayout
              ? `h-[${100 - resizePosition}%] min-h-[20%] max-h-[80%]`
              : `lg:w-[${100 - resizePosition}%] min-w-[20%] max-w-[80%] flex-1`
          }`}
          style={{
            height: isBottomLayout ? `${100 - resizePosition}%` : undefined,
            width: !isBottomLayout ? `${100 - resizePosition}%` : undefined,
          }}
        >
          <ResponseViewer />
        </div>
      </div>

      {/* Layout toggle button */}
      <button
        onClick={toggleLayout}
        className="fixed bottom-4 right-4 z-10 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
        title={`Switch to ${
          isBottomLayout ? "side-by-side" : "top-bottom"
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
    </div>
  );
};

export default RequestBuilder;
