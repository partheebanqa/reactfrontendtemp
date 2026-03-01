import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { TestCaseDetail } from "@/components/Reports/Components/TestCaseDetail";

/** ============== Types (same as you had) ============== */
export interface TestCase {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  method: string;
  url: string;
  status: "passed" | "failed" | "skipped";
  severity: "low" | "medium" | "high" | "critical";
  responseSize: number;
  duration: number;
  extractedVariables: any;
  requestCurl: string;
  response: string;
}

interface ApiTestReport {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  environmentId: string;
  lastExecutionDate: string;
  duration: number;
  executedBy: string;
  createdAt: string;
  updatedAt: string;
  requests: RequestResult[];
}
interface RequestResult {
  requestId: string;
  name: string;
  method: string;
  url: string;
  totalTestCases: number;
  successfulTestCases: number;
  failedTestCases: number;
  skippedTestCases: number;
  successRate: number;
  positiveTests: TestGroup;
  negativeTests: TestGroup;
  functionalTests: TestGroup;
  semanticTests: TestGroup;
  edgeCaseTests: TestGroup;
  securityTests: TestGroup;
  advancedSecurityTests: TestGroup;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  assertionSuccessRate: number;
}
interface TestGroup {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  testCases: TestCase[];
}

interface RequestGroupingProps {
  report?: ApiTestReport;
  testCases?: TestCase[];
}

/** ============== Helpers ============== */
const collectAllTestCasesFromReport = (report?: ApiTestReport): TestCase[] => {
  if (!report) return [];
  const groups: (keyof RequestResult)[] = [
    "positiveTests",
    "negativeTests",
    "functionalTests",
    "semanticTests",
    "edgeCaseTests",
    "securityTests",
    "advancedSecurityTests",
  ];

  const all: TestCase[] = [];
  for (const req of report.requests || []) {
    for (const key of groups) {
      const grp = req[key] as unknown as TestGroup | undefined;
      if (grp?.testCases?.length) {
        for (const tc of grp.testCases) {
          all.push({
            ...tc,
            method: tc.method || req.method,
            url: tc.url || req.url,
          });
        }
      }
    }
  }
  return all;
};

// normalize URL (lowercase host; remove trailing slash in path)
const normalizeUrl = (raw: string) => {
  try {
    const u = new URL(raw);
    const origin = `${u.protocol}//${u.host.toLowerCase()}`;
    const pathname = u.pathname.replace(/\/$/, ""); // drop trailing slash
    // keep query string as-is (you said requests differ by query too)
    return `${origin}${pathname}${u.search}`;
  } catch {
    // fallback: trim & drop trailing slash
    return raw.trim().replace(/\/$/, "");
  }
};

