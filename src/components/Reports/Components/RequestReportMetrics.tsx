
import React from 'react';
import {
    Globe,
    Clock,
    Database,
    TrendingUp,
    Activity,
} from 'lucide-react';

import type { MethodRow } from '@/types/report';

interface RequestMetricsProps {
    metrics: MethodRow[];
}

export const RequestReportMetrics: React.FC<RequestMetricsProps> = ({ metrics }) => {
    const formatDuration = (ms?: number) => {
        const value = Number(ms ?? 0);
        return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(2)}s`;
    };

    // ---- 🔢 Aggregate from per-method rows ----
    const totalRequests = metrics.reduce((sum, m) => sum + (m.total || 0), 0);
    const totalSuccess = metrics.reduce((sum, m) => sum + (m.success || 0), 0);
    const totalFailed = metrics.reduce((sum, m) => sum + (m.failed || 0), 0);

    const weightedAvgDurationMs =
        totalRequests > 0
            ? Math.round(
                metrics.reduce(
                    (sum, m) => sum + (m.avgDurationMs || 0) * (m.total || 0),
                    0
                ) / totalRequests
            )
            : 0;

    // Simple approach: overall p95 ≈ max of per-method p95s
    const overallP95Ms =
        metrics.length > 0
            ? Math.max(...metrics.map((m) => m.p95DurationMs || 0))
            : 0;

    const successRate =
        totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0;

    const successRateLabel = `${successRate.toFixed(1)}%`;

    const successRateColor =
        successRate >= 80
            ? 'bg-green-100 text-green-700'
            : successRate >= 60
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700';

    if (!metrics || metrics.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-3">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                    <Activity className="w-6 h-6 mr-2 text-blue-600" />
                    Request-Level Metrics
                </h2>
                <p className="text-gray-500 text-sm">No metrics available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 mb-3">
            {/* Overview Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Activity className="w-6 h-6 mr-2 text-blue-600" />
                    Request-Level Metrics
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Total Requests */}
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                            <Globe className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
                        <p className="text-sm text-gray-500">Total Requests</p>
                    </div>

                    {/* Success Rate */}
                    <div className="text-center">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${successRateColor}`}>
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{successRateLabel}</p>
                        <p className="text-sm text-gray-500">
                            Success ({totalSuccess} / {totalRequests})
                        </p>
                    </div>

                    {/* Avg Response Time */}
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatDuration(weightedAvgDurationMs)}
                        </p>
                        <p className="text-sm text-gray-500">Avg Response Time</p>
                    </div>

                    {/* 95th Percentile Latency */}
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                            <Database className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatDuration(overallP95Ms)}
                        </p>
                        <p className="text-sm text-gray-500">p95 Response Time</p>
                    </div>
                </div>
            </div>

            {/* (Optional) You can add a per-method table or chips below if you want */}
            {/* e.g. map over metrics and show per-method stats */}
        </div>
    );
};

export default RequestReportMetrics;
