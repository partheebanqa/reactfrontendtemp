// src/utils/exportUtils.ts
import {
  TestCase,
  TestCategory,
  TestSuiteData,
} from '@/components/Reports/Components/TestCaseDetail';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* =========================
   PUBLIC API
   ========================= */

export const downloadAsPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Render the single report container to canvas (crisp output with scale)
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfW = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfH = pdf.internal.pageSize.getHeight(); // 297mm

  const imgW = pdfW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
  heightLeft -= pdfH;

  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pdfH;
  }

  pdf.save(filename);
};

export const downloadAsHTML = (elementId: string, filename: string) => {
  // The exporter expects report data on a global (set by page after load)
  const reportData = (window as any).__REPORT_DATA__;
  if (!reportData) {
    alert('Report data not available for export');
    return;
  }

  try {
    // Build categories (null-safe), then group
    const categories = buildCategories(reportData);
    const endpointGroups = groupTestCasesByEndpoint(categories);

    // Compose HTML
    const htmlContent = buildHTMLDocument(reportData, endpointGroups);

    // Download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating HTML:', err);
    alert('Failed to generate HTML. Please try again.');
  }
};

export const shareReport = (reportName: string) => {
  const shareUrl = `${window.location.origin}${
    window.location.pathname
  }?suite=${encodeURIComponent(reportName)}`;

  if (navigator.share) {
    navigator
      .share({
        title: `Test Suite Report: ${reportName}`,
        text: 'View this comprehensive API test suite report',
        url: shareUrl,
      })
      .catch(console.error);
  } else if (navigator.clipboard) {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => alert('Shareable link copied to clipboard!'))
      .catch(() => prompt('Copy this shareable link:', shareUrl));
  } else {
    prompt('Copy this shareable link:', shareUrl);
  }
};

/* =========================
   HELPERS (SAFE / HARDENED)
   ========================= */

const safeCat = (c: any): { apis: any[] } =>
  c && Array.isArray(c.apis) ? c : { apis: [] };

const buildCategories = (reportData: any) => {
  const categories: { title: string; category: { apis: any[] } }[] = [
    { title: 'Positive Tests', category: safeCat(reportData.positiveTests) },
    { title: 'Negative Tests', category: safeCat(reportData.negativeTests) },
    {
      title: 'Functional Tests',
      category: safeCat(reportData.functionalTests),
    },
    { title: 'Semantic Tests', category: safeCat(reportData.semanticTests) },
    { title: 'Edge Case Tests', category: safeCat(reportData.edgeCaseTests) },
    { title: 'Security Tests', category: safeCat(reportData.securityTests) },
    {
      title: 'Advanced Security Tests',
      category: safeCat(reportData.advancedSecurityTests),
    },
  ];

  // If all apis are empty, try to rebuild from "Style A" (requests[*].<group>.testCases)
  const apisCount = categories.reduce((n, c) => n + c.category.apis.length, 0);
  if (apisCount === 0 && Array.isArray(reportData?.requests)) {
    const groups = [
      'positiveTests',
      'negativeTests',
      'functionalTests',
      'semanticTests',
      'edgeCaseTests',
      'securityTests',
      'advancedSecurityTests',
    ];

    const label: Record<string, string> = {
      positiveTests: 'Positive Tests',
      negativeTests: 'Negative Tests',
      functionalTests: 'Functional Tests',
      semanticTests: 'Semantic Tests',
      edgeCaseTests: 'Edge Case Tests',
      securityTests: 'Security Tests',
      advancedSecurityTests: 'Advanced Security Tests',
    };

    const bucket: Record<string, any[]> = Object.fromEntries(
      groups.map((g) => [g, []])
    );

    for (const req of reportData.requests) {
      for (const g of groups) {
        const section = req?.[g];
        if (Array.isArray(section?.testCases)) {
          bucket[g].push(...section.testCases);
        }
      }
    }

    return groups.map((g) => ({
      title: label[g] || g,
      category: { apis: bucket[g] },
    }));
  }

  return categories;
};

