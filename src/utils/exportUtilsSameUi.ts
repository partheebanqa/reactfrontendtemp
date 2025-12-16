// src/utils/exportUtilsSameUi.ts
// Export the report with the same UI (Tailwind + Lucide) and Prism code theme.
// Provides HTML + PDF exporters. Requires: html2canvas, jspdf in your app.
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { convertDateStamp } from "./exportDate";

/* ---------------- Types (trimmed) ---------------- */
type Status = "passed" | "failed" | "skipped";
type Severity = "low" | "medium" | "high" | "critical";

type TestCase = {
  id: string;
  name: string;
  category?: string;
  subCategory?: string;
  method: string;
  url: string;
  status: Status;
  severity: Severity;
  responseSize: number;
  duration: number;
  extractedVariables?: any;
  requestCurl: string;
  response: any;
  statusCode?: number;
};

type TestGroup = { testCases?: TestCase[] };

type RequestResult = {
  method: string;
  url: string;
  positiveTests?: TestGroup;
  negativeTests?: TestGroup;
  functionalTests?: TestGroup;
  semanticTests?: TestGroup;
  edgeCaseTests?: TestGroup;
  securityTests?: TestGroup;
  advancedSecurityTests?: TestGroup;
};

type TestCategory = { apis?: TestCase[] } | undefined;

type TestSuiteData = {
  name: string;
  description: string;
  environmentId: string;
  lastExecutionDate: string;
  duration: number;
  executedBy: string;
  successRate?: number;
  totalTestCases?: number;
  successfulTestCases?: number;
  failedTestCases?: number;
  positiveTests?: TestCategory;
  negativeTests?: TestCategory;
  functionalTests?: TestCategory;
  semanticTests?: TestCategory;
  edgeCaseTests?: TestCategory;
  securityTests?: TestCategory;
  advancedSecurityTests?: TestCategory;
  requests?: RequestResult[];
};

declare global {
  interface Window {
    __REPORT_DATA__?: TestSuiteData;
  }
}

/* ---------------- Public API ---------------- */
type ExportOpts = {
  codeTheme?: "dark" | "light"; // Prism theme. default: dark
};

