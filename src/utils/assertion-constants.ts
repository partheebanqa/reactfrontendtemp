/**
 * Assertion Generation Limits and Configuration
 * These prevent browser crashes and performance issues
 */

export const ASSERTION_LIMITS = {
  // Maximum nesting depth for object traversal
  MAX_DEPTH: 10,

  // Maximum total assertions per response
  MAX_ASSERTIONS: 500,

  // Maximum array items to process (only first N items)
  MAX_ARRAY_ITEMS: 50,

  // Maximum response size in MB before warning user
  MAX_RESPONSE_SIZE_MB: 10,
} as const;

export interface GenerationStats {
  totalAssertions: number;
  skippedDeepPaths: number;
  skippedLargeArrays: number;
  truncated: boolean;
  maxDepthReached: number;
}

export const createEmptyStats = (): GenerationStats => ({
  totalAssertions: 0,
  skippedDeepPaths: 0,
  skippedLargeArrays: 0,
  truncated: false,
  maxDepthReached: 0,
});
