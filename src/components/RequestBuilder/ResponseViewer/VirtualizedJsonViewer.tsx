'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface JsonNode {
  key: string;
  value: any;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  parentPath: string;
  childCount?: number;
}

interface VirtualizedJsonViewerProps {
  nodes: JsonNode[];
  renderNode: (node: JsonNode, index: number) => React.ReactNode;
  /** Height of the scrollable container. Default: 600px */
  maxHeight?: number;
  /** Node count threshold above which virtualization activates. Default: 100 */
  threshold?: number;
  /** Extra items rendered above/below the visible window. Default: 10 */
  overscan?: number;
  /** Estimated row height in px used by the virtualizer. Default: 36 */
  estimatedRowHeight?: number;
}

/**
 * VirtualizedJsonViewer — @tanstack/react-virtual strategy
 *
 * Behaviour:
 *  - Below `threshold` nodes  → plain list (zero virtualizer overhead).
 *  - Above `threshold` nodes  → windowed list via useVirtualizer.
 *
 * The virtualizer measures every rendered row via `measureElement` so
 * variable-height rows (deeply nested paths, long string values) are handled
 * correctly without a fixed row height.
 *
 * Peer dependency: @tanstack/react-virtual  (^3.x)
 *   npm i @tanstack/react-virtual
 */
const VirtualizedJsonViewer = React.memo(function VirtualizedJsonViewer({
  nodes,
  renderNode,
  maxHeight = 600,
  threshold = 100,
  overscan = 10,
  estimatedRowHeight = 36,
}: VirtualizedJsonViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = nodes.length > threshold;

  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
    // measureElement lets the virtualizer observe the real rendered height of
    // each row so dynamic content (wrapping values, multi-line strings) never
    // causes items to overlap or leave gaps.
    measureElement:
      typeof window !== 'undefined'
        ? (el) => el.getBoundingClientRect().height
        : undefined,
    enabled: shouldVirtualize,
  });

  const containerStyle: React.CSSProperties = {
    maxHeight,
    overflowY: 'auto',
  };

  // ── Non-virtualised path (small payloads) ────────────────────────────────
  if (!shouldVirtualize) {
    return (
      <div ref={parentRef} style={containerStyle} className='scrollbar-thin'>
        {nodes.map((node, index) => renderNode(node, index))}
      </div>
    );
  }

  // ── Virtualised path (large payloads) ────────────────────────────────────
  return (
    <div ref={parentRef} style={containerStyle} className='scrollbar-thin'>
      {/* Spacer div whose height equals the total estimated list height.
          Absolute-positioned rows are then translated inside it. */}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderNode(nodes[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
});

export default VirtualizedJsonViewer;
export type { VirtualizedJsonViewerProps, JsonNode };