export const downloadAsHTMLSameUI = (
  elementId: string,
  filename: string,
  opts: ExportOpts = {}
) => {
  const data = window.__REPORT_DATA__;
  if (!data) {
    alert("Report data not available for export");
    return;
  }
  const html = buildHTML(data, elementId, {
    includeButtons: false,
    codeTheme: opts.codeTheme ?? "dark",
  });
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const downloadAsPDFSameUI = async (
  elementId: string,
  filename: string,
  opts: ExportOpts & { scale?: number; expandAll?: boolean } = {}
) => {
  const data = window.__REPORT_DATA__;
  if (!data) {
    alert("Report data not available for export");
    return;
  }

  // Build same HTML in an offscreen iframe (same origin)
  const html = buildHTML(data, elementId, {
    includeButtons: false,
    codeTheme: opts.codeTheme ?? "dark",
  });
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.width = "1200";
  iframe.height = "10";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  await waitForDOMContentLoaded(iframe);
  await waitForLucide(iframe);
  await waitForPrism(iframe);

  if (opts.expandAll !== false) expandAllBlocks(iframe);

  const scale = opts.scale ?? 2;
  const canvas = await html2canvas(doc.body, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
  heightLeft -= pageH;

  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename);
  document.body.removeChild(iframe);
};

/* ---------------- Wait helpers ---------------- */
const waitForDOMContentLoaded = (iframe: HTMLIFrameElement) =>
  new Promise<void>((resolve) => {
    const doc = iframe.contentDocument!;
    if (doc.readyState === "complete" || doc.readyState === "interactive") {
      setTimeout(resolve, 120);
    } else {
      doc.addEventListener("DOMContentLoaded", () => setTimeout(resolve, 120), {
        once: true,
      });
    }
  });

const waitForLucide = (iframe: HTMLIFrameElement) =>
  new Promise<void>((resolve) => {
    const win = iframe.contentWindow as any;
    try {
      win?.lucide?.createIcons?.();
    } catch {}
    setTimeout(resolve, 100);
  });

const waitForPrism = (iframe: HTMLIFrameElement) =>
  new Promise<void>((resolve) => {
    const win = iframe.contentWindow as any;
    try {
      win?.Prism?.highlightAll?.();
    } catch {}
    setTimeout(resolve, 140); // give autoloader a tick
  });

const expandAllBlocks = (iframe: HTMLIFrameElement) => {
  const doc = iframe.contentDocument!;
  doc
    .querySelectorAll<HTMLElement>('[id^="url-"]')
    .forEach((el) => el.classList.remove("hidden"));
  doc
    .querySelectorAll<HTMLElement>('.toggle-icon[data-for^="url-"]')
    .forEach((i) => i.setAttribute("data-lucide", "chevron-down"));
  doc
    .querySelectorAll<HTMLElement>('[id^="tc-"]')
    .forEach((el) => el.classList.remove("hidden"));
  doc
    .querySelectorAll<HTMLElement>('.toggle-icon[data-for^="tc-"]')
    .forEach((i) => i.setAttribute("data-lucide", "chevron-down"));
  const win = iframe.contentWindow as any;
  try {
    win?.lucide?.createIcons?.();
  } catch {}
};

/* ---------------- HTML builder (same UI + Prism) ---------------- */
const escapeHtml = (s: any) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const prettyJsonMaybe = (input: any) => {
  if (input == null) return "";
  if (typeof input === "object") {
    try {
      return JSON.stringify(input, null, 2);
    } catch {
      return String(input);
    }
  }
  try {
    return JSON.stringify(JSON.parse(String(input)), null, 2);
  } catch {
    return String(input);
  }
};
// const fmtDate = (d: string) => (d ? new Date(d).toLocaleString() : "");
const fmtDuration = (ms: number) => `${((ms ?? 0) / 1000).toFixed(2)}s`;
const fmtBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const methodChip = (method: string) => {
  const m: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800 border-blue-200",
    POST: "bg-green-100 text-green-800 border-green-200",
    PUT: "bg-yellow-100 text-yellow-800 border-yellow-200",
    DELETE: "bg-red-100 text-red-800 border-red-200",
    PATCH: "bg-purple-100 text-purple-800 border-purple-200",
    OPTIONS: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return m[(method || "").toUpperCase()] || m.OPTIONS;
};
const statusChip = (status: Status) => {
  const m: Record<Status, string> = {
    passed: "bg-green-100 text-green-800 border-green-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    skipped: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  return m[status] || "bg-gray-100 text-gray-800 border-gray-200";
};
const severityChip = (sev: Severity) => {
  const m: Record<Severity, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-600 text-white",
    medium: "bg-yellow-600 text-white",
    low: "bg-blue-600 text-white",
  };
  return m[sev] || "bg-gray-600 text-white";
};

const normalizeUrlKey = (raw: string) => {
  try {
    const u = new URL(raw);
    const origin = `${u.protocol}//${u.host.toLowerCase()}`;
    const path = u.pathname.replace(/\/$/, "");
    return `${origin}${path}${u.search}`;
  } catch {
    return (raw || "").trim().replace(/\/$/, "");
  }
};

const collectTestCases = (data: TestSuiteData): TestCase[] => {
  const cats: TestCase[] = [
    ...(data.positiveTests?.apis ?? []),
    ...(data.negativeTests?.apis ?? []),
    ...(data.functionalTests?.apis ?? []),
    ...(data.semanticTests?.apis ?? []),
    ...(data.edgeCaseTests?.apis ?? []),
    ...(data.securityTests?.apis ?? []),
    ...(data.advancedSecurityTests?.apis ?? []),
  ];
  if (cats.length) return cats;

  const groups = [
    "positiveTests",
    "negativeTests",
    "functionalTests",
    "semanticTests",
    "edgeCaseTests",
    "securityTests",
    "advancedSecurityTests",
  ] as const;
  const rows: TestCase[] = [];
  for (const req of data.requests ?? []) {
    for (const g of groups) {
      const tg = (req as any)[g] as TestGroup | undefined;
      for (const tc of tg?.testCases ?? []) {
        rows.push({
          ...tc,
          method: tc.method || (req.method as any),
          url: tc.url || (req.url as any),
        });
      }
    }
  }
  return rows;
};

const groupByUrlThenMethod = (tcs: TestCase[]) => {
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
    key: string;
    endpoint: string;
    methods: Record<string, MethodBucket>;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    avgDuration: number;
  };
  const groups: Record<string, UrlGroup> = {};
  for (const tc of tcs) {
    const key = normalizeUrlKey(tc.url || "");
    if (!groups[key])
      groups[key] = {
        key,
        endpoint: tc.url,
        methods: {},
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        avgDuration: 0,
      };
    const g = groups[key];
    const m = (tc.method || "").toUpperCase();
    if (!g.methods[m])
      g.methods[m] = {
        method: m,
        testCases: [],
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        avgDuration: 0,
      };
    const mb = g.methods[m];
    mb.testCases.push(tc);
    mb.total++;
    if (tc.status === "passed") mb.passed++;
    else if (tc.status === "failed") mb.failed++;
    else if (tc.status === "skipped") mb.skipped++;
    g.total++;
    if (tc.status === "passed") g.passed++;
    else if (tc.status === "failed") g.failed++;
    else if (tc.status === "skipped") g.skipped++;
  }
  Object.values(groups).forEach((g) => {
    Object.values(g.methods).forEach((mb) => {
      const dur = mb.testCases.reduce((s, t) => s + (t.duration || 0), 0);
      mb.avgDuration = mb.total ? Math.round(dur / mb.total) : 0;
    });
    const allDur = Object.values(g.methods)
      .flatMap((mb) => mb.testCases)
      .reduce((s, t) => s + (t.duration || 0), 0);
    g.avgDuration = g.total ? Math.round(allDur / g.total) : 0;
  });
  return Object.values(groups);
};

