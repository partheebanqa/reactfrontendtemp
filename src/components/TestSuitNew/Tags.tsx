import { Plus, Tag, X } from 'lucide-react';
import { useState } from 'react';

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

  // 1) Canonical registry: key = normalized id, value = display label
  const TAG_REGISTRY: Record<string, string> = {
    sanity: 'Sanity',
    regression: 'Regression',
    smoke: 'Smoke',
    uat: 'UAT',
    integration: 'Integration',
    e2e: 'E2E',
    functional: 'Functional',
    performance: 'Performance',
    security: 'Security',
    api: 'API',
    ui: 'UI',
    unit: 'Unit',
  };

  // 2) Normalize input -> display label (canonical if known, else Title Case)
  const normalizeTag = (raw: string) => {
    const lower = raw.toLowerCase().trim();

    // exact registry match
    if (TAG_REGISTRY[lower]) return TAG_REGISTRY[lower];

    // otherwise title-case words
    return raw
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // 3) Duplicate prevention (case-insensitive + normalization-safe)
  const tagExists = (existing: string[], newRaw: string) => {
    const normalizedNew = normalizeTag(newRaw).toLowerCase();
    return existing.some((t) => t.toLowerCase() === normalizedNew);
  };

  // 4) Available tags list (from registry values)
  const availableTags = Object.values(TAG_REGISTRY).filter(
    (label) => !tags.some((t) => t.toLowerCase() === label.toLowerCase()),
  );

  // 5) Color helper (use normalized key if possible)
  const getTagColor = (tag: string) => {
    // Convert display label back to key when possible
    const lower = tag.toLowerCase().trim();

    // reverse lookup: "Sanity" -> "sanity"
    const key =
      Object.keys(TAG_REGISTRY).find(
        (k) => TAG_REGISTRY[k].toLowerCase() === lower,
      ) || lower; // fallback

    const colors: Record<string, string> = {
      sanity: 'bg-blue-100 text-blue-700 border-blue-200',
      regression: 'bg-purple-100 text-purple-700 border-purple-200',
      smoke: 'bg-orange-100 text-orange-700 border-orange-200',
      uat: 'bg-green-100 text-green-700 border-green-200',
      integration: 'bg-pink-100 text-pink-700 border-pink-200',
      e2e: 'bg-indigo-100 text-indigo-700 border-indigo-200',

      functional: 'bg-blue-100 text-blue-700 border-blue-200',
      performance: 'bg-purple-100 text-purple-700 border-purple-200',
      security: 'bg-orange-100 text-orange-700 border-orange-200',
      api: 'bg-gray-100 text-gray-700 border-gray-200',
      ui: 'bg-gray-100 text-gray-700 border-gray-200',
      unit: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    return colors[key] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // 6) Add tag (normalize + prevent duplicates + store canonical display)
  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) {
      setError('Tag cannot be empty');
      return;
    }

    const normalized = normalizeTag(trimmed);

    if (tagExists(tags, normalized)) {
      setError('Tag already exists');
      return;
    }

    setTags((prev) => [...prev, normalized]); // ✅ store canonical label
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
    <div className='space-y-2'>
      <label className='block text-sm font-medium text-gray-700'>{label}</label>

      <div className='w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus-within:ring-0 focus-within:ring-blue-500 focus-within:border-[#136fb0]'>
        <div className='flex flex-wrap gap-2 items-center'>
          {tags.length === 0 && inputValue === '' && (
            <span className='text-gray-400 text-sm'>{placeholder}</span>
          )}

          {tags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getTagColor(tag)} transition-all`}
            >
              <Tag className='w-3 h-3' />
              {tag}
              <button
                type='button'
                onClick={() => handleRemoveTag(tag)}
                className='hover:bg-black/10 rounded-full p-0.5 transition-colors'
                aria-label={`Remove ${tag} tag`}
              >
                <X className='w-3 h-3' />
              </button>
            </span>
          ))}

          <div className='flex-1 min-w-[120px] flex items-center gap-2'>
            <input
              type='text'
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={tags.length > 0 ? 'Add another...' : ''}
              className='flex-1 outline-none text-sm bg-transparent'
            />

            {availableTags.length > 0 && (
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setShowQuickAdd((v) => !v)}
                  className='hover:bg-gray-100 rounded transition-colors'
                  aria-label='Quick add tags'
                >
                  <Plus className='w-4 h-4 text-gray-500' />
                </button>

                {showQuickAdd && (
                  <div className='absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48 z-50'>
                    <div className='text-xs font-medium text-gray-500 mb-2 px-2'>
                      Quick Add
                    </div>

                    {availableTags.map((t) => (
                      <button
                        key={t}
                        type='button'
                        onClick={() => {
                          handleAddTag(t);
                          setShowQuickAdd(false);
                        }}
                        className='w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center gap-2'
                      >
                        <Tag className='w-3 h-3 text-gray-400' />
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

      {error && <p className='text-xs text-red-600 mt-1'>{error}</p>}

      <p className='text-xs text-gray-500'>
        Press Enter to add a tag, or use the + button for quick suggestions
      </p>
    </div>
  );
};
export default TagInput;