const groupTestCasesByEndpoint = (
  categories: { title: string; category: TestCategory | any }[]
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

  for (const { title, category } of categories) {
    const apis = Array.isArray(category?.apis) ? category.apis : [];
    for (const tc of apis) {
      if (!tc || !tc.url || !tc.method) continue;
      const key = `${tc.method} ${tc.url}`;

      if (!endpointGroups[key]) {
        endpointGroups[key] = {
          endpoint: tc.url,
          method: tc.method,
          testCases: [],
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          avgDuration: 0,
        };
      }

      endpointGroups[key].testCases.push({
        ...(tc as TestCase),
        category: title,
      });
      endpointGroups[key].totalTests++;

      const s = String(tc.status || '').toLowerCase();
      if (s === 'passed') endpointGroups[key].passedTests++;
      else if (s === 'failed') endpointGroups[key].failedTests++;
      else if (s === 'skipped') endpointGroups[key].skippedTests++;
    }
  }

  Object.values(endpointGroups).forEach((group) => {
    const totalDuration = group.testCases.reduce(
      (sum, tc) => sum + Number((tc as any)?.duration || 0),
      0
    );
    group.avgDuration = group.testCases.length
      ? Math.round(totalDuration / group.testCases.length)
      : 0;
  });

  return endpointGroups;
};