const successPct = (p: number, t: number) =>
  t ? Math.round((p / t) * 100) : 0;

/* ---------------- RequestMetrics (compute + section) ---------------- */

type RequestMetricsShape = {
  totalRequests: number;
  uniqueEndpoints: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalDataTransferred: number;
  requestsByMethod: Record<string, number>;
  statusCodeDistribution: Record<string, number>;
  errorTypes: Record<string, number>;
  slowestRequests: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
    duration: number;
  }>;
  fastestRequests: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
    duration: number;
  }>;
};

const buildRequestMetricsFromCases = (tcs: TestCase[]): RequestMetricsShape => {
  const totalRequests = tcs.length;
  const uniqueEndpoints = new Set(tcs.map((t) => normalizeUrlKey(t.url))).size;

  const durations = tcs
    .map((t) => Number(t.duration || 0))
    .filter((n) => Number.isFinite(n));
  const minResponseTime = durations.length ? Math.min(...durations) : 0;
  const maxResponseTime = durations.length ? Math.max(...durations) : 0;
  const averageResponseTime = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const totalDataTransferred = tcs.reduce(
    (s, t) => s + Number(t.responseSize || 0),
    0
  );

  const requestsByMethod: Record<string, number> = {};
  tcs.forEach((t) => {
    const m = (t.method || "").toUpperCase();
    requestsByMethod[m] = (requestsByMethod[m] || 0) + 1;
  });

  const statusCodeDistribution: Record<string, number> = {};
  tcs.forEach((t) => {
    if (t.statusCode != null) {
      const key = String(t.statusCode);
      statusCodeDistribution[key] = (statusCodeDistribution[key] || 0) + 1;
    }
  });

  // You can refine this if you have richer error typing in your data
  const errorTypes: Record<string, number> = {};
  tcs.forEach((t) => {
    if (t.status === "failed") {
      const key = t.category || "Failed";
      errorTypes[key] = (errorTypes[key] || 0) + 1;
    }
  });

  const sortedByDuration = [...tcs].sort(
    (a, b) => (b.duration || 0) - (a.duration || 0)
  );
  const slowestRequests = sortedByDuration.slice(0, 5).map((r) => ({
    id: r.id,
    name: r.name,
    method: r.method,
    url: r.url,
    duration: r.duration || 0,
  }));
  const fastestRequests = [...tcs]
    .sort((a, b) => (a.duration || 0) - (b.duration || 0))
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      name: r.name,
      method: r.method,
      url: r.url,
      duration: r.duration || 0,
    }));

  return {
    totalRequests,
    uniqueEndpoints,
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    totalDataTransferred,
    requestsByMethod,
    statusCodeDistribution,
    errorTypes,
    slowestRequests,
    fastestRequests,
  };
};

