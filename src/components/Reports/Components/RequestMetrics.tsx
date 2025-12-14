// src/components/Reports/Components/RequestMetrics.tsx
import React from 'react';
import {
    Globe,
    Clock,
    Database,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertTriangle,
} from 'lucide-react';

// ✅ Use the shared type (do NOT redeclare a local one)
import type { RequestMetrics as RequestMetricsType } from '@/types/report';

interface RequestMetricsProps {
    metrics: RequestMetricsType;
}

export const RequestMetrics: React.FC<RequestMetricsProps> = ({ metrics }) => {
    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    // console.log("Rendering RequestMetrics with metrics:", metrics);

    const formatDuration = (ms?: number) => `${Number(ms ?? 0).toFixed(0)}ms`;

    const getMethodColor = (method: string) => {
        switch ((method || '').toUpperCase()) {
            case 'GET':
                return 'bg-blue-100 text-blue-800';
            case 'POST':
                return 'bg-green-100 text-green-800';
            case 'PUT':
                return 'bg-yellow-100 text-yellow-800';
            case 'DELETE':
                return 'bg-red-100 text-red-800';
            case 'PATCH':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusCodeColor = (statusCode: string) => {
        const code = parseInt(statusCode, 10);
        if (code >= 200 && code < 300) return 'bg-green-100 text-green-800';
        if (code >= 300 && code < 400) return 'bg-blue-100 text-blue-800';
        if (code >= 400 && code < 500) return 'bg-yellow-100 text-yellow-800';
        if (code >= 500) return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    const totalRequests = Math.max(metrics.totalRequests || 0, 1);
    const totalErrors = Math.max(
        Object.values(metrics.errorTypes || {}).reduce((a, b) => a + b, 0),
        1
    );

    return (
        <div className="space-y-3 mb-3">
            {/* Overview Metrics */}
            <div className="bg-white rounded-lg border border-gray-200  p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Activity className="w-6 h-6 mr-2 text-blue-600" />
                    Request-Level Metrics
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                            <Globe className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests}</p>
                        <p className="text-sm text-gray-500">Total Requests</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                            <Database className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{metrics.uniqueEndpoints}</p>
                        <p className="text-sm text-gray-500">Unique Endpoints</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatDuration(metrics.averageResponseTime)}
                        </p>
                        <p className="text-sm text-gray-500">Avg Response Time</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatBytes(metrics.totalDataTransferred)}
                        </p>
                        <p className="text-sm text-gray-500">Data Transferred</p>
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Time Range */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Range</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <TrendingDown className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-gray-600">Fastest</span>
                            </div>
                            <span className="font-semibold text-green-600">
                                {formatDuration(metrics.minResponseTime)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-gray-600">Average</span>
                            </div>
                            <span className="font-semibold text-blue-600">
                                {formatDuration(metrics.averageResponseTime)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-gray-600">Slowest</span>
                            </div>
                            <span className="font-semibold text-red-600">
                                {formatDuration(metrics.maxResponseTime)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* HTTP Methods Distribution */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP Methods</h3>
                    <div className="space-y-3">
                        {Object.entries(metrics.requestsByMethod || {}).map(([method, count]) => (
                            <div key={method} className="flex items-center justify-between">
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getMethodColor(
                                        method
                                    )}`}
                                >
                                    {method}
                                </span>
                                <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${(count / totalRequests) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 w-8">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Codes and Error Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Code Distribution */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Code Distribution</h3>
                    <div className="space-y-3">
                        {Object.entries(metrics.statusCodeDistribution || {}).map(
                            ([statusCode, count]) => (
                                <div key={statusCode} className="flex items-center justify-between">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusCodeColor(
                                            statusCode
                                        )}`}
                                    >
                                        {statusCode}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${(count / totalRequests) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 w-8">{count}</span>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Error Types */}
                {Object.keys(metrics.errorTypes || {}).length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                            Error Types
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(metrics.errorTypes || {}).map(([errorType, count]) => (
                                <div key={errorType} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 truncate flex-1 mr-2">{errorType}</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-red-600 h-2 rounded-full"
                                                style={{ width: `${(count / totalErrors) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 w-6">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Performance Extremes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
                {/* Slowest Requests */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
                        Slowest Requests
                    </h3>
                    <div className="space-y-3">
                        {metrics.slowestRequests.slice(0, 1).map((request, index) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{request.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {request.method} {request.url}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-red-600">
                                        {formatDuration(request.duration)}
                                    </p>
                                    <p className="text-xs text-gray-500">#{index + 1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fastest Requests */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingDown className="w-5 h-5 mr-2 text-green-600" />
                        Fastest Requests
                    </h3>
                    <div className="space-y-3">
                        {metrics.fastestRequests.slice(0, 1).map((request, index) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{request.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {request.method} {request.url}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-green-600">
                                        {formatDuration(request.duration)}
                                    </p>
                                    <p className="text-xs text-gray-500">#{index + 1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestMetrics;
