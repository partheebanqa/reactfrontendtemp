import React, { useMemo, useState } from "react";
import {
    ColumnDef,
    ExpandedState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

/* =========================
   Types
========================= */

type TestStatus = "COMPLETED" | "FAILED" | "RUNNING" | "CANCELLED" | "STOPPED" | string;

type RequestHeaders = Record<string, string | number | boolean | undefined>;
type ResponseHeaders = Record<string, string | number | boolean | undefined>;

export type RateLimitSummary = {
    id: string;
    status: TestStatus;
    startTime: string;
    endTime: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitDetected: boolean;
    rateLimitThreshold: number;
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    p50ResponseTime: number;
    p90ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    avgTtfb: number;
    totalDataTransferred: number;
    requestsPerSecond: number;
    throughput: number;
    totalDuration: number;
};

export type RateLimitRequest = {
    id: string;
    url: string;
    method: string;
    statusCode: number;
    responseTime: number;
    size: number;
    success: boolean;
    requestHeaders: RequestHeaders;
    responseHeaders: ResponseHeaders;
    responseBody: string;
    curlCommand: string;
    dnsTime: number;
    tcpTime: number;
    tlsTime: number;
    ttfbTime: number;
    timestamp: string;
};

type StatusFilter = "all" | "success" | "failure" | string;
type RangeFilter = { min: string; max: string };

type TimelinePoint = {
    index: number;
    responseTime: number;
    ttfb: number;
    timestamp: string;
};

type StatusSlice = {
    name: string;
    value: number;
    color: string;
};

type TimingSlice = {
    name: string;
    value: number;
};

export type RateLimitDashboardProps = {
    summary: RateLimitSummary;
    requests: RateLimitRequest[];
};

/* =========================
   Export helpers
========================= */

function exportToExcel(data: RateLimitRequest[]) {
    const headers = ["No.", "Method", "URL", "Timestamp", "TTFB (ms)", "Response Time (ms)", "Size (bytes)", "Status"];

    const rows = data.map((req, idx) => [
        String(idx + 1),
        req.method,
        req.url,
        new Date(req.timestamp).toLocaleString(),
        String(req.ttfbTime),
        String(req.responseTime),
        String(req.size),
        String(req.statusCode),
    ]);

    const csvContent = [headers, ...rows]
        .map((row) =>
            row
                .map((cell) => {
                    const s = String(cell ?? "");
                    if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                    return s;
                })
                .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rate-limit-test-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToPDF(data: RateLimitRequest[], summary: RateLimitSummary) {
    const content = `
RATE LIMIT TEST REPORT
======================

Test ID: ${summary.id}
Status: ${summary.status}
Duration: ${new Date(summary.startTime).toLocaleString()} - ${new Date(summary.endTime).toLocaleString()}

SUMMARY
-------
Total Requests: ${summary.totalRequests}
Successful: ${summary.successfulRequests}
Rate Limit Detected: ${summary.rateLimitDetected ? "YES" : "NO"}
Threshold: ${summary.rateLimitThreshold}
Avg Response Time: ${summary.avgResponseTime}ms
Requests/Second: ${summary.requestsPerSecond}

DETAILED REQUESTS
-----------------
${data
            .map(
                (req, idx) => `
${idx + 1}. ${req.method} ${req.url}
   Status: ${req.statusCode}
   Response Time: ${req.responseTime}ms
   TTFB: ${req.ttfbTime}ms
   Size: ${req.size} bytes
   Time: ${new Date(req.timestamp).toLocaleString()}
`
            )
            .join("\n")}
  `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rate-limit-test-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

/* =========================
   Small utils
========================= */

function safeParseJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

// IMPORTANT: avoid dynamic tailwind classes like bg-${color}-...
function getStatusBadgeClasses(status: number) {
    if (status === 200) return "bg-green-500/10 text-green-400";
    if (status >= 400 && status < 500) return "bg-yellow-500/10 text-yellow-400";
    return "bg-red-500/10 text-red-400";
}

/* =========================
   Component
========================= */

export default function RateLimitDashboard({ summary, requests }: RateLimitDashboardProps): JSX.Element {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [ttfbFilter, setTtfbFilter] = useState<RangeFilter>({ min: "", max: "" });
    const [responseTimeFilter, setResponseTimeFilter] = useState<RangeFilter>({ min: "", max: "" });
    const [selectedRequest, setSelectedRequest] = useState<RateLimitRequest | null>(null);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [expanded, setExpanded] = useState<ExpandedState>({});

    const filteredData = useMemo<RateLimitRequest[]>(() => {
        return requests.filter((req) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "success" && req.success) ||
                (statusFilter === "failure" && !req.success) ||
                statusFilter === String(req.statusCode);

            const q = searchQuery.trim().toLowerCase();
            const matchesSearch = q === "" || req.url.toLowerCase().includes(q) || req.method.toLowerCase().includes(q);

            const tMin = ttfbFilter.min ? Number(ttfbFilter.min) : null;
            const tMax = ttfbFilter.max ? Number(ttfbFilter.max) : null;
            const matchesTtfb = (tMin === null || req.ttfbTime >= tMin) && (tMax === null || req.ttfbTime <= tMax);

            const rMin = responseTimeFilter.min ? Number(responseTimeFilter.min) : null;
            const rMax = responseTimeFilter.max ? Number(responseTimeFilter.max) : null;
            const matchesResponse = (rMin === null || req.responseTime >= rMin) && (rMax === null || req.responseTime <= rMax);

            return matchesStatus && matchesSearch && matchesTtfb && matchesResponse;
        });
    }, [requests, statusFilter, searchQuery, ttfbFilter, responseTimeFilter]);

    const timelineData = useMemo<TimelinePoint[]>(
        () =>
            requests.map((req, idx) => ({
                index: idx + 1,
                responseTime: req.responseTime,
                ttfb: req.ttfbTime,
                timestamp: new Date(req.timestamp).toLocaleTimeString(),
            })),
        [requests]
    );

    const statusDistribution = useMemo<StatusSlice[]>(() => {
        const slices: StatusSlice[] = [
            { name: "200 OK", value: requests.filter((r) => r.statusCode === 200).length, color: "#10b981" },
            { name: "4xx Errors", value: requests.filter((r) => r.statusCode >= 400 && r.statusCode < 500).length, color: "#f59e0b" },
            { name: "5xx Errors", value: requests.filter((r) => r.statusCode >= 500).length, color: "#ef4444" },
        ];
        return slices.filter((s) => s.value > 0);
    }, [requests]);

    const timingBreakdown = useMemo<TimingSlice[]>(() => {
        const avg = (get: (r: RateLimitRequest) => number) => requests.reduce((acc, r) => acc + get(r), 0) / (requests.length || 1);

        const avgDns = avg((r) => r.dnsTime);
        const avgTcp = avg((r) => r.tcpTime);
        const avgTls = avg((r) => r.tlsTime);
        const avgTtfb = avg((r) => r.ttfbTime);
        const avgResp = avg((r) => r.responseTime);

        return [
            { name: "DNS", value: avgDns },
            { name: "TCP", value: avgTcp },
            { name: "TLS", value: avgTls },
            { name: "TTFB", value: avgTtfb },
            { name: "Transfer", value: Math.max(0, avgResp - avgTtfb) },
        ];
    }, [requests]);

    const columns = useMemo<ColumnDef<RateLimitRequest>[]>(() => {
        return [
            { id: "index", header: "No.", cell: ({ row }) => <span className="font-mono text-xs">{row.index + 1}</span>, size: 50 },
            {
                accessorKey: "method",
                header: "Method",
                cell: ({ getValue }) => (
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded font-mono text-xs font-bold">
                        {String(getValue())}
                    </span>
                ),
                size: 80,
            },
            {
                accessorKey: "url",
                header: "URL",
                cell: ({ getValue }) => {
                    const v = String(getValue() ?? "");
                    return (
                        <span className="text-xs font-mono truncate block max-w-[200px] md:max-w-[400px]" title={v}>
                            {v.length > 25 ? v.substring(0, 25) + "..." : v}
                        </span>
                    );
                },
            },
            {
                accessorKey: "timestamp",
                header: "Timestamp",
                cell: ({ getValue }) => <span className="text-xs font-mono">{new Date(String(getValue())).toLocaleTimeString()}</span>,
                size: 100,
            },
            {
                accessorKey: "ttfbTime",
                header: "TTFB",
                cell: ({ getValue }) => {
                    const n = Number(getValue());
                    const cls = n > 300 ? "text-red-400" : n > 200 ? "text-yellow-400" : "text-green-400";
                    return <span className={`text-xs font-mono ${cls}`}>{n}ms</span>;
                },
                size: 80,
            },
            {
                accessorKey: "responseTime",
                header: "Response",
                cell: ({ getValue }) => {
                    const n = Number(getValue());
                    const cls = n > 300 ? "text-red-400" : n > 200 ? "text-yellow-400" : "text-green-400";
                    return <span className={`text-xs font-mono ${cls}`}>{n}ms</span>;
                },
                size: 80,
            },
            {
                accessorKey: "size",
                header: "Size",
                cell: ({ getValue }) => {
                    const n = Number(getValue());
                    return <span className="text-xs font-mono">{(n / 1024).toFixed(2)}KB</span>;
                },
                size: 80,
            },
            {
                accessorKey: "statusCode",
                header: "Status",
                cell: ({ getValue }) => {
                    const status = Number(getValue());
                    return (
                        <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${getStatusBadgeClasses(status)}`}>
                            {status}
                        </span>
                    );
                },
                size: 80,
            },
        ];
    }, []);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { sorting, expanded },
        onSortingChange: setSorting,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

    // ✅ keep your existing UI JSX exactly as-is below
    // Only change: remove const testData usage and use props summary/requests (already done)

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 rounded-lg overflow-hidden">
            <style>{`
        body{font-family:'Outfit',}
        .font-mono{font-family:'JetBrains Mono',monospace}
        .card{background:linear-gradient(135deg,rgba(20,20,20,.95),rgba(30,30,30,.9));border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:1.5rem;backdrop-filter:blur(10px);box-shadow:0 8px 32px rgba(0,0,0,.4);transition:all .3s ease}
        .card:hover{border-color:rgba(6,182,212,.3);box-shadow:0 12px 48px rgba(6,182,212,.1)}
        .kpi-card{background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%);border:1px solid rgba(6,182,212,.2);border-radius:8px;padding:1.25rem;position:relative;overflow:hidden}
        .kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(6,182,212,.5),transparent)}
        .kpi-card:hover{border-color:rgba(6,182,212,.4);transform:translateY(-2px)}
        .status-badge{display:inline-block;padding:.25rem .75rem;border-radius:4px;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        .status-completed{background:rgba(16,185,129,.1);color:#10b981;border:1px solid rgba(16,185,129,.3)}
        .status-warning{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.3)}
        input[type="text"],input[type="number"],select{background:rgba(20,20,20,.8);border:1px solid rgba(255,255,255,.1);color:#f5f5f5;padding:.5rem .75rem;border-radius:6px;font-size:.875rem;transition:all .2s}
        input:focus,select:focus{outline:none;border-color:rgba(6,182,212,.5);box-shadow:0 0 0 3px rgba(6,182,212,.1)}
        table{width:100%;border-collapse:collapse}
        th{background:rgba(6,182,212,.05);border-bottom:2px solid rgba(6,182,212,.3);padding:.75rem;text-align:left;font-weight:700;font-size:.75rem;text-transform:uppercase;letter-spacing:1px;color:#06b6d4}
        td{padding:.75rem;border-bottom:1px solid rgba(255,255,255,.05)}
        tr:hover{background:rgba(6,182,212,.03)}
        .chart-container{background:rgba(20,20,20,.5);border-radius:8px;padding:1rem}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .animate-fadeInUp{animation:fadeInUp .5s ease-out}
        .grid-pattern{background-image:linear-gradient(rgba(6,182,212,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,.05) 1px,transparent 1px);background-size:40px 40px}
        @media(max-width:768px){.card{padding:1rem}.kpi-card{padding:1rem}th,td{padding:.5rem;font-size:.75rem}}
        .scrollbar-thin::-webkit-scrollbar{width:6px;height:6px}
        .scrollbar-thin::-webkit-scrollbar-track{background:rgba(20,20,20,.5)}
        .scrollbar-thin::-webkit-scrollbar-thumb{background:rgba(6,182,212,.3);border-radius:3px}
        .scrollbar-thin::-webkit-scrollbar-thumb:hover{background:rgba(6,182,212,.5)}
      `}</style>

            {/* Header */}
            <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-cyan-900/20">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                Rate Limit Performance Test
                            </h1>
                            <p className="text-sm text-gray-400 font-mono">Test ID: {summary.id}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span
                                className={`status-badge ${summary.status === "COMPLETED" ? "status-completed" : "status-warning"
                                    }`}
                            >
                                {summary.status}
                            </span>
                            {summary.rateLimitDetected && <span className="status-badge status-warning">Rate Limit Hit</span>}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-gray-400">
                        <span>Start: {new Date(summary.startTime).toLocaleString()}</span>
                        <span>•</span>
                        <span>End: {new Date(summary.endTime).toLocaleString()}</span>
                        <span>•</span>
                        <span>
                            Duration:{" "}
                            {((new Date(summary.endTime).getTime() - new Date(summary.startTime).getTime()) / 1000).toFixed(2)}s
                        </span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 grid-pattern">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-fadeInUp">
                    <div className="kpi-card">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Total Requests</div>
                        <div className="text-3xl font-bold text-cyan-400">{summary.totalRequests}</div>
                        <div className="text-xs text-gray-500 mt-1">{summary.requestsPerSecond.toFixed(2)}/sec</div>
                    </div>

                    <div className="kpi-card">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Success Rate</div>
                        <div className="text-3xl font-bold text-green-400">
                            {((summary.successfulRequests / summary.totalRequests) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {summary.successfulRequests}/{summary.totalRequests}
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Failed Requests</div>
                        <div className={`text-3xl font-bold ${summary.failedRequests > 0 ? "text-red-400" : "text-gray-400"}`}>
                            {summary.failedRequests}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {summary.failedRequests > 0
                                ? `${((summary.failedRequests / summary.totalRequests) * 100).toFixed(1)}%`
                                : "None"}
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Avg Response</div>
                        <div className="text-3xl font-bold text-blue-400">{summary.avgResponseTime.toFixed(0)}ms</div>
                        <div className="text-xs text-gray-500 mt-1">TTFB: {summary.avgTtfb}ms</div>
                    </div>

                    <div className="kpi-card">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Data Transfer</div>
                        <div className="text-3xl font-bold text-purple-400">{(summary.totalDataTransferred / 1024).toFixed(1)}KB</div>
                        <div className="text-xs text-gray-500 mt-1">Total transferred</div>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Timeline Chart */}
                    <div className="lg:col-span-2 card animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
                        <h3 className="text-lg font-bold mb-4 text-cyan-400">Response Time Timeline</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={timelineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="index"
                                        stroke="#6b7280"
                                        style={{ fontSize: "11px" }}
                                        label={{ value: "Request #", position: "insideBottom", offset: -5, fill: "#9ca3af" }}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        style={{ fontSize: "11px" }}
                                        label={{ value: "Time (ms)", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(20, 20, 20, 0.95)",
                                            border: "1px solid rgba(6, 182, 212, 0.3)",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                                    <ReferenceLine
                                        y={summary.avgResponseTime}
                                        stroke="#f59e0b"
                                        strokeDasharray="3 3"
                                        label={{ value: "Avg", fill: "#f59e0b", fontSize: 10 }}
                                    />
                                    <Line type="monotone" dataKey="responseTime" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="Response Time" />
                                    <Line type="monotone" dataKey="ttfb" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="TTFB" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="card animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
                        <h3 className="text-lg font-bold mb-4 text-cyan-400">Status Distribution</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(20, 20, 20, 0.95)",
                                            border: "1px solid rgba(6, 182, 212, 0.3)",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Timing Breakdown */}
                    <div className="card animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
                        <h3 className="text-lg font-bold mb-4 text-cyan-400">Timing Breakdown (Avg)</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={timingBreakdown} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: "11px" }} />
                                    <YAxis dataKey="name" type="category" stroke="#6b7280" style={{ fontSize: "11px" }} width={80} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(20, 20, 20, 0.95)",
                                            border: "1px solid rgba(6, 182, 212, 0.3)",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Response Time Analysis */}
                    <div className="card animate-fadeInUp" style={{ animationDelay: "0.4s" }}>
                        <h3 className="text-lg font-bold mb-4 text-cyan-400">Response Time Analysis</h3>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                                <div className="text-xs text-gray-400 mb-1">Min Response</div>
                                <div className="text-xl font-bold text-green-400">{summary.minResponseTime}ms</div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                                <div className="text-xs text-gray-400 mb-1">Max Response</div>
                                <div className="text-xl font-bold text-red-400">{summary.maxResponseTime}ms</div>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                                <div className="text-xs text-gray-400 mb-1">P50 (Median)</div>
                                <div className="text-xl font-bold text-blue-400">{summary.p50ResponseTime}ms</div>
                            </div>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                                <div className="text-xs text-gray-400 mb-1">P90</div>
                                <div className="text-xl font-bold text-yellow-400">{summary.p90ResponseTime}ms</div>
                            </div>
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
                                <div className="text-xs text-gray-400 mb-1">P95</div>
                                <div className="text-xl font-bold text-orange-400">{summary.p95ResponseTime}ms</div>
                            </div>
                            <div className="bg-pink-500/10 border border-pink-500/30 rounded p-2">
                                <div className="text-xs text-gray-400 mb-1">P99</div>
                                <div className="text-xl font-bold text-pink-400">{summary.p99ResponseTime}ms</div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 mb-2 font-bold">Distribution</div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={140}>
                                <BarChart
                                    data={[
                                        { range: "<200ms", count: requests.filter((r) => r.responseTime < 200).length },
                                        { range: "200-250ms", count: requests.filter((r) => r.responseTime >= 200 && r.responseTime < 250).length },
                                        { range: "250-300ms", count: requests.filter((r) => r.responseTime >= 250 && r.responseTime < 300).length },
                                        { range: ">300ms", count: requests.filter((r) => r.responseTime >= 300).length },
                                    ]}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="range" stroke="#6b7280" style={{ fontSize: "11px" }} />
                                    <YAxis stroke="#6b7280" style={{ fontSize: "11px" }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(20, 20, 20, 0.95)",
                                            border: "1px solid rgba(6, 182, 212, 0.3)",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card animate-fadeInUp" style={{ animationDelay: "0.5s" }}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <h3 className="text-lg font-bold text-cyan-400">Request Details</h3>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => exportToExcel(filteredData)} className="text-xs">
                                Export Excel
                            </button>
                            <button onClick={() => exportToPDF(filteredData, summary)} className="text-xs">
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="URL or method..."
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                                className="w-full"
                            >
                                <option value="all">All</option>
                                <option value="success">Success</option>
                                <option value="failure">Failure</option>
                                <option value="200">200</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">TTFB Range (ms)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={ttfbFilter.min}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setTtfbFilter((p) => ({ ...p, min: e.target.value }))
                                    }
                                    className="w-full"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={ttfbFilter.max}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setTtfbFilter((p) => ({ ...p, max: e.target.value }))
                                    }
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">Response Time (ms)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={responseTimeFilter.min}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setResponseTimeFilter((p) => ({ ...p, min: e.target.value }))
                                    }
                                    className="w-full"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={responseTimeFilter.max}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setResponseTimeFilter((p) => ({ ...p, max: e.target.value }))
                                    }
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin">
                        <table>
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                className="cursor-pointer select-none"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {{
                                                        asc: " ↑",
                                                        desc: " ↓",
                                                    }[header.column.getIsSorted() as "asc" | "desc"] ?? null}
                                                </div>
                                            </th>
                                        ))}
                                        <th>Actions</th>
                                    </tr>
                                ))}
                            </thead>

                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                        ))}
                                        <td>
                                            <button onClick={() => setSelectedRequest(row.original)} className="text-xs px-2 py-1">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 text-xs text-gray-400">
                        Showing {filteredData.length} of {requests.length} requests
                    </div>
                </div>
            </div>

            {/* Radix Dialog */}
            <Dialog.Root open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30 rounded-lg p-6 w-[90vw] max-w-3xl max-h-[80vh] overflow-y-auto scrollbar-thin">
                        <Dialog.Title className="text-2xl font-bold mb-4 text-cyan-400">Request Details</Dialog.Title>

                        {selectedRequest && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">Method</div>
                                        <div className="font-mono text-cyan-400">{selectedRequest.method}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">Status</div>
                                        <div className="font-mono text-green-400">{selectedRequest.statusCode}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">Response Time</div>
                                        <div className="font-mono text-blue-400">{selectedRequest.responseTime}ms</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">TTFB</div>
                                        <div className="font-mono text-purple-400">{selectedRequest.ttfbTime}ms</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-1">URL</div>
                                    <div className="font-mono text-sm bg-gray-800/50 p-2 rounded break-all">{selectedRequest.url}</div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-2">cURL Command</div>
                                    <div className="bg-gray-800/50 p-3 rounded">
                                        <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">
                                            {selectedRequest.curlCommand}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-2">Response Body</div>
                                    <div className="bg-gray-800/50 p-3 rounded max-h-48 overflow-y-auto scrollbar-thin">
                                        <pre className="text-xs font-mono text-gray-300">
                                            {JSON.stringify(safeParseJson(selectedRequest.responseBody), null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Dialog.Close asChild>
                            <Button className="mt-6 w-full">Close</Button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
