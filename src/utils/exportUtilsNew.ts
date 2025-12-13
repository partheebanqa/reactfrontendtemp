import {
  TestCase,
  TestCategory,
  TestSuiteData,
} from "@/components/Reports/Components/TestCaseDetail";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Lightweight PDF generation with modern design
const generateLightweightPDFContent = (data: TestSuiteData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Group test cases by API endpoint for metrics
  const categories = [
    { title: "Positive Tests", category: data.positiveTests },
    { title: "Negative Tests", category: data.negativeTests },
    { title: "Functional Tests", category: data.functionalTests },
    { title: "Semantic Tests", category: data.semanticTests },
    { title: "Edge Case Tests", category: data.edgeCaseTests },
    { title: "Security Tests", category: data.securityTests },
    { title: "Advanced Security Tests", category: data.advancedSecurityTests },
  ];

  const endpointGroups = groupTestCasesByEndpoint(categories);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">${
              data.name
            }</h1>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">${
              data.description
            }</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 18px; font-weight: 600; color: #2563eb; margin: 0;">Optraflow</h2>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">API Testing Report</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: ${
              data.successRate >= 80
                ? "#059669"
                : data.successRate >= 60
                ? "#d97706"
                : "#dc2626"
            };">${data.successRate}%</div>
            <div style="font-size: 12px; color: #6b7280;">Success Rate</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${
              data.totalTestCases
            }</div>
            <div style="font-size: 12px; color: #6b7280;">Total Tests</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${formatDuration(
              data.duration
            )}</div>
            <div style="font-size: 12px; color: #6b7280;">Duration</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${
              Object.keys(endpointGroups).length
            }</div>
            <div style="font-size: 12px; color: #6b7280;">API Endpoints</div>
          </div>
        </div>
      </div>

      <!-- Test Results Summary -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Test Results Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #059669;">${
              data.successfulTestCases
            }</div>
            <div style="font-size: 12px; color: #059669; font-weight: 500;">PASSED</div>
          </div>
          <div style="text-align: center; padding: 15px; background: #fef2f2; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${
              data.failedTestCases
            }</div>
            <div style="font-size: 12px; color: #dc2626; font-weight: 500;">FAILED</div>
          </div>
          <div style="text-align: center; padding: 15px; background: #fefce8; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #d97706;">${
              data.skippedTestCases
            }</div>
            <div style="font-size: 12px; color: #d97706; font-weight: 500;">SKIPPED</div>
          </div>
        </div>
      </div>

      <!-- API Endpoints Summary -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">API Endpoints Summary</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <th style="text-align: left; padding: 8px; font-weight: 600; color: #374151;">Endpoint</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; color: #374151;">Method</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; color: #374151;">Tests</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; color: #374151;">Success</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; color: #374151;">Avg Time</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(endpointGroups)
              .slice(0, 15)
              .map(([_, group], index) => {
                const successRate = Math.round(
                  (group.passedTests / group.totalTests) * 100
                );
                const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb";
                return `
                <tr style="background: ${bgColor}; border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 8px; color: #374151; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${
                    group.endpoint
                  }</td>
                  <td style="text-align: center; padding: 8px;">
                    <span style="background: ${getMethodColor(
                      group.method
                    )}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">${
                  group.method
                }</span>
                  </td>
                  <td style="text-align: center; padding: 8px; color: #374151;">${
                    group.totalTests
                  }</td>
                  <td style="text-align: center; padding: 8px; color: ${
                    successRate >= 80
                      ? "#059669"
                      : successRate >= 60
                      ? "#d97706"
                      : "#dc2626"
                  }; font-weight: 600;">${successRate}%</td>
                  <td style="text-align: center; padding: 8px; color: #374151;">${
                    group.avgDuration
                  }ms</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
        ${
          Object.keys(endpointGroups).length > 15
            ? `
          <p style="font-size: 11px; color: #6b7280; margin: 8px 0 0 0; text-align: center;">
            Showing top 15 endpoints. Full report available in HTML export.
          </p>
        `
            : ""
        }
      </div>

      <!-- Performance Metrics -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Performance Metrics</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Response Times</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 4px 0; color: #059669;">Fastest:</td><td style="text-align: right; font-weight: 600;">${
                data?.requestMetrics?.minResponseTime
              }ms</td></tr>
              <tr><td style="padding: 4px 0; color: #2563eb;">Average:</td><td style="text-align: right; font-weight: 600;">${Math.round(
                data?.requestMetrics?.averageResponseTime
              )}ms</td></tr>
              <tr><td style="padding: 4px 0; color: #dc2626;">Slowest:</td><td style="text-align: right; font-weight: 600;">${
                data?.requestMetrics?.maxResponseTime
              }ms</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Data Transfer</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 4px 0;">Total Requests:</td><td style="text-align: right; font-weight: 600;">${
                data?.requestMetrics?.totalRequests
              }</td></tr>
              <tr><td style="padding: 4px 0;">Data Transferred:</td><td style="text-align: right; font-weight: 600;">${formatBytes(
                data?.requestMetrics?.totalDataTransferred
              )}</td></tr>
              <tr><td style="padding: 4px 0;">Unique Endpoints:</td><td style="text-align: right; font-weight: 600;">${
                data?.requestMetrics?.uniqueEndpoints
              }</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Test Categories -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Test Categories</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${categories
            .filter((cat) => cat?.category?.total > 0)
            .map(({ title, category }) => {
              const successRate = Math.round(
                (category.passed / category.total) * 100
              );
              return `
              <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa;">
                <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 11px; color: #6b7280;">
                  ${category.total} tests • ${successRate}% success
                </div>
                <div style="display: flex; gap: 8px; margin-top: 4px; font-size: 10px;">
                  <span style="color: #059669;">✓ ${category.passed}</span>
                  <span style="color: #dc2626;">✗ ${category.failed}</span>
                  ${
                    category.skipped > 0
                      ? `<span style="color: #d97706;">⚠ ${category.skipped}</span>`
                      : ""
                  }
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 11px; color: #6b7280;">
        <p style="margin: 0;">Generated by Optraflow • ${formatDate(
          data.lastExecutionDate
        )}</p>
        <p style="margin: 4px 0 0 0;">For detailed test cases and responses, download the full HTML report</p>
      </div>
    </div>
  `;
};

const getMethodColor = (method: string): string => {
  const colors = {
    GET: "#2563eb",
    POST: "#059669",
    PUT: "#d97706",
    DELETE: "#dc2626",
    PATCH: "#7c3aed",
    OPTIONS: "#6b7280",
  };
  return colors[method as keyof typeof colors] || "#6b7280";
};

export const downloadAsPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Get data from the global window object
  const reportData = (window as any).__REPORT_DATA__;

  if (!reportData) {
    alert("Report data not available for export");
    return;
  }

  // Create a temporary container with lightweight content
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "0";
  tempContainer.style.width = "800px";
  tempContainer.style.backgroundColor = "white";

  // Generate lightweight PDF content
  tempContainer.innerHTML = generateLightweightPDFContent(reportData);
  document.body.appendChild(tempContainer);

  try {
    // Generate canvas from the temporary container
    const canvas = await html2canvas(tempContainer, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: "#ffffff",
      scale: 1,
      logging: false,
      width: 800,
      height: tempContainer.scrollHeight,
    });

    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    // Remove temporary container
    document.body.removeChild(tempContainer);
  }
};

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

  categories?.forEach(({ title, category }) => {
    category?.apis?.forEach((testCase) => {
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
