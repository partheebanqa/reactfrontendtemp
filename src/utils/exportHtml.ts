// src/utils/exportHtml.ts
import type {
  TestSuiteData,
  TestCategory,
  TestCase,
} from "@/components/Reports/Components/TestCaseDetail";

// ---- helpers you already have (trimmed to essentials) ----
const generateTestCaseHTML = (testCase: TestCase): string => {
  const getStatusBadge = (status: string) => {
    const colors = {
      passed:
        "background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;",
      failed:
        "background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;",
      skipped:
        "background-color: #fefce8; color: #92400e; border: 1px solid #fde68a;",
    };
    return `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; ${
      colors[status as keyof typeof colors] || colors.failed
    }">${status.toUpperCase()}</span>`;
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: "background-color: #dc2626; color: white;",
      high: "background-color: #ea580c; color: white;",
      medium: "background-color: #ca8a04; color: white;",
      low: "background-color: #2563eb; color: white;",
    };
    return `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; ${
      colors[severity as keyof typeof colors] || colors.medium
    }">${severity.toUpperCase()}</span>`;
  };

  const formatResponse = (response: string) => {
    try {
      const parsed = JSON.parse(response);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return response;
    }
  };

  return `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; overflow: hidden;">
      <div style="padding: 16px; background-color: #f9fafb;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-weight: 600; color: #111827; margin: 0 0 8px 0;">${
              testCase.name
            }</h4>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              ${getStatusBadge(testCase.status)}
              ${getSeverityBadge(testCase.severity)}
            </div>
          </div>
          <div style="display: flex; gap: 24px; font-size: 14px; color: #6b7280;">
            <span><strong>Method:</strong> ${testCase.method}</span>
            <span><strong>Duration:</strong> ${testCase.duration}ms</span>
            <span><strong>Size:</strong> ${testCase.responseSize}B</span>
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background-color: white;">
        <div style="margin-bottom: 16px;">
          <h5 style="font-weight: 500; color: #111827; margin: 0 0 8px 0;">Endpoint</h5>
          <code style="display: block; padding: 12px; background-color: #f3f4f6; border-radius: 4px; font-size: 14px; overflow-x: auto;">${
            testCase.method
          } ${testCase.url}</code>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h5 style="font-weight: 500; color: #111827; margin: 0 0 8px 0;">Request cURL</h5>
          <code style="display: block; padding: 12px; background-color: #f3f4f6; border-radius: 4px; font-size: 14px; overflow-x: auto; white-space: pre-wrap;">${
            testCase.requestCurl
          }</code>
        </div>
        
        <div>
          <h5 style="font-weight: 500; color: #111827; margin: 0 0 8px 0;">Response</h5>
          <pre style="display: block; padding: 12px; background-color: #f3f4f6; border-radius: 4px; font-size: 14px; overflow-x: auto; white-space: pre-wrap; margin: 0;">${formatResponse(
            testCase.response
          )}</pre>
        </div>
      </div>
    </div>
  `;
};

// Group test cases by API endpoint
const groupTestCasesByEndpoint = (
  categories: { title: string; category: TestCategory }[]
) => {
  const endpointGroups: {
    [key: string]: {
      endpoint: string;
      method: string;
      testCases: (TestCase & { category: string })[];
      totalTests: number;
      passedTests: number;
      failedTests: number;
      skippedTests: number;
      avgDuration: number;
    };
  } = {};

  categories.forEach(({ title, category }) => {
    category.apis.forEach((testCase) => {
      const key = `${testCase.method} ${testCase.url}`;

      if (!endpointGroups[key]) {
        endpointGroups[key] = {
          endpoint: testCase.url,
          method: testCase.method,
          testCases: [],
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          avgDuration: 0,
        };
      }

      endpointGroups[key].testCases.push({ ...testCase, category: title });
      endpointGroups[key].totalTests++;

      if (testCase.status === "passed") endpointGroups[key].passedTests++;
      else if (testCase.status === "failed") endpointGroups[key].failedTests++;
      else if (testCase.status === "skipped")
        endpointGroups[key].skippedTests++;
    });
  });

  // Calculate average duration for each group
  Object.values(endpointGroups).forEach((group) => {
    const totalDuration = group.testCases.reduce(
      (sum, tc) => sum + tc.duration,
      0
    );
    group.avgDuration = Math.round(totalDuration / group.testCases.length);
  });

  return endpointGroups;
};

