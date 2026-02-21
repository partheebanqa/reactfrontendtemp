import { Plus, Tag, X } from "lucide-react";
import { useState } from "react";

type TagInputProps = {
    tags: string[];
    setTags: React.Dispatch<React.SetStateAction<string[]>>;
    label?: string;
    placeholder?: string;
};

const TagInput: React.FC<TagInputProps> = ({
    tags,
    setTags,
    label = 'Tags (optional)',
    placeholder = 'Add tags to categorize your test suite...',
}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    const predefinedTags = [
        'Sanity',
        'Regression',
        'Smoke',
        'UAT',
        'Integration',
        'E2E',
    ];

    const availableTags = predefinedTags.filter(
        (t) => !tags.some((x) => x.toLowerCase() === t.toLowerCase())
    );

    const getTagColor = (tag: string) => {
        const colors: Record<string, string> = {
            sanity: 'bg-blue-100 text-blue-700 border-blue-200',
            regression: 'bg-purple-100 text-purple-700 border-purple-200',
            smoke: 'bg-orange-100 text-orange-700 border-orange-200',
            uat: 'bg-green-100 text-green-700 border-green-200',
            integration: 'bg-pink-100 text-pink-700 border-pink-200',
            e2e: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        };
        return colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const handleAddTag = (tagName: string) => {
        const trimmed = tagName.trim();
        if (!trimmed) {
            setError('Tag cannot be empty');
            return;
        }

        if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
            setError('Tag already exists');
            return;
        }

        setTags((prev) => [...prev, trimmed]);
        setInputValue('');
        setError('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(inputValue);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags((prev) => prev.filter((t) => t !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <div className="flex flex-wrap gap-2 items-center">
                    {tags.length === 0 && inputValue === '' && (
                        <span className="text-gray-400 text-sm">{placeholder}</span>
                    )}

                    {tags.map((tag, idx) => (
                        <span
                            key={`${tag}-${idx}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getTagColor(tag)} transition-all`}
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                            <button
                                type="button"
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
                            placeholder={tags.length > 0 ? 'Add another...' : ''}
                            className="flex-1 outline-none text-sm bg-transparent"
                        />

                        {availableTags.length > 0 && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowQuickAdd((v) => !v)}
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

                                        {availableTags.map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => {
                                                    handleAddTag(t);
                                                    setShowQuickAdd(false);
                                                }}
                                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                            >
                                                <Tag className="w-3 h-3 text-gray-400" />
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

            <p className="text-xs text-gray-500">
                Press Enter to add a tag, or use the + button for quick suggestions
            </p>
        </div>
    );
};
export default TagInput;