const buildRequestMetricsSection = (m: RequestMetricsShape) => {
  const methodsHtml = Object.entries(m.requestsByMethod)
    .map(
      ([method, count]) => `
    <div class="flex items-center justify-between">
      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${methodChip(
        method
      )}">${method}</span>
      <div class="flex items-center space-x-2">
        <div class="w-20 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width:${
            (count / Math.max(m.totalRequests, 1)) * 100
          }%"></div>
        </div>
        <span class="text-sm font-semibold text-gray-900 w-8">${count}</span>
      </div>
    </div>`
    )
    .join("");

  const statusHtml = Object.entries(m.statusCodeDistribution)
    .map(
      ([code, count]) => `
    <div class="flex items-center justify-between">
      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        // simple color bucketing
        parseInt(code, 10) >= 500
          ? "bg-red-100 text-red-800"
          : parseInt(code, 10) >= 400
          ? "bg-yellow-100 text-yellow-800"
          : parseInt(code, 10) >= 300
          ? "bg-blue-100 text-blue-800"
          : "bg-green-100 text-green-800"
      }">${code}</span>
      <div class="flex items-center space-x-2">
        <div class="w-20 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width:${
            (count / Math.max(m.totalRequests, 1)) * 100
          }%"></div>
        </div>
        <span class="text-sm font-semibold text-gray-900 w-8">${count}</span>
      </div>
    </div>`
    )
    .join("");

  const errorTotal = Object.values(m.errorTypes).reduce((a, b) => a + b, 0);
  const errorHtml =
    Object.keys(m.errorTypes).length > 0
      ? `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="alert-triangle" class="w-5 h-5 mr-2 text-red-600"></i>
          Error Types
        </h3>
        <div class="space-y-3">
          ${Object.entries(m.errorTypes)
            .map(
              ([err, count]) => `
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700 truncate flex-1 mr-2">${escapeHtml(
                err
              )}</span>
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-gray-200 rounded-full h-2">
                  <div class="bg-red-600 h-2 rounded-full" style="width:${
                    (count / Math.max(errorTotal, 1)) * 100
                  }%"></div>
                </div>
                <span class="text-sm font-semibold text-gray-900 w-6">${count}</span>
              </div>
            </div>`
            )
            .join("")}
        </div>
      </div>`
      : "";

  const slowHtml = m.slowestRequests
    .map(
      (r, i) => `
    <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${escapeHtml(
          r.name
        )}</p>
        <p class="text-xs text-gray-500 truncate">${escapeHtml(
          r.method
        )} ${escapeHtml(r.url)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-red-600">${r.duration}ms</p>
        <p class="text-xs text-gray-500">#${i + 1}</p>
      </div>
    </div>`
    )
    .join("");

  const fastHtml = m.fastestRequests
    .map(
      (r, i) => `
    <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${escapeHtml(
          r.name
        )}</p>
        <p class="text-xs text-gray-500 truncate">${escapeHtml(
          r.method
        )} ${escapeHtml(r.url)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-green-600">${r.duration}ms</p>
        <p class="text-xs text-gray-500">#${i + 1}</p>
      </div>
    </div>`
    )
    .join("");

  return `
  <div class="space-y-6">
    <!-- Overview -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <i data-lucide="activity" class="w-6 h-6 mr-2 text-blue-600"></i>
        Request-Level Metrics
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
            <i data-lucide="globe" class="w-6 h-6 text-blue-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${m.totalRequests}</p>
          <p class="text-sm text-gray-500">Total Requests</p>
        </div>

        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
            <i data-lucide="database" class="w-6 h-6 text-green-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${m.uniqueEndpoints}</p>
          <p class="text-sm text-gray-500">Unique Endpoints</p>
        </div>

        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
            <i data-lucide="clock" class="w-6 h-6 text-purple-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${
            m.averageResponseTime
          }ms</p>
          <p class="text-sm text-gray-500">Avg Response Time</p>
        </div>

        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
            <i data-lucide="trending-up" class="w-6 h-6 text-orange-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${fmtBytes(
            m.totalDataTransferred
          )}</p>
          <p class="text-sm text-gray-500">Data Transferred</p>
        </div>
      </div>
    </div>

    <!-- Performance Insights -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Response Time Range</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="trending-down" class="w-4 h-4 text-green-600"></i>
              <span class="text-sm text-gray-600">Fastest</span>
            </div>
            <span class="font-semibold text-green-600">${
              m.minResponseTime
            }ms</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="clock" class="w-4 h-4 text-blue-600"></i>
              <span class="text-sm text-gray-600">Average</span>
            </div>
            <span class="font-semibold text-blue-600">${
              m.averageResponseTime
            }ms</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="trending-up" class="w-4 h-4 text-red-600"></i>
              <span class="text-sm text-gray-600">Slowest</span>
            </div>
            <span class="font-semibold text-red-600">${
              m.maxResponseTime
            }ms</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">HTTP Methods</h3>
        <div class="space-y-3">${methodsHtml}</div>
      </div>
    </div>

    <!-- Status Codes and Error Types -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Status Code Distribution</h3>
        <div class="space-y-3">${statusHtml}</div>
      </div>

      ${errorHtml}
    </div>

    <!-- Performance Extremes -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="trending-up" class="w-5 h-5 mr-2 text-red-600"></i>
          Slowest Requests
        </h3>
        <div class="space-y-3">${slowHtml}</div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="trending-down" class="w-5 h-5 mr-2 text-green-600"></i>
          Fastest Requests
        </h3>
        <div class="space-y-3">${fastHtml}</div>
      </div>
    </div>
  </div>`;
};