const generateEndpointGroupHTML = (
  endpointGroups: ReturnType<typeof groupTestCasesByEndpoint>
): string => {
  if (Object.keys(endpointGroups).length === 0) {
    return `
      <div style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 32px; text-align: center;">
        <h3 style="color: #6b7280; margin: 0;">No API endpoints found</h3>
      </div>
    `;
  }

  return `
    <div style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 32px;">
      <div style="padding: 24px; border-bottom: 1px solid #f3f4f6;">
        <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px 0; display: flex; align-items: center;">
          🌐 API Endpoints (${Object.keys(endpointGroups).length} endpoints)
        </h2>
        <p style="color: #6b7280; margin: 0;">Test results organized by API endpoint</p>
      </div>
      
      <div style="padding: 24px;">
        ${Object.entries(endpointGroups)
          .map(([groupKey, group]) => {
            const successRate = Math.round(
              (group.passedTests / group.totalTests) * 100
            );
            const successRateColor =
              successRate >= 80
                ? "#059669"
                : successRate >= 60
                ? "#d97706"
                : "#dc2626";

            return `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
              <div style="padding: 20px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                  <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                    <span style="display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; ${getMethodBadgeStyle(
                      group.method
                    )}">${group.method}</span>
                    <div style="flex: 1; min-width: 0;">
                      <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0; word-break: break-all;">${
                        group.endpoint
                      }</h3>
                      <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">${
                        group.totalTests
                      } test case${group.totalTests !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 20px; font-size: 14px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 4px; color: #059669;">
                      <span>✅</span>
                      <span>${group.passedTests}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px; color: #dc2626;">
                      <span>❌</span>
                      <span>${group.failedTests}</span>
                    </div>
                    ${
                      group.skippedTests > 0
                        ? `
                    <div style="display: flex; align-items: center; gap: 4px; color: #d97706;">
                      <span>⚠️</span>
                      <span>${group.skippedTests}</span>
                    </div>
                    `
                        : ""
                    }
                    <div style="display: flex; align-items: center; gap: 4px; color: #6b7280;">
                      <span>⏱️</span>
                      <span>${group.avgDuration}ms avg</span>
                    </div>
                    <div style="font-weight: 600; color: ${successRateColor};">
                      ${successRate}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="padding: 20px;">
                ${group.testCases
                  .map((testCase) => generateCollapsibleTestCaseHTML(testCase))
                  .join("")}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
};

const getMethodBadgeStyle = (method: string): string => {
  const styles = {
    GET: "background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;",
    POST: "background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;",
    PUT: "background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;",
    DELETE:
      "background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;",
    PATCH:
      "background-color: #f3e8ff; color: #7c2d12; border: 1px solid #e9d5ff;",
    OPTIONS:
      "background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db;",
  };
  return styles[method as keyof typeof styles] || styles["OPTIONS"];
};