const buildHTMLDocument = (
  reportData: TestSuiteData & any,
  endpointGroups: ReturnType<typeof groupTestCasesByEndpoint>
) => {
  const formatDate = (d: string) => new Date(d).toLocaleString();
  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  const generateRequestMetricsHTML = (data: TestSuiteData & any): string => {
    const metrics = data.requestMetrics ?? {
      totalRequests: 0,
      uniqueEndpoints: 0,
      averageResponseTime: 0,
      totalDataTransferred: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      requestsByMethod: {},
      statusCodeDistribution: {},
      errorTypes: {},
    };

    const formatBytes = (bytes: number) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const methodBars = Object.entries(metrics.requestsByMethod || {})
      .map(([method, count]: any) => {
        const pct =
          metrics.totalRequests > 0 ? (count / metrics.totalRequests) * 100 : 0;
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="padding:2px 8px;border-radius:4px;background:#eef2ff;color:#1e40af;font-size:12px;font-weight:500">${method}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:80px;height:8px;background:#e5e7eb;border-radius:4px;">
                <div style="width:${pct}%;height:100%;background:#6366f1;border-radius:4px;"></div>
              </div>
              <span style="font-weight:600;min-width:24px;">${count}</span>
            </div>
          </div>
        `;
      })
      .join('');

    const statusBars = Object.entries(metrics.statusCodeDistribution || {})
      .map(([codeStr, count]: any) => {
        const code = Number(codeStr);
        const pct =
          metrics.totalRequests > 0 ? (count / metrics.totalRequests) * 100 : 0;
        let color = '#6b7280';
        if (code >= 200 && code < 300) color = '#059669';
        else if (code >= 300 && code < 400) color = '#2563eb';
        else if (code >= 400 && code < 500) color = '#d97706';
        else if (code >= 500) color = '#dc2626';

        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="padding:2px 8px;border-radius:4px;background:${color}20;color:${color};font-size:12px;font-weight:500">${codeStr}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:80px;height:8px;background:#e5e7eb;border-radius:4px;">
                <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;"></div>
              </div>
              <span style="font-weight:600;min-width:24px;">${count}</span>
            </div>
          </div>
        `;
      })
      .join('');

    const errorBars =
      metrics.errorTypes && Object.keys(metrics.errorTypes).length > 0
        ? (() => {
            const total = Object.values(metrics.errorTypes).reduce(
              (a: any, b: any) => a + b,
              0
            );
            return Object.entries(metrics.errorTypes)
              .map(([name, count]: any) => {
                const pct = total > 0 ? (count / total) * 100 : 0;
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <span style="font-size:14px;color:#374151;flex:1;margin-right:8px;">${name}</span>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:64px;height:8px;background:#e5e7eb;border-radius:4px;">
                      <div style="width:${pct}%;height:100%;background:#dc2626;border-radius:4px;"></div>
                    </div>
                    <span style="font-weight:600;min-width:16px;">${count}</span>
                  </div>
                </div>
              `;
              })
              .join('');
          })()
        : '';

    return `
      <div style="background:#fff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);margin-bottom:32px;">
        <div style="padding:24px;">
          <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 24px 0;">📊 Request-Level Metrics</h2>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-bottom:32px;">
            ${metricCard(
              metrics.totalRequests,
              'Total Requests',
              '🌐',
              '#dbeafe'
            )}
            ${metricCard(
              metrics.uniqueEndpoints,
              'Unique Endpoints',
              '🗄️',
              '#dcfce7'
            )}
            ${metricCard(
              formatDuration(metrics.averageResponseTime),
              'Avg Response Time',
              '⏱️',
              '#f3e8ff'
            )}
            ${metricCard(
              formatBytes(metrics.totalDataTransferred),
              'Data Transferred',
              '📈',
              '#fed7aa'
            )}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
            <div>
              <h3 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 16px 0;">Response Time Range</h3>
              ${rangeRow(
                '⬇️ Fastest',
                formatDuration(metrics.minResponseTime),
                '#059669'
              )}
              ${rangeRow(
                '⏱️ Average',
                formatDuration(metrics.averageResponseTime),
                '#2563eb'
              )}
              ${rangeRow(
                '⬆️ Slowest',
                formatDuration(metrics.maxResponseTime),
                '#dc2626'
              )}
            </div>
            <div>
              <h3 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 16px 0;">HTTP Methods</h3>
              ${methodBars}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
            <div>
              <h3 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 16px 0;">Status Code Distribution</h3>
              ${statusBars}
            </div>
            ${
              errorBars
                ? `<div><h3 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 16px 0;">⚠️ Error Types</h3>${errorBars}</div>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
  };

  const endpointsHTML = generateEndpointGroupHTML(endpointGroups);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta name="google-site-verification" content="8sTzM9QArNVjvCUrjyG9TdNHyyHIGsHUymyOj3e8RBc" />
      <title>API Test Suite Report - ${escapeHtml(
        reportData.name || 'Report'
      )}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;margin:0;padding:20px;background:#f5f5f5;line-height:1.5}
        .report-container{max-width:1200px;margin:0 auto}
        @media print{body{background:#fff}.report-container{max-width:none}}
      </style>
      <script>
        function toggleTestCase(id){
          const el=document.getElementById(id);
          const t=document.getElementById('toggle-'+id);
          if(!el||!t)return;
          if(el.style.display==='none'||!el.style.display){el.style.display='block';t.textContent='🔽';}
          else{el.style.display='none';t.textContent='▶️';}
        }
      </script>
    </head>
    <body>
      <div class="report-container">
        <div style="background:#fff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);padding:32px;margin-bottom:32px;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px;">
            <div>
              <h1 style="font-size:30px;font-weight:700;color:#111827;margin:0 0 8px 0;">${escapeHtml(
                reportData.name || ''
              )}</h1>
              <p style="color:#6b7280;margin:0;">${escapeHtml(
                reportData.description || ''
              )}</p>
            </div>
            <div style="text-align:right;">
              <h2 style="font-size:24px;font-weight:700;color:#2563eb;margin:0;">Optraflow</h2>
              <p style="font-size:14px;color:#6b7280;margin:0;">API Testing Platform</p>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-bottom:32px;">
            ${kvRow(
              '📅',
              'Execution Date',
              formatDate(reportData.lastExecutionDate)
            )}
            ${kvRow('⏱️', 'Duration', formatDuration(reportData.duration))}
            ${kvRow(
              '👤',
              'Executed By',
              escapeHtml(reportData.executedBy || 'Unknown')
            )}
            ${kvRow(
              '🗄️',
              'Environment',
              escapeHtml(reportData.environmentId || 'Unknown')
            )}
          </div>
        </div>

        ${generateRequestMetricsHTML(reportData)}

        ${endpointsHTML}

        <div style="text-align:center;padding:32px;color:#6b7280;font-size:14px;">
          <p style="margin:0;">Generated by Optraflow API Testing Platform</p>
          <p style="margin:4px 0 0 0;">Report generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/* =========================
   TEMPLATING SUB-HELPERS
   ========================= */

const metricCard = (value: any, label: string, icon: string, bg: string) => `
  <div style="background:#fff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);padding:24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <p style="font-size:14px;color:#6b7280;margin:0 0 4px 0;">${label}</p>
        <p style="font-size:24px;font-weight:700;color:#111827;margin:0;">${value}</p>
      </div>
      <div style="width:48px;height:48px;background:${bg};border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:24px;">${icon}</span>
      </div>
    </div>
  </div>
`;

const rangeRow = (name: string, val: string, color: string) => `
  <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
    <span style="color:${color};">${name}</span>
    <span style="font-weight:600;color:${color};">${val}</span>
  </div>
`;

const escapeHtml = (s: string) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/* =========================
   ENDPOINTS SECTION (HTML)
   ========================= */

const getMethodBadgeStyle = (method: string): string => {
  const styles: Record<string, string> = {
    GET: 'background-color:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;',
    POST: 'background-color:#dcfce7;color:#166534;border:1px solid #bbf7d0;',
    PUT: 'background-color:#fef3c7;color:#92400e;border:1px solid #fde68a;',
    DELETE: 'background-color:#fef2f2;color:#991b1b;border:1px solid #fecaca;',
    PATCH: 'background-color:#f3e8ff;color:#7c2d12;border:1px solid #e9d5ff;',
    OPTIONS: 'background-color:#f3f4f6;color:#374151;border:1px solid #d1d5db;',
  };
  return styles[method] || styles['OPTIONS'];
};

const formatResponse = (response: any) => {
  if (response == null) return '';
  if (typeof response === 'object') {
    try {
      return JSON.stringify(response, null, 2);
    } catch {
      return String(response);
    }
  }
  try {
    return JSON.stringify(JSON.parse(response), null, 2);
  } catch {
    return String(response);
  }
};

const generateCollapsibleTestCaseHTML = (
  testCase: TestCase & { category: string }
): string => {
  const status = (testCase.status || '').toLowerCase();
  const statusMap: Record<string, { bg: string; color: string; icon: string }> =
    {
      passed: { bg: '#dcfce7', color: '#166534', icon: '✅' },
      failed: { bg: '#fef2f2', color: '#991b1b', icon: '❌' },
      skipped: { bg: '#fefce8', color: '#92400e', icon: '⚠️' },
    };
  const s = statusMap[status] || statusMap['failed'];

  const sev = (testCase as any).severity || 'medium';
  const sevColor: Record<string, string> = {
    critical: 'background-color:#dc2626;color:#fff;',
    high: 'background-color:#ea580c;color:#fff;',
    medium: 'background-color:#ca8a04;color:#fff;',
    low: 'background-color:#2563eb;color:#fff;',
  };

  const testCaseId = `testcase-${testCase.id}`;

  return `
    <div style="border:1px solid #e5e7eb;border-radius:6px;margin-bottom:16px;overflow:hidden;">
      <div style="padding:16px;background:#f9fafb;cursor:pointer;" onclick="toggleTestCase('${testCaseId}')">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:16px;">
          <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
            <span id="toggle-${testCaseId}" style="font-size:14px;color:#6b7280;">▶️</span>
            <h4 style="font-size:16px;font-weight:600;color:#111827;margin:0;word-break:break-word;">${escapeHtml(
              testCase.name
            )}</h4>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="display:inline-flex;align-items:center;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;background:#f3f4f6;color:#374151;">${escapeHtml(
                (testCase as any).category
              )}</span>
              <span style="display:inline-flex;align-items:center;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:500;${
                sevColor[sev] || sevColor.medium
              }">${String(sev).toUpperCase()}</span>
              <span style="display:inline-flex;align-items:center;padding:4px 8px;border-radius:9999px;font-size:12px;font-weight:500;gap:4px;background:${
                s.bg
              };color:${s.color};border:1px solid #e5e7eb;">${s.icon} ${String(
    status
  ).toUpperCase()}</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;font-size:13px;color:#6b7280;">
              <span>⏱️ ${(testCase as any).duration ?? 0}ms</span>
              <span>📊 ${(testCase as any).responseSize ?? 0}B</span>
              ${
                (testCase as any).statusCode
                  ? `<span>🔢 ${(testCase as any).statusCode}</span>`
                  : ''
              }
            </div>
          </div>
        </div>
      </div>
      <div id="${testCaseId}" style="display:none;padding:20px;background:#fff;border-top:1px solid #e5e7eb;">
        <div style="margin-bottom:20px;">
          <h5 style="font-size:14px;font-weight:600;color:#111827;margin:0 0 8px 0;">📝 Request cURL</h5>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;overflow-x:auto;">
            <code style="font-family:Monaco,Menlo,Ubuntu Mono,monospace;font-size:13px;line-height:1.4;color:#1e293b;white-space:pre-wrap;word-break:break-all;">${escapeHtml(
              (testCase as any).requestCurl || ''
            )}</code>
          </div>
        </div>
        <div>
          <h5 style="font-size:14px;font-weight:600;color:#111827;margin:0 0 8px 0;">📄 Response</h5>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;overflow-x:auto;">
            <pre style="font-family:Monaco,Menlo,Ubuntu Mono,monospace;font-size:13px;line-height:1.4;color:#1e293b;margin:0;white-space:pre-wrap;word-break:break-all;">${escapeHtml(
              formatResponse((testCase as any).response)
            )}</pre>
          </div>
        </div>
      </div>
    </div>
  `;
};

const generateEndpointGroupHTML = (
  endpointGroups: ReturnType<typeof groupTestCasesByEndpoint>
): string => {
  if (!endpointGroups || Object.keys(endpointGroups).length === 0) {
    return `
      <div style="background:#fff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);padding:32px;text-align:center;">
        <h3 style="color:#6b7280;margin:0;">No API endpoints found</h3>
      </div>
    `;
  }

  const blocks = Object.entries(endpointGroups)
    .map(([_, group]) => {
      const successRate =
        group.totalTests > 0
          ? Math.round((group.passedTests / group.totalTests) * 100)
          : 0;
      const successRateColor =
        successRate >= 80
          ? '#059669'
          : successRate >= 60
          ? '#d97706'
          : '#dc2626';

      return `
        <div style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;overflow:hidden;">
          <div style="padding:20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
              <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
                <span style="display:inline-flex;align-items:center;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600;${getMethodBadgeStyle(
                  group.method
                )}">${group.method}</span>
                <div style="flex:1;min-width:0;">
                  <h3 style="font-size:16px;font-weight:600;color:#111827;margin:0;word-break:break-all;">${escapeHtml(
                    group.endpoint
                  )}</h3>
                  <p style="font-size:14px;color:#6b7280;margin:4px 0 0 0;">${
                    group.totalTests
                  } test case${group.totalTests !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:20px;font-size:14px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:4px;color:#059669;"><span>✅</span><span>${
                  group.passedTests
                }</span></div>
                <div style="display:flex;align-items:center;gap:4px;color:#dc2626;"><span>❌</span><span>${
                  group.failedTests
                }</span></div>
                ${
                  group.skippedTests
                    ? `<div style="display:flex;align-items:center;gap:4px;color:#d97706;"><span>⚠️</span><span>${group.skippedTests}</span></div>`
                    : ''
                }
                <div style="display:flex;align-items:center;gap:4px;color:#6b7280;"><span>⏱️</span><span>${
                  group.avgDuration
                }ms avg</span></div>
                <div style="font-weight:600;color:${successRateColor};">${successRate}%</div>
              </div>
            </div>
          </div>
          <div style="padding:20px;">
            ${group.testCases
              .map((tc) => generateCollapsibleTestCaseHTML(tc))
              .join('')}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div style="background:#fff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);margin-bottom:32px;">
      <div style="padding:24px;border-bottom:1px solid #f3f4f6;">
        <h2 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px 0;display:flex;align-items:center;">🌐 API Endpoints (${
          Object.keys(endpointGroups).length
        } endpoints)</h2>
        <p style="color:#6b7280;margin:0;">Test results organized by API endpoint</p>
      </div>
      <div style="padding:24px;">
        ${blocks}
      </div>
    </div>
  `;
};