/* ---------------- Existing sections ---------------- */

const buildHeader = (d: TestSuiteData, logoSrc: string | null) => `
  <div class="border border-gray-200 bg-white rounded-lg px-6 py-3 mt-3">
    <div class="flex justify-between items-start mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">${escapeHtml(
          d.name
        )}</h1>
        <p class="text-gray-600">${escapeHtml(d.description)}</p>
      </div>
      <div>${
        logoSrc
          ? `<img src="${escapeHtml(
              logoSrc
            )}" alt="Optraflow logo" style="width:100%;height:50px" />`
          : ""
      }
          </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3">
      <div class="flex items-center space-x-3">
        <i data-lucide="calendar" class="w-5 h-5 text-blue-500"></i>
        <div><p class="text-sm text-gray-500">Execution Date</p><p class="font-semibold">${
          convertDateStamp(Date.parse(d.lastExecutionDate)).dateTime
        }</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="clock" class="w-5 h-5 text-green-500"></i>
        <div><p class="text-sm text-gray-500">Duration</p><p class="font-semibold">${fmtDuration(
          d.duration
        )}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="user" class="w-5 h-5 text-purple-500"></i>
        <div><p class="text-sm text-gray-500">Executed By</p><p class="font-semibold text-xs">${escapeHtml(
          d.executedBy
        )}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="database" class="w-5 h-5 text-orange-500"></i>
        <div><p class="text-sm text-gray-500">Environment</p><p class="font-semibold text-xs">${escapeHtml(
          d.environmentId
        )}</p></div>
      </div>
    </div>
  </div>
`;

const buildMetricCards = (d: TestSuiteData, tcs: TestCase[]) => {
  const total = tcs.length || Number(d.totalTestCases || 0);
  const passed =
    (tcs.length ? tcs.filter((t) => t.status === "passed").length : 0) ||
    Number(d.successfulTestCases || 0);
  const failed =
    (tcs.length ? tcs.filter((t) => t.status === "failed").length : 0) ||
    Number(d.failedTestCases || 0);
  const successRate = total
    ? Math.round((passed / total) * 100)
    : d.successRate || 0;
  const rateColor =
    successRate >= 80
      ? "text-green-600 bg-green-100"
      : successRate >= 60
      ? "text-yellow-600 bg-yellow-100"
      : "text-red-600 bg-red-100";
  return `
  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3 mt-3">
    ${metricCard("Success Rate", `${successRate}%`, "trending-up", rateColor)}
    ${metricCard(
      "Total Test Cases",
      `${total}`,
      "clock",
      "text-blue-600 bg-blue-100"
    )}
    ${metricCard(
      "Passed",
      `${passed}`,
      "check-circle",
      "text-green-600 bg-green-100"
    )}
    ${metricCard("Failed", `${failed}`, "x-circle", "text-red-600 bg-red-100")}
  </div>`;
};
const metricCard = (
  title: string,
  value: string,
  icon: string,
  color: string
) => `
  <div class="border border-gray-200 bg-white rounded-lg px-6 py-6">
    <div class="flex items-center justify-between">
      <div><p class="text-sm text-gray-500 mb-1">${title}</p><p class="text-2xl font-bold text-gray-900">${value}</p></div>
      <div class="p-3 rounded-full ${color}"><i data-lucide="${icon}" class="w-6 h-6"></i></div>
    </div>
  </div>
