import React, { useState } from 'react';

// Icon components (inline SVG)
const X = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Plus = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const Tag = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
);

const ChevronDown = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const Check = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const Search = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const Play = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Edit = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const MoreVertical = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
);

const RefreshCw = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

// ==================== TAG NORMALIZATION SYSTEM ====================

// Tag normalization utilities
const TAG_REGISTRY = {
    'sanity': 'Sanity',
    'regression': 'Regression',
    'smoke': 'Smoke',
    'uat': 'UAT',
    'integration': 'Integration',
    'e2e': 'E2E',
    'functional': 'Functional',
    'performance': 'Performance',
    'security': 'Security',
    'api': 'API',
    'ui': 'UI',
    'unit': 'Unit',
};

// Normalize tag to canonical form
const normalizeTag = (tag) => {
    const lower = tag.toLowerCase().trim();
    // Check if we have a predefined canonical form
    if (TAG_REGISTRY[lower]) {
        return TAG_REGISTRY[lower];
    }
    // Otherwise, use Title Case
    return tag
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// Check if tag already exists (case-insensitive)
const tagExists = (tags, newTag) => {
    const normalizedNew = newTag.toLowerCase().trim();
    return tags.some(tag => tag.toLowerCase() === normalizedNew);
};

// Get all unique tags from test suites (normalized)
const getAllUniqueTags = (testSuites) => {
    const tagMap = new Map();

    testSuites.forEach(suite => {
        (suite.tags || []).forEach(tag => {
            const normalized = normalizeTag(tag);
            const key = normalized.toLowerCase();

            // Store the normalized version, preferring predefined tags
            if (!tagMap.has(key)) {
                tagMap.set(key, normalized);
            }
        });
    });

    return Array.from(tagMap.values()).sort();
};

// ==================== TAG INPUT COMPONENT ====================

const TagInput = ({ tags, setTags }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    const predefinedTags = ['Sanity', 'Regression', 'Smoke', 'UAT', 'Integration', 'E2E'];
    const availableTags = predefinedTags.filter(tag =>
        !tagExists(tags, tag)
    );

    const handleAddTag = (tagName) => {
        const trimmedTag = tagName.trim();

        if (!trimmedTag) {
            setError('Tag cannot be empty');
            return;
        }

        // Check for duplicate (case-insensitive)
        if (tagExists(tags, trimmedTag)) {
            const existingTag = tags.find(t => t.toLowerCase() === trimmedTag.toLowerCase());
            setError(`Tag already exists as "${existingTag}"`);
            return;
        }

        // Normalize the tag before adding
        const normalizedTag = normalizeTag(trimmedTag);
        setTags([...tags, normalizedTag]);
        setInputValue('');
        setError('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(inputValue);
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const getTagColor = (tag) => {
        const colors = {
            'sanity': 'bg-blue-100 text-blue-700 border-blue-200',
            'regression': 'bg-purple-100 text-purple-700 border-purple-200',
            'smoke': 'bg-orange-100 text-orange-700 border-orange-200',
            'uat': 'bg-green-100 text-green-700 border-green-200',
            'integration': 'bg-pink-100 text-pink-700 border-pink-200',
            'e2e': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        };
        return colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Tags (optional)
            </label>

            <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <div className="flex flex-wrap gap-2 items-center">
                    {tags.length === 0 && inputValue === '' && (
                        <span className="text-gray-400 text-sm">Add tags to categorize your test suite...</span>
                    )}

                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getTagColor(tag)} transition-all`}
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                                aria-label={`Remove ${tag} tag`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}

                    <div className="flex-1 min-w-[120px] flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={tags.length > 0 ? "Add another..." : ""}
                            className="flex-1 outline-none text-sm bg-transparent"
                        />

                        {availableTags.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    aria-label="Quick add tags"
                                >
                                    <Plus className="w-4 h-4 text-gray-500" />
                                </button>

                                {showQuickAdd && (
                                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48 z-50">
                                        <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                                            Quick Add
                                        </div>
                                        {availableTags.map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => {
                                                    handleAddTag(tag);
                                                    setShowQuickAdd(false);
                                                }}
                                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                            >
                                                <Tag className="w-3 h-3 text-gray-400" />
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}

            <div className="text-xs text-gray-500 space-y-1">
                <p>Press Enter to add a tag, or use the + button for quick suggestions</p>
                <p className="text-blue-600">
                    💡 Tip: Tags are automatically normalized (e.g., "smoke", "SMOKE", "Smoke" all become "Smoke")
                </p>
            </div>
        </div>
    );
};

// ==================== TAG FILTER COMPONENT ====================

const TagFilter = ({ selectedTags, onTagsChange, allTags }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getTagColor = (tag) => {
        const colors = {
            'sanity': 'border-blue-200 hover:bg-blue-50',
            'regression': 'border-purple-200 hover:bg-purple-50',
            'smoke': 'border-orange-200 hover:bg-orange-50',
            'uat': 'border-green-200 hover:bg-green-50',
            'integration': 'border-pink-200 hover:bg-pink-50',
            'e2e': 'border-indigo-200 hover:bg-indigo-50',
            'functional': 'border-blue-200 hover:bg-blue-50',
            'performance': 'border-purple-200 hover:bg-purple-50',
            'security': 'border-orange-200 hover:bg-orange-50',
        };
        return colors[tag.toLowerCase()] || 'border-gray-200 hover:bg-gray-50';
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
            >
                <Tag className="w-4 h-4" />
                Tags
                {selectedTags.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                        {selectedTags.length}
                    </span>
                )}
                <ChevronDown className="w-4 h-4" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 z-50">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Filter by Tags</span>
                                {selectedTags.length > 0 && (
                                    <button
                                        onClick={() => onTagsChange([])}
                                        className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {allTags.length === 0 && (
                                <p className="text-sm text-gray-500 py-2">No tags available</p>
                            )}

                            {allTags.map((tag) => {
                                const isSelected = selectedTags.includes(tag);

                                return (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            if (isSelected) {
                                                onTagsChange(selectedTags.filter(t => t !== tag));
                                            } else {
                                                onTagsChange([...selectedTags, tag]);
                                            }
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md border transition-colors ${getTagColor(tag)} ${isSelected ? 'bg-blue-50 border-blue-300' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-sm">{tag}</span>
                                        </div>
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-blue-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ==================== TEST SUITE CREATION FORM ====================

const TestSuiteCreationForm = ({ onSuccess }) => {
    const [testSuiteName, setTestSuiteName] = useState('');
    const [description, setDescription] = useState('');
    const [environment, setEnvironment] = useState('');
    const [tags, setTags] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const testSuite = {
            id: Math.random().toString(36).substr(2, 9),
            name: testSuiteName,
            description,
            environment: environment || 'No Environment',
            tags: tags.map(tag => normalizeTag(tag)), // Normalize tags before saving
            status: 'Generated',
            created: new Date().toLocaleDateString()
        };

        // Simulate save
        const existing = JSON.parse(localStorage.getItem('testSuites') || '[]');
        existing.push(testSuite);
        localStorage.setItem('testSuites', JSON.stringify(existing));

        // Reset form
        setTestSuiteName('');
        setDescription('');
        setEnvironment('');
        setTags([]);

        if (onSuccess) onSuccess();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Suite Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={testSuiteName}
                        onChange={(e) => setTestSuiteName(e.target.value)}
                        placeholder="Enter test suite name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter test suite description"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                </div>

                <TagInput tags={tags} setTags={setTags} />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Environment
                    </label>
                    <select
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">No Environment -</option>
                        <option value="Development">Development</option>
                        <option value="Staging">Staging</option>
                        <option value="Production">Production</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Select the target environment for these tests
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            setTestSuiteName('');
                            setDescription('');
                            setEnvironment('');
                            setTags([]);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Create Test Suite
                    </button>
                </div>
            </form>
        </div>
    );
};

// ==================== TEST SUITE LIST VIEW ====================

const TestSuiteListView = ({ onCreateClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEnvironment, setSelectedEnvironment] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [selectedTags, setSelectedTags] = useState([]);
    const [testSuites, setTestSuites] = useState([]);

    // Load test suites from localStorage
    React.useEffect(() => {
        const loadTestSuites = () => {
            const stored = JSON.parse(localStorage.getItem('testSuites') || '[]');

            // Add sample data if empty
            if (stored.length === 0) {
                const sample = [
                    {
                        id: 'd47dcecc-a48d',
                        name: 'Versiontestcase',
                        description: 'Version test case for API endpoints',
                        environment: 'No Environment',
                        status: 'Generated',
                        tags: ['Functional', 'Performance', 'Security'],
                        created: '05/01/2026'
                    },
                    {
                        id: 'abc123def456',
                        name: 'User Authentication Tests',
                        description: 'Complete test suite for user authentication flows',
                        environment: 'Staging',
                        status: 'Completed',
                        tags: ['Sanity', 'Regression', 'Security'],
                        created: '05/15/2026'
                    },
                    {
                        id: 'xyz789ghi012',
                        name: 'Payment Gateway Integration',
                        description: 'Tests for payment processing and webhooks',
                        environment: 'Production',
                        status: 'Running',
                        tags: ['Integration', 'Smoke'],
                        created: '06/01/2026'
                    },
                    {
                        id: 'test123mixed',
                        name: 'Mixed Case Tag Demo',
                        description: 'Demonstrates tag normalization (smoke, SMOKE, Smoke all become "Smoke")',
                        environment: 'Development',
                        status: 'Generated',
                        tags: ['smoke', 'REGRESSION', 'Api'],
                        created: '06/05/2026'
                    }
                ];
                // Normalize all tags in sample data
                sample.forEach(suite => {
                    suite.tags = suite.tags.map(tag => normalizeTag(tag));
                });
                localStorage.setItem('testSuites', JSON.stringify(sample));
                setTestSuites(sample);
            } else {
                // Normalize tags when loading from storage
                const normalizedSuites = stored.map(suite => ({
                    ...suite,
                    tags: (suite.tags || []).map(tag => normalizeTag(tag))
                }));
                setTestSuites(normalizedSuites);
            }
        };

        loadTestSuites();
    }, []);

    // Get all unique tags (normalized and deduplicated)
    const allTags = getAllUniqueTags(testSuites);

    // Filter test suites
    const filteredSuites = testSuites.filter(suite => {
        // Search filter
        if (searchQuery && !suite.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Environment filter
        if (selectedEnvironment !== 'all' && suite.environment !== selectedEnvironment) {
            return false;
        }

        // Status filter
        if (selectedStatus !== 'all' && suite.status !== selectedStatus) {
            return false;
        }

        // Tag filter (case-insensitive comparison)
        if (selectedTags.length > 0) {
            const hasTag = selectedTags.some(selectedTag =>
                (suite.tags || []).some(suiteTag =>
                    suiteTag.toLowerCase() === selectedTag.toLowerCase()
                )
            );
            if (!hasTag) return false;
        }

        return true;
    });

    const getTagColor = (tag) => {
        const colors = {
            'sanity': 'bg-blue-100 text-blue-700 border-blue-200',
            'regression': 'bg-purple-100 text-purple-700 border-purple-200',
            'smoke': 'bg-orange-100 text-orange-700 border-orange-200',
            'uat': 'bg-green-100 text-green-700 border-green-200',
            'integration': 'bg-pink-100 text-pink-700 border-pink-200',
            'e2e': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'functional': 'bg-blue-100 text-blue-700 border-blue-200',
            'performance': 'bg-purple-100 text-purple-700 border-purple-200',
            'security': 'bg-orange-100 text-orange-700 border-orange-200',
        };
        return colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const handleRefresh = () => {
        const stored = JSON.parse(localStorage.getItem('testSuites') || '[]');
        setTestSuites(stored);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Filters Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search test suites..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                <select
                    value={selectedEnvironment}
                    onChange={(e) => setSelectedEnvironment(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All environments</option>
                    <option value="Development">Development</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                    <option value="No Environment">No Environment</option>
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All status</option>
                    <option value="Generated">Generated</option>
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                </select>

                <TagFilter
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    allTags={allTags}
                />

                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name (A-Z)</option>
                </select>

                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Active Filters */}
            {selectedTags.length > 0 && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {selectedTags.map((tag) => (
                        <span
                            key={tag}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getTagColor(tag)}`}
                        >
                            {tag}
                            <button
                                onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                                className="hover:bg-black/10 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <button
                        onClick={() => setSelectedTags([])}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Empty State */}
            {filteredSuites.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500 mb-4">No test suites found</p>
                    <button
                        onClick={onCreateClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Create your first test suite
                    </button>
                </div>
            )}

            {/* Test Suites */}
            {filteredSuites.map((suite) => (
                <div key={suite.id} className="bg-white rounded-lg border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h3 className="text-lg font-semibold text-gray-900">{suite.name}</h3>
                                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${suite.status === 'Generated' ? 'bg-green-100 text-green-700 border-green-200' :
                                            suite.status === 'Running' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                'bg-gray-100 text-gray-700 border-gray-200'
                                        }`}>
                                        {suite.status}
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                                        ⚫ {suite.environment}
                                    </span>
                                </div>

                                {suite.description && (
                                    <p className="text-sm text-gray-600 mb-3">{suite.description}</p>
                                )}

                                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                                    <span>Created: {suite.created}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>ID: {suite.id}</span>
                                </div>

                                {suite.tags && suite.tags.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {suite.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getTagColor(tag)}`}
                                            >
                                                <Tag className="w-3 h-3" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Run tests">
                                <Play className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Edit">
                                <Edit className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="More options">
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Pagination */}
            {filteredSuites.length > 0 && (
                <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">
                        Showing 1 to {filteredSuites.length} of {filteredSuites.length} test suites
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Previous
                        </button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium">
                            1
                        </button>
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==================== MAIN APP ====================

export default function App() {
    const [view, setView] = useState('list');

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">API Testing Suite</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setView('list')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                View Test Suites
                            </button>
                            <button
                                onClick={() => setView('create')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'create'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Create Test Suite
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8">
                {view === 'create' ? (
                    <TestSuiteCreationForm onSuccess={() => setView('list')} />
                ) : (
                    <TestSuiteListView onCreateClick={() => setView('create')} />
                )}
            </main>
        </div>
    );
}