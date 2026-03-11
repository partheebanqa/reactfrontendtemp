import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { createIntegrationJiraIssue, getWorkSpaceIntegrations } from '@/services/integrationTools.service';
import { WorkSpaceIntegration } from '../settings/ExternalTools';
import { useWorkspace } from '@/hooks/useWorkspace';

// Types
interface TestSuiteData {
    id: string;
    name: string;
    description: string;
    workspaceId: string;
    environment: string;
    lastExecutionDate: string;
    duration: number;
    executedBy: string;
}

interface JiraResponse {
    message: string;
    issueKey: string;
    issueUrl: string;
}

interface JiraModalProps {
    openJiraModal: boolean;
    setOpenJiraModal: () => void;
    testSuiteData: TestSuiteData;
}

const JiraIntegrationModal: React.FC<JiraModalProps> = ({
    openJiraModal,
    setOpenJiraModal,
    testSuiteData,
}) => {
    const [summary, setSummary] = useState('');
    const [userDescription, setUserDescription] = useState('');
    const [issueType, setIssueType] = useState('Bug');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jiraResponse, setJiraResponse] = useState<JiraResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';


    useEffect(() => {
        if (openJiraModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [openJiraModal]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && openJiraModal && !isSubmitting) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [openJiraModal, isSubmitting]);

    // Format execution date
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
                timeZoneName: 'short'
            });
        } catch (err) {
            return 'Invalid Date';
        }
    };

    // Generate auto-populated description
    const generateDescription = () => {
        const { name, description, lastExecutionDate, environment } = testSuiteData;

        return `Name: ${name}, ${description}
Executed date: ${formatDate(lastExecutionDate)}, Environment: ${environment || 'N/A'}
Execution url: ${currentUrl}

${userDescription.trim()}

To access the report:
Click the above mentioned report link
If you have access by providing the valid credentials you will be able to access the report.`;
    };

    const [loading, setLoading] = useState<boolean>(false);
    const [integrations, setIntegrations] = useState<WorkSpaceIntegration[]>([]);
    const { currentWorkspace } = useWorkspace();
    const workspaceId = currentWorkspace?.id;

    const getIntegrations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getWorkSpaceIntegrations(workspaceId || '');
            const data: WorkSpaceIntegration[] = await response;
            setIntegrations(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch integrations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workspaceId) {
            getIntegrations();
        }
    }, [workspaceId]);


    const jiraIntegration = integrations?.find(
        (integration) => integration.type === "jira"
    );
    const integrationId = jiraIntegration?.id

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!summary.trim()) {
            setError("Summary is required");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                summary: summary.trim(),
                description: userDescription,
                issueType,
            };

            const data = await createIntegrationJiraIssue(
                integrationId || "",
                payload,
                workspaceId || ""
            );

            if (!data?.issueKey || !data?.issueUrl) {
                throw new Error("Invalid response from server");
            }

            setJiraResponse(data);

        } catch (err) {
            console.error("Jira API Error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create Jira issue. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Copy URL to clipboard with fallback
    const handleCopyUrl = async () => {
        if (!jiraResponse?.issueUrl) return;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(jiraResponse.issueUrl);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = jiraResponse.issueUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setError('Failed to copy URL. Please copy manually.');
        }
    };

    // Reset modal state
    const handleClose = () => {
        if (isSubmitting) return; // Prevent closing while submitting

        setSummary('');
        setUserDescription('');
        setIssueType('Bug');
        setJiraResponse(null);
        setError(null);
        setCopied(false);
        setOpenJiraModal();
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            handleClose();
        }
    };

    if (!openJiraModal) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
                style={{ maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                                {jiraResponse ? 'Issue Created Successfully' : 'Create Jira Issue'}
                            </h2>
                            <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                                {jiraResponse ? 'Your bug report has been submitted' : 'Report a bug from test suite execution'}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            aria-label="Close modal"
                            type="button"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                    {!jiraResponse ? (
                        // Form View
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Test Suite Info Preview */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 sm:p-5 border border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-indigo-600 flex-shrink-0" />
                                    <span>Test Suite Information (Auto-populated)</span>
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <span className="font-medium text-slate-600 sm:min-w-[140px]">Suite Name:</span>
                                        <span className="text-slate-800 break-words">{testSuiteData?.name}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <span className="font-medium text-slate-600 sm:min-w-[140px]">Executed Date:</span>
                                        <span className="text-slate-800 break-words">{formatDate(testSuiteData?.lastExecutionDate)}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <span className="font-medium text-slate-600 sm:min-w-[140px]">Environment:</span>
                                        <span className="text-slate-800 break-words">{testSuiteData?.environment || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <span className="font-medium text-slate-600 sm:min-w-[140px]">Executed By:</span>
                                        <span className="text-slate-800 break-words">{testSuiteData?.executedBy}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Field */}
                            <div className="space-y-2">
                                <label htmlFor="summary" className="block text-sm font-semibold text-slate-700">
                                    Summary <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="summary"
                                    type="text"
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Brief description of the bug"
                                    required
                                    maxLength={200}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    aria-required="true"
                                />
                                <p className="text-xs text-slate-500">{summary.length}/200 characters</p>
                            </div>

                            {/* User Description Field */}
                            <div className="space-y-2">
                                <label htmlFor="userDescription" className="block text-sm font-semibold text-slate-700">
                                    Additional Description
                                </label>
                                <textarea
                                    id="userDescription"
                                    value={userDescription}
                                    onChange={(e) => setUserDescription(e.target.value)}
                                    placeholder="Add any additional details about the bug (steps to reproduce, expected vs actual behavior, etc.)"
                                    rows={3}
                                    maxLength={2000}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 placeholder:text-slate-400 resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500">{userDescription.length}/2000 characters</p>
                            </div>

                            {/* Issue Type Selector */}
                            <div className="space-y-2">
                                <label htmlFor="issueType" className="block text-sm font-semibold text-slate-700">
                                    Issue Type
                                </label>
                                <select
                                    id="issueType"
                                    value={issueType}
                                    onChange={(e) => setIssueType(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                                >
                                    <option value="Bug">Bug</option>
                                    <option value="Task">Task</option>
                                    <option value="Story">Story</option>
                                    <option value="Epic">Epic</option>
                                </select>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3" role="alert">
                                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-red-800">Error creating issue</p>
                                        <p className="text-sm text-red-600 mt-1 break-words">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !summary.trim()}
                                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : (
                                        'Create Issue'
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        // Success View
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Success Icon & Message */}
                            <div className="text-center py-6 sm:py-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-4 animate-scaleIn">
                                    <CheckCircle2 size={40} className="text-white" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                                    {jiraResponse.message}
                                </h3>
                                <p className="text-slate-600 text-sm sm:text-base px-4">
                                    Your bug report has been successfully submitted to Jira
                                </p>
                            </div>

                            {/* Issue Details Card */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-100">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 block mb-2">Issue Key</label>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 break-all">
                                                {jiraResponse.issueKey}
                                            </span>
                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                                Created
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-600 block mb-2">Issue URL</label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <a
                                                href={jiraResponse.issueUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 px-4 py-3 bg-white rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-between group overflow-hidden min-w-0"
                                            >
                                                <span className="text-sm font-medium truncate mr-2">
                                                    {jiraResponse.issueUrl}
                                                </span>
                                                <ExternalLink size={18} className="flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
                                            </a>
                                            <button
                                                onClick={handleCopyUrl}
                                                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-500/30 sm:min-w-[120px]"
                                                type="button"
                                            >
                                                {copied ? (
                                                    <>
                                                        <CheckCircle2 size={18} />
                                                        <span>Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={18} />
                                                        <span>Copy URL</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Message */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="text-sm text-blue-800 min-w-0">
                                        <p className="font-medium mb-1">Share with your team</p>
                                        <p className="text-blue-700">
                                            Copy the issue URL and share it with your team members. They can access the full report using their Jira credentials.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleClose}
                                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/30"
                                    type="button"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default JiraIntegrationModal;