`;

/* Prism-based code blocks (dark like screenshot) */
const codePanel = (language: string, code: string) => `
  <div class="rounded border border-gray-700 bg-gray-800 overflow-hidden">
    <pre class="m-0 p-4 overflow-x-auto scrollbar-thin"><code class="language-${language}">${escapeHtml(
  code
)}</code></pre>
  </div>
`;

const buildTestCaseDetail = (tc: TestCase) => {
  const statusCls = statusChip(tc.status);
  const sevCls = severityChip(tc.severity);
  const blockId = `tc-${tc.id}`;

  return `
  <div class="border border-gray-200 rounded-lg mb-4 overflow-hidden">
    <div class="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" data-toggle="${blockId}">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400 toggle-icon" data-for="${blockId}"></i>
          <div>
            <h3 class="font-semibold text-gray-900">${escapeHtml(tc.name)}</h3>
            <div class="flex items-center space-x-2 mt-1">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusCls}">${String(
    tc.status
  ).toUpperCase()}</span>
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${sevCls}">${String(
    tc.severity
  ).toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-6 text-sm text-gray-500">
          <div class="flex items-center space-x-1"><i data-lucide="clock" class="w-4 h-4"></i><span>${
            tc.duration
          }ms</span></div>
          <div class="flex items-center space-x-1"><i data-lucide="alert-circle" class="w-4 h-4"></i><span>${
            tc.responseSize
          }B</span></div>
        </div>
      </div>
    </div>

    <div id="${blockId}" class="p-4 border-t border-gray-200 bg-white hidden">
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Endpoint</h4>
          ${codePanel("http", `${(tc.method || "").toUpperCase()} ${tc.url}`)}
        </div>
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Request cURL</h4>
          ${codePanel("bash", tc.requestCurl)}
        </div>
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Response</h4>
          ${codePanel("json", prettyJsonMaybe(tc.response))}
        </div>
      </div>
    </div>
  </div>`;
};

const buildUrlGroup = (g: ReturnType<typeof groupByUrlThenMethod>[number]) => {
  const rate = successPct(g.passed, g.total);
  const rateColor =
    rate >= 80
      ? "text-green-600"
      : rate >= 60
      ? "text-yellow-600"
      : "text-red-600";
  const rowId = `url-${hash(g.key)}`;

  const methods = Object.values(g.methods)
    .map(
      (mb) => `
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${methodChip(
          mb.method
        )}">${mb.method}</span>
      </div>
      <div class="space-y-3">
        ${mb.testCases.map((tc) => buildTestCaseDetail(tc)).join("")}
      </div>
    </div>`
    )
    .join("");

  return `
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <div class="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" data-toggle="${rowId}">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4 flex-1">
          <i data-lucide="chevron-up" class="w-5 h-5 text-gray-400 toggle-icon" data-for="${rowId}"></i>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate" title="${escapeHtml(
              g.endpoint
            )}">${escapeHtml(g.endpoint)}</p>
            <p class="text-sm text-gray-500">${g.total} test case${
    g.total === 1 ? "" : "s"
  }</p>
          </div>
        </div>
        <div class="flex items-center space-x-6 text-sm">
          <div class="flex items-center space-x-1 text-green-600"><i data-lucide="check-circle" class="w-4 h-4"></i><span>${
            g.passed
          }</span></div>
          <div class="flex items-center space-x-1 text-red-600"><i data-lucide="x-circle" class="w-4 h-4"></i><span>${
            g.failed
          }</span></div>
          ${
            g.skipped
              ? `<div class="flex items-center space-x-1 text-yellow-600"><i data-lucide="alert-triangle" class="w-4 h-4"></i><span>${g.skipped}</span></div>`
              : ""
          }
          <div class="flex items-center space-x-1 text-gray-500"><i data-lucide="clock" class="w-4 h-4"></i><span>${
            g.avgDuration
          }ms avg</span></div>
          <div class="font-semibold ${rateColor}">${rate}%</div>
        </div>
      </div>
    </div>
    <div id="${rowId}" class="border-t border-gray-200 bg-white hidden"><div class="p-4 space-y-6">${methods}</div></div>
  </div>`;
};

const buildGroupingSection = (tcs: TestCase[]) => {
  const groups = groupByUrlThenMethod(tcs);
  if (!groups.length) {
    return `<div class="bg-white rounded-lg shadow-md p-8 text-center"><i data-lucide="globe" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i><p class="text-gray-500">No API requests found</p></div>`;
  }
  return `
    <div class="space-y-4">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i data-lucide="globe" class="w-6 h-6 mr-2 text-blue-600"></i>
          API Endpoints (${groups.length} endpoints)
        </h2>
        <div class="space-y-4">${groups
          .map((g) => buildUrlGroup(g))
          .join("")}</div>
      </div>
    </div>`;
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return `h${Math.abs(h)}`;
};

const buildHTML = (
  data: TestSuiteData,
  sourceElementId: string,
  opts: { includeButtons?: boolean; codeTheme: "dark" | "light" }
) => {
  // reuse on-screen logo if present
  let logoSrc: string | null = null;
  const host = document.getElementById(sourceElementId) || document.body;
  const logo = host?.querySelector(
    'img[alt="Optraflow logo"]'
  ) as HTMLImageElement | null;
  if (logo?.src) logoSrc = logo.src;

  const tcs = collectTestCases(data);
  const requestMetrics = buildRequestMetricsFromCases(tcs); // <-- NEW
  const prismCss =
    opts.codeTheme === "dark"
      ? "https://unpkg.com/prismjs@1/themes/prism-okaidia.css"
      : "https://unpkg.com/prismjs@1/themes/prism.css";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.name)} – Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Prism (CSS + core + autoloader) -->
  <link rel="stylesheet" href="${prismCss}">
  <script src="https://unpkg.com/prismjs@1/components/prism-core.min.js"></script>
  <script src="https://unpkg.com/prismjs@1/plugins/autoloader/prism-autoloader.min.js"></script>
  <!-- Lucide icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    /* improve code panel spacing and dark surface look (matching your screenshot) */
    .code-surface { background:#1f2937; color:#e5e7eb; border-color:#374151; }
    pre { white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body class="mx-auto p-1 sm:p-1 bg-[#FAFAFA]">
  <header class="border border-gray-200 bg-white rounded-lg px-6 py-4">
    <div class="flex items-center justify-between">
      <div><h2 class="text-2xl font-semibold text-gray-900">Test Suite Report</h2></div>
      ${
        opts.includeButtons
          ? `<div class="flex items-center space-x-4"></div>`
          : ``
      }
    </div>
  </header>

  <div class="max-w-7xl mx-auto">
    ${buildHeader(data, logoSrc)}
    ${buildMetricCards(data, tcs)}
    ${buildRequestMetricsSection(
      requestMetrics
    )} <!-- NEW: RequestMetrics UI -->
    ${buildGroupingSection(tcs)}
  </div>

  <script>
    document.addEventListener('click', function(e){
      var t = e.target;
      while (t && t !== document) {
        var id = t.getAttribute && t.getAttribute('data-toggle');
        if (id) {
          var c = document.getElementById(id);
          if (c) {
            var hidden = c.classList.contains('hidden');
            c.classList.toggle('hidden');
            document.querySelectorAll('.toggle-icon[data-for="'+id+'"]').forEach(function(i){
              i.setAttribute('data-lucide', hidden ? 'chevron-down' : 'chevron-up');
            });
            if (window.lucide) window.lucide.createIcons();
          }
          break;
        }
        t = t.parentNode;
      }
    });

    document.addEventListener('DOMContentLoaded', function(){
      // Initialize icons + Prism highlighting
      if (window.lucide) window.lucide.createIcons();
      if (window.Prism) window.Prism.highlightAll();
    });
  </script>
</body>
</html>`;
};