const generateCollapsibleTestCaseHTML = (
  testCase: TestCase & { category: string }
): string => {
  const getStatusBadge = (status: string) => {
    const colors = {
      passed:
        "background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;",
      failed:
        "background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;",
      skipped:
        "background-color: #fefce8; color: #92400e; border: 1px solid #fde68a;",
    };
    const icons = { passed: "✅", failed: "❌", skipped: "⚠️" };
    return `<span style="display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; gap: 4px; ${
      colors[status as keyof typeof colors] || colors.failed
    }">${
      icons[status as keyof typeof icons] || "❓"
    } ${status.toUpperCase()}</span>`;
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: "background-color: #dc2626; color: white;",
      high: "background-color: #ea580c; color: white;",
      medium: "background-color: #ca8a04; color: white;",
      low: "background-color: #2563eb; color: white;",
    };
    return `<span style="display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; ${
      colors[severity as keyof typeof colors] || colors.medium
    }">${severity.toUpperCase()}</span>`;
  };

  const getCategoryBadge = (category: string) => {
    return `<span style="display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; background-color: #f3f4f6; color: #374151;">${category}</span>`;
  };
  const formatResponse = (response: string) => {
    try {
      const parsed = JSON.parse(response);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return response;
    }
  };

  const testCaseId = `testcase-${testCase.id}`;

  return `
    <div style="border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 16px; overflow: hidden;">
      <div style="padding: 16px; background-color: #f9fafb; cursor: pointer;" onclick="toggleTestCase('${testCaseId}')">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
            <span id="toggle-${testCaseId}" style="font-size: 14px; color: #6b7280;">▶️</span>
            <h4 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0; word-break: break-word;">${
              testCase.name
            }</h4>
          </div>
          
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${getCategoryBadge(testCase.category)}
              ${getSeverityBadge(testCase.severity)}
              ${getStatusBadge(testCase.status)}
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 13px; color: #6b7280;">
              <span>⏱️ ${testCase.duration}ms</span>
              <span>📊 ${testCase.responseSize}B</span>
              ${
                testCase.statusCode
                  ? `<span>🔢 ${testCase.statusCode}</span>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
      
      <div id="${testCaseId}" style="display: none; padding: 20px; background-color: white; border-top: 1px solid #e5e7eb;">
        <div style="margin-bottom: 20px;">
          <h5 style="font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">📝 Request cURL</h5>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; overflow-x: auto;">
            <code style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; line-height: 1.4; color: #1e293b; white-space: pre-wrap; word-break: break-all;">${
              testCase.requestCurl
            }</code>
          </div>
        </div>
        
        <div>
          <h5 style="font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">📄 Response</h5>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; overflow-x: auto;">
            <pre style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; line-height: 1.4; color: #1e293b; margin: 0; white-space: pre-wrap; word-break: break-all;">${formatResponse(
              testCase.response
            )}</pre>
          </div>
        </div>
      </div>
    </div>
  `;
};

const generateRequestMetricsHTML = (data: TestSuiteData): string => {
  const metrics = data.requestMetrics;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (ms: number) => `${ms.toFixed(0)}ms`;

  return `
    <div style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 32px;">
      <div style="padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 24px 0;">📊 Request-Level Metrics</h2>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px;">
          <div style="text-align: center;">
            <div style="width: 48px; height: 48px; background-color: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">🌐</div>
            <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${
              metrics.totalRequests
            }</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Total Requests</p>
          </div>
          <div style="text-align: center;">
            <div style="width: 48px; height: 48px; background-color: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">🗄️</div>
            <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${
              metrics.uniqueEndpoints
            }</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Unique Endpoints</p>
          </div>
          <div style="text-align: center;">
            <div style="width: 48px; height: 48px; background-color: #f3e8ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">⏱️</div>
            <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${formatDuration(
              metrics.averageResponseTime
            )}</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Avg Response Time</p>
          </div>
          <div style="text-align: center;">
            <div style="width: 48px; height: 48px; background-color: #fed7aa; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">📈</div>
            <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${formatBytes(
              metrics.totalDataTransferred
            )}</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Data Transferred</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Response Time Range</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #059669;">⬇️ Fastest</span>
              <span style="font-weight: 600; color: #059669;">${formatDuration(
                metrics.minResponseTime
              )}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #2563eb;">⏱️ Average</span>
              <span style="font-weight: 600; color: #2563eb;">${formatDuration(
                metrics.averageResponseTime
              )}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #dc2626;">⬆️ Slowest</span>
              <span style="font-weight: 600; color: #dc2626;">${formatDuration(
                metrics.maxResponseTime
              )}</span>
            </div>
          </div>

          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">HTTP Methods</h3>
            ${Object.entries(metrics.requestsByMethod)
              .map(([method, count]) => {
                const percentage = (count / metrics.totalRequests) * 100;
                const methodColors: { [key: string]: string } = {
                  GET: "#2563eb",
                  POST: "#059669",
                  PUT: "#d97706",
                  DELETE: "#dc2626",
                  PATCH: "#7c3aed",
                  OPTIONS: "#6b7280",
                };
                const color = methodColors[method] || "#6b7280";

                return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="background-color: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${method}</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 80px; height: 8px; background-color: #e5e7eb; border-radius: 4px;">
                      <div style="width: ${percentage}%; height: 100%; background-color: ${color}; border-radius: 4px;"></div>
                    </div>
                    <span style="font-weight: 600; min-width: 24px;">${count}</span>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Status Code Distribution</h3>
            ${Object.entries(metrics.statusCodeDistribution)
              .map(([statusCode, count]) => {
                const percentage = (count / metrics.totalRequests) * 100;
                const code = parseInt(statusCode);
                let color = "#6b7280";
                if (code >= 200 && code < 300) color = "#059669";
                else if (code >= 300 && code < 400) color = "#2563eb";
                else if (code >= 400 && code < 500) color = "#d97706";
                else if (code >= 500) color = "#dc2626";

                return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="background-color: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${statusCode}</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 80px; height: 8px; background-color: #e5e7eb; border-radius: 4px;">
                      <div style="width: ${percentage}%; height: 100%; background-color: ${color}; border-radius: 4px;"></div>
                    </div>
                    <span style="font-weight: 600; min-width: 24px;">${count}</span>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>

          ${
            Object.keys(metrics.errorTypes).length > 0
              ? `
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">⚠️ Error Types</h3>
            ${Object.entries(metrics.errorTypes)
              .map(([errorType, count]) => {
                const totalErrors = Object.values(metrics.errorTypes).reduce(
                  (a, b) => a + b,
                  0
                );
                const percentage = (count / totalErrors) * 100;

                return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #374151; flex: 1; margin-right: 8px;">${errorType}</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 64px; height: 8px; background-color: #e5e7eb; border-radius: 4px;">
                      <div style="width: ${percentage}%; height: 100%; background-color: #dc2626; border-radius: 4px;"></div>
                    </div>
                    <span style="font-weight: 600; min-width: 16px;">${count}</span>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
};

export const downloadAsHTML = (elementId: string, filename: string) => {
  // Get data from the global window object (we'll set this in the component)
  const reportData = (window as any).__REPORT_DATA__;

  if (!reportData) {
    alert("Report data not available for export");
    return;
  }

  try {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString();
    };

    const formatDuration = (ms: number) => {
      return `${(ms / 1000).toFixed(2)}s`;
    };

    const categories = [
      { title: "Positive Tests", category: reportData.positiveTests },
      { title: "Negative Tests", category: reportData.negativeTests },
      { title: "Functional Tests", category: reportData.functionalTests },
      { title: "Semantic Tests", category: reportData.semanticTests },
      { title: "Edge Case Tests", category: reportData.edgeCaseTests },
      { title: "Security Tests", category: reportData.securityTests },
      {
        title: "Advanced Security Tests",
        category: reportData.advancedSecurityTests,
      },
    ];

    // Group test cases by endpoint
    const endpointGroups = groupTestCasesByEndpoint(categories);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Test Suite Report - ${reportData.name}</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5; 
            line-height: 1.5;
          }
          .report-container { max-width: 1200px; margin: 0 auto; }
          @media print { 
            body { background-color: white; }
            .report-container { max-width: none; }
          }
          @media (max-width: 768px) {
            .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
            .grid-2 { grid-template-columns: 1fr !important; }
          }
          
          /* Collapsible functionality */
          .collapsible-content {
            display: none;
          }
          .collapsible-content.active {
            display: block;
          }
        </style>
        <script>
          function toggleTestCase(testCaseId) {
            const content = document.getElementById(testCaseId);
            const toggle = document.getElementById('toggle-' + testCaseId);
            
            if (content.style.display === 'none' || content.style.display === '') {
              content.style.display = 'block';
              toggle.textContent = '🔽';
            } else {
              content.style.display = 'none';
              toggle.textContent = '▶️';
            }
          }
        </script>
      </head>
      <body>
        <div class="report-container">
          <!-- Header Section -->
          <div style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 32px; margin-bottom: 32px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px;">
              <div>
                <h1 style="font-size: 30px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">${
                  reportData.name
                }</h1>
                <p style="color: #6b7280; margin: 0;">${
                  reportData.description
                }</p>
              </div>
              <div style="text-align: right;">
                <h2 style="font-size: 24px; font-weight: 700; color: #2563eb; margin: 0;">Optraflow</h2>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">API Testing Platform</p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px;" class="grid-4">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">📅</span>
                <div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0;">Execution Date</p>
                  <p style="font-weight: 600; margin: 0;">${formatDate(
                    reportData.lastExecutionDate
                  )}</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">⏱️</span>
                <div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0;">Duration</p>
                  <p style="font-weight: 600; margin: 0;">${formatDuration(
                    reportData.duration
                  )}</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">👤</span>
                <div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0;">Executed By</p>
                  <p style="font-weight: 600; font-size: 12px; margin: 0;">${
                    reportData.executedBy
                  }</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🗄️</span>
                <div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0;">Environment</p>
                  <p style="font-weight: 600; font-size: 12px; margin: 0;">${
                    reportData.environmentId
                  }</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Metrics Overview -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px;" class="grid-4">
            <div style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Success Rate</p>
                  <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${
                    reportData.successRate
                  }%</p>
                </div>
                <div style="width: 48px; height: 48px; background-color: ${
                  reportData.successRate >= 80
                    ? "#dcfce7"
                    : reportData.successRate >= 60
                    ? "#fef3c7"
                    : "#fef2f2"
                }; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">${
                    reportData.successRate >= 80
                      ? "📈"
                      : reportData.successRate >= 60
                      ? "📊"
                      : "📉"
                  }</span>
                </div>
              </div>
            </div>
            <div style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Total Test Cases</p>
                  <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${
                    reportData.totalTestCases
                  }</p>
                </div>
                <div style="width: 48px; height: 48px; background-color: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">⏱️</span>
                </div>
              </div>
            </div>
            <div style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Passed</p>
                  <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${
                    reportData.successfulTestCases
                  }</p>
                </div>
                <div style="width: 48px; height: 48px; background-color: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">✅</span>
                </div>
              </div>
            </div>
            <div style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Failed</p>
                  <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${
                    reportData.failedTestCases
                  }</p>
                </div>
                <div style="width: 48px; height: 48px; background-color: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">❌</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Request Metrics -->
          ${generateRequestMetricsHTML(reportData)}

          <!-- API Endpoints -->
          ${generateEndpointGroupHTML(endpointGroups)}

          <!-- Footer -->
          <div style="text-align: center; padding: 32px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Generated by Optraflow API Testing Platform</p>
            <p style="margin: 4px 0 0 0;">Report generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating HTML:", error);
    alert("Failed to generate HTML. Please try again.");
  }
};