const getMethodColor = (method: string) => {
  switch ((method || "").toUpperCase()) {
    case "GET":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "POST":
      return "bg-green-100 text-green-800 border-green-200";
    case "PUT":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "DELETE":
      return "bg-red-100 text-red-800 border-red-200";
    case "PATCH":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "OPTIONS":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/** ============== New grouping model ==============
 * One row per URL. Inside it, buckets by method.
 */
type MethodBucket = {
  method: string;
  testCases: TestCase[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  avgDuration: number;
};

type UrlGroup = {
  endpoint: string;           // the displayed URL (first seen form)
  key: string;                // normalized key
  methods: Record<string, MethodBucket>;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  avgDuration: number;        // across all methods
};

export const RequestGrouping: React.FC<RequestGroupingProps> = ({ report, testCases }) => {
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());

  const sourceTestCases = useMemo<TestCase[]>(() => {
    if (testCases && testCases.length) return testCases;
    return collectAllTestCasesFromReport(report);
  }, [report, testCases]);

  // Group by URL (NOT by method), then bucket methods inside
  const urlGroups = useMemo<Record<string, UrlGroup>>(() => {
    const groups: Record<string, UrlGroup> = {};

    for (const tc of sourceTestCases) {
      const key = normalizeUrl(tc.url || "");
      if (!groups[key]) {
        groups[key] = {
          key,
          endpoint: tc.url, // keep original formatting for display
          methods: {},
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          avgDuration: 0,
        };
      }

      const g = groups[key];

      const method = (tc.method || "").toUpperCase();
      if (!g.methods[method]) {
        g.methods[method] = {
          method,
          testCases: [],
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          avgDuration: 0,
        };
      }

      const mb = g.methods[method];
      mb.testCases.push(tc);
      mb.total += 1;
      if (tc.status === "passed") mb.passed += 1;
      else if (tc.status === "failed") mb.failed += 1;
      else if (tc.status === "skipped") mb.skipped += 1;

      // accumulate URL totals
      g.total += 1;
      if (tc.status === "passed") g.passed += 1;
      else if (tc.status === "failed") g.failed += 1;
      else if (tc.status === "skipped") g.skipped += 1;
    }

    // compute averages
    Object.values(groups).forEach((g) => {
      // per method
      Object.values(g.methods).forEach((mb) => {
        const dur = mb.testCases.reduce((s, t) => s + (t.duration || 0), 0);
        mb.avgDuration = mb.total ? Math.round(dur / mb.total) : 0;
      });
      // per URL (all tests)
      const allDur = Object.values(g.methods)
        .flatMap((mb) => mb.testCases)
        .reduce((s, t) => s + (t.duration || 0), 0);
      g.avgDuration = g.total ? Math.round(allDur / g.total) : 0;
    });

    return groups;
  }, [sourceTestCases]);

  const entries = Object.values(urlGroups);

  const toggleUrl = (key: string) => {
    const copy = new Set(expandedUrls);
    if (copy.has(key)) copy.delete(key);
    else copy.add(key);
    setExpandedUrls(copy);
  };

  const successPct = (passed: number, total: number) =>
    total ? Math.round((passed / total) * 100) : 0;

  const truncateText = (text: string, maxLength: number) =>
    !text ? "" : text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

  if (!entries.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No API requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-6">
        <h2 className="text-md md:text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Globe className="w-6 h-6 mr-2 text-blue-600" />
          API Endpoints ({entries.length} endpoints)
        </h2>

        <div className="space-y-4 hidden md:block">
          {entries.map((group) => {
            const isExpanded = expandedUrls.has(group.key);
            const rate = successPct(group.passed, group.total);

            return (
              <div key={group.key} className="border border-gray-200 rounded-lg overflow-hidden">

                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleUrl(group.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-lg font-medium text-gray-900" title={group.endpoint}>
                          {group.endpoint}
                        </p>
                        <p className="text-sm text-gray-500">
                          {group.total} test case{group.total === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{group.passed}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span>{group.failed}</span>
                      </div>
                      {group.skipped > 0 && (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{group.skipped}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{group.avgDuration}ms avg</span>
                      </div>
                      <div
                        className={`font-semibold ${rate >= 80 ? "text-green-600" : rate >= 60 ? "text-yellow-600" : "text-red-600"
                          }`}
                      >
                        {rate}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded: per-method sections with TestCaseDetail */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-white">
                    <div className="p-4 space-y-6">
                      {Object.values(group.methods).map((mb) => (
                        <div key={mb.method} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getMethodColor(
                                mb.method
                              )}`}
                            >
                              {mb.method}
                            </span>
                            {/* <span className="text-sm text-gray-500">
                              {mb.total} test case{mb.total === 1 ? "" : "s"} • {mb.avgDuration}ms avg
                            </span> */}
                          </div>

                          <div className="space-y-3">
                            {mb.testCases.map((tc) => (
                              <TestCaseDetail key={tc.id} testCase={tc} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 block md:hidden">
          {entries.map((group) => {
            const isExpanded = expandedUrls.has(group.key);
            const rate = successPct(group.passed, group.total);

            return (
              <div
                key={group.key}
                className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
              >
                {/* HEADER */}
                <div
                  className="p-4 cursor-pointer bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => toggleUrl(group.key)}
                >
                  {/* Top Row */}
                  <div className="flex items-start gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate"
                        title={group.endpoint}
                      >
                        {group.endpoint}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {group.total} test case{group.total === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid - Mobile Optimized */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center md:justify-between gap-3 text-xs sm:text-sm">

                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{group.passed} Passed</span>
                    </div>

                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span>{group.failed} Failed</span>
                    </div>

                    {group.skipped > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{group.skipped} Skipped</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{group.avgDuration}ms avg</span>
                    </div>

                    <div
                      className={`font-semibold ${rate >= 80
                        ? "text-green-600"
                        : rate >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                        }`}
                    >
                      {rate}% Success
                    </div>
                  </div>
                </div>

                {/* EXPANDED SECTION */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="p-4 space-y-6">
                      {Object.values(group.methods).map((mb) => (
                        <div key={mb.method} className="space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getMethodColor(
                                mb.method
                              )}`}
                            >
                              {mb.method}
                            </span>

                            <span className="text-xs text-gray-500">
                              {mb.total} cases • {mb.avgDuration}ms avg
                            </span>
                          </div>

                          <div className="space-y-3">
                            {mb.testCases.map((tc) => (
                              <TestCaseDetail key={tc.id} testCase={tc} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
