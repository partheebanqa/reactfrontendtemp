import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Globe, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
// ⬇️ Adjust this import path to wherever you placed your component
import { TestCaseDetail } from "@/components/Reports/Components/TestCaseDetail";

/** =========================
 * Types
 * ========================= */

// Matches your external TestCaseDetail props (with optional subCategory to be safe)
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

// If you are using the ApiTestReport shape (from earlier responses)
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

/** Local grouping type */
interface RequestGroup {
  endpoint: string;
  method: string;
  testCases: TestCase[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  avgDuration: number;
}

/** Props:
 *  - Provide `testCases` directly, OR pass a full `report` and we'll flatten it.
 */
interface RequestGroupingProps {
  report?: ApiTestReport;
  testCases?: TestCase[];
}

/** =========================
 * Helpers
 * ========================= */
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

/** =========================
 * Component
 * ========================= */
export const RequestGrouping: React.FC<RequestGroupingProps> = ({ report, testCases }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Decide source of test cases
  const sourceTestCases = useMemo<TestCase[]>(() => {
    if (testCases && testCases.length) return testCases;
    return collectAllTestCasesFromReport(report);
  }, [report, testCases]);

  // Group by METHOD + URL
  const groupedRequests = useMemo(() => {
    const groups: Record<string, RequestGroup> = {};
    for (const tc of sourceTestCases) {
      const key = `${(tc.method || "").toUpperCase()} ${tc.url}`;
      if (!groups[key]) {
        groups[key] = {
          endpoint: tc.url,
          method: (tc.method || "").toUpperCase(),
          testCases: [],
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          avgDuration: 0,
        };
      }
      const g = groups[key];
      g.testCases.push(tc);
      g.totalTests += 1;
      if (tc.status === "passed") g.passedTests += 1;
      else if (tc.status === "failed") g.failedTests += 1;
      else if (tc.status === "skipped") g.skippedTests += 1;
    }

    // avg
    Object.values(groups).forEach((g) => {
      const totalDuration = g.testCases.reduce((s, t) => s + (t.duration || 0), 0);
      g.avgDuration = g.testCases.length ? Math.round(totalDuration / g.testCases.length) : 0;
    });

    return groups;
  }, [sourceTestCases]);

  const toggleGroup = (groupKey: string) => {
    const copy = new Set(expandedGroups);
    if (copy.has(groupKey)) copy.delete(groupKey);
    else copy.add(groupKey);
    setExpandedGroups(copy);
  };

  const getSuccessRate = (g: RequestGroup) =>
    !g.totalTests ? 0 : Math.round((g.passedTests / g.totalTests) * 100);

  const entries = Object.entries(groupedRequests);

  if (!entries.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No API requests found in the selected filters</p>
      </div>
    );
  }

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };


  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Globe className="w-6 h-6 mr-2 text-blue-600" />
          API Endpoints ({entries.length} endpoints)
        </h2>

        <div className="space-y-4">
          {entries.map(([groupKey, group]) => {
            const isExpanded = expandedGroups.has(groupKey);
            const successRate = getSuccessRate(group);

            return (
              <div key={groupKey} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      )}

                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getMethodColor(group.method)}`}>
                        {group.method}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate"> {truncateText(group.endpoint, 60)}</p>
                        <p className="text-sm text-gray-500">{group.totalTests} test cases</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{group.passedTests}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span>{group.failedTests}</span>
                      </div>
                      {group.skippedTests > 0 && (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{group.skippedTests}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{group.avgDuration}ms avg</span>
                      </div>
                      <div
                        className={`font-semibold ${successRate >= 80
                          ? "text-green-600"
                          : successRate >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                          }`}
                      >
                        {successRate}%
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-white">
                    <div className="p-4">
                      <div className="space-y-4">
                        {group.testCases.map((tc) => (
                          // ⬇️ Uses your external component
                          <TestCaseDetail key={tc.id} testCase={tc} />
                        ))}
                      </div>
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
