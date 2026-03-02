import React, { useState } from "react";
import {
    Play,
    Edit2,
    MoreVertical,
    Copy,
    GitBranch,
    BarChart3,
    Trash2,
    Layers,
} from "lucide-react";

/* =========================
   Types
========================= */

type TestSuiteStatus = "Generated" | "Running" | "Failed" | "Passed" | string;
type TestSuiteEnvironment = "No Environment" | "Staging" | "Production" | string;

type MenuAction = "execute" | "edit" | "duplicate" | "cicd" | "reports" | "delete";

interface TestSuite {
    id: string;
    name: string;
    status: TestSuiteStatus;
    environment: TestSuiteEnvironment;
    createdAt: string; // dd/MM/yyyy
    tags: string[];
}

/* =========================
   Component
========================= */

const TestSuiteList: React.FC = () => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const testSuites: TestSuite[] = [
        {
            id: "ee5b73aa-5586-487b-9513-b8f53b742ac9",
            name: "openapi test",
            status: "Generated",
            environment: "No Environment",
            createdAt: "28/02/2026",
            tags: ["API", "Smoke"],
        },
        {
            id: "eef5a199-6dcc-4f23-9f0d-a1f5b3c8d2e7",
            name: "openapi test",
            status: "Generated",
            environment: "No Environment",
            createdAt: "28/02/2026",
            tags: [],
        },
        {
            id: "aab2c4d5-1234-5678-90ab-cdef12345678",
            name: "payment gateway tests",
            status: "Running",
            environment: "Staging",
            createdAt: "27/02/2026",
            tags: ["Payment", "Critical"],
        },
        {
            id: "bbc3d4e5-2345-6789-01bc-def234567890",
            name: "user authentication flow",
            status: "Failed",
            environment: "Production",
            createdAt: "26/02/2026",
            tags: ["Auth", "Security"],
        },
    ];

    const getStatusColor = (status: TestSuiteStatus): string => {
        const colors: Record<string, string> = {
            Generated: "bg-amber-100 text-amber-800 border-amber-200",
            Running: "bg-blue-100 text-blue-800 border-blue-200",
            Failed: "bg-red-100 text-red-800 border-red-200",
            Passed: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
        return colors[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
    };

    const toggleMenu = (id: string) => {
        setOpenMenuId((prev) => (prev === id ? null : id));
    };

    const handleAction = (action: MenuAction, suite: TestSuite) => {

        console.log(`${action}:`, suite.name);
        setOpenMenuId(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/40">
            <main className="mx-auto py-6">
                {/* Desktop View */}
                <div className="hidden lg:block">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Test Suite
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Environment
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Tags
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {testSuites.map((suite) => (
                                    <tr
                                        key={suite.id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                                                    <Layers className="w-5 h-5 text-white" />
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-900">{suite.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        ID: {suite.id.slice(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                    suite.status
                                                )}`}
                                            >
                                                {suite.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700">{suite.environment}</span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {suite.tags.length > 0 ? (
                                                    suite.tags.map((tag, idx) => (
                                                        <span
                                                            key={`${suite.id}-tag-${idx}`}
                                                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400">No tags</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">{suite.createdAt}</span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction("execute", suite)}
                                                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    title="Execute test suite"
                                                >
                                                    <Play className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAction("edit", suite)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit test suite"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleMenu(suite.id)}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="More options"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openMenuId === suite.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-10"
                                                                onClick={() => setOpenMenuId(null)}
                                                            />

                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAction("duplicate", suite)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                    Duplicate
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAction("cicd", suite)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                                                >
                                                                    <GitBranch className="w-4 h-4" />
                                                                    CI/CD
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAction("reports", suite)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                                                >
                                                                    <BarChart3 className="w-4 h-4" />
                                                                    Reports
                                                                </button>

                                                                <div className="border-t border-slate-100 my-1" />

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAction("delete", suite)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile/Tablet View */}
                <div className="lg:hidden space-y-4">
                    {testSuites.map((suite) => (
                        <div
                            key={suite.id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Card Header */}
                            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 flex-shrink-0">
                                            <Layers className="w-6 h-6 text-white" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 truncate">{suite.name}</h3>

                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                        suite.status
                                                    )}`}
                                                >
                                                    {suite.status}
                                                </span>
                                                <span className="text-xs text-slate-500">•</span>
                                                <span className="text-xs text-slate-600">{suite.environment}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => toggleMenu(suite.id)}
                                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {openMenuId === suite.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setOpenMenuId(null)}
                                                />
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction("duplicate", suite)}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        Duplicate
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction("cicd", suite)}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <GitBranch className="w-4 h-4" />
                                                        CI/CD
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction("reports", suite)}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <BarChart3 className="w-4 h-4" />
                                                        Reports
                                                    </button>
                                                    <div className="border-t border-slate-100 my-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction("delete", suite)}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-3">
                                {/* Tags */}
                                {suite.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {suite.tags.map((tag, idx) => (
                                            <span
                                                key={`${suite.id}-tagm-${idx}`}
                                                className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                        ID: {suite.id.slice(0, 8)}...
                                    </span>
                                    <span>•</span>
                                    <span>{suite.createdAt}</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => handleAction("execute", suite)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-teal-600/30 transition-all duration-200"
                                    >
                                        <Play className="w-4 h-4" />
                                        <span className="text-sm">Execute</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleAction("edit", suite)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        <span className="text-sm">Edit</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {testSuites.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layers className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            No test suites yet
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Get started by creating your first test suite
                        </p>
                        <button
                            type="button"
                            className="px-6 py-3 bg-gradient-to-r from-blue-900 to-teal-700 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-900/30 transition-all duration-200"
                        >
                            + Create Test Suite
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TestSuiteList;