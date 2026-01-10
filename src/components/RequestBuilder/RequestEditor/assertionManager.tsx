'use client';

import type React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, Circle, Search, X, Plus, Filter } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';

interface Assertion {
  impact: React.JSX.Element;
  id: string;
  description: string;
  category: string;
  enabled: boolean;
  priority?: string;
  expectedValue?: any;
}

interface AssertionManagerProps {
  assertions: Assertion[];
  setAssertions: (assertions: Assertion[]) => void;
  onSaveAssertions?: () => Promise<void>;
}

const AssertionManager: React.FC<AssertionManagerProps> = ({
  assertions,
  setAssertions,
  onSaveAssertions,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [tempAssertions, setTempAssertions] = useState<Assertion[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (showDialog) {
      setTempAssertions(assertions);
    }
  }, [showDialog, assertions]);

  const handleToggleAssertion = (id: string) => {
    setTempAssertions(
      tempAssertions.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  const handleSaveAssertions = async () => {
    const selectedCount = tempAssertions.filter((a) => a.enabled).length;

    // Apply temp changes to actual assertions
    setAssertions(tempAssertions);

    if (onSaveAssertions) {
      try {
        await onSaveAssertions();
        toast({
          title: 'Success',
          description: `${selectedCount} assertion(s) saved successfully`,
        });
      } catch (error) {
        console.error('Error saving assertions:', error);
        toast({
          title: 'Error',
          description: 'Failed to save assertions',
        });
      }
    } else {
      toast({
        title: 'Success',
        description: `${selectedCount} assertion(s) selected`,
      });
    }

    setShowDialog(false);
  };

  const handleUnselectAll = () => {
    setTempAssertions((prev) => prev.map((a) => ({ ...a, enabled: false })));
  };

  const selectedAssertions = assertions.filter((a) => a.enabled);
  const totalCount = assertions.length;

  const categories = useMemo(() => {
    const uniqueCats = [
      ...new Set(tempAssertions.map((a) => a.category.toUpperCase())),
    ];
    return ['All Categories', ...uniqueCats.sort()];
  }, [tempAssertions]);

  const filteredAssertions = useMemo(() => {
    let filtered = tempAssertions;

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(
        (a) => a.category.toUpperCase() === selectedCategory
      );
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.description.toLowerCase().includes(search) ||
          a.category.toLowerCase().includes(search)
      );
    }

    const uniqueFiltered = filtered.filter(
      (assertion, index, self) =>
        index ===
        self.findIndex(
          (a) =>
            a.description === assertion.description &&
            a.category === assertion.category
        )
    );

    return uniqueFiltered;
  }, [tempAssertions, selectedCategory, searchTerm]);

  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, Assertion[]> = {};

    // Add selected category first if there are selected assertions
    const selectedFiltered = filteredAssertions.filter((a) => a.enabled);
    if (selectedFiltered.length > 0) {
      grouped['SELECTED'] = selectedFiltered;
    }

    // Then add other categories (excluding selected assertions)
    filteredAssertions.forEach((assertion) => {
      // Skip if assertion is enabled (already in SELECTED)
      if (assertion.enabled) return;

      const cat = assertion.category.toUpperCase();
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(assertion);
    });

    return grouped;
  }, [filteredAssertions]);

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDialogClose = () => {
    // Reset temp assertions to original state
    setTempAssertions(assertions);
    setShowDialog(false);
    setSearchTerm('');
    setSelectedCategory('All Categories');
  };

  const tempSelectedCount = tempAssertions.filter((a) => a.enabled).length;

  return (
    <div className='w-full'>
      {selectedAssertions.length > 0 ? (
        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Active Assertions{' '}
              <span className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
                {' '}
                {selectedAssertions.length}
              </span>
            </h3>
            <span>
              {' '}
              <button
                onClick={() => setShowDialog(true)}
                className='w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2'
              >
                <Plus className='w-4 h-4' />
                Manage Assertions
              </button>{' '}
            </span>
          </div>

          <div className='space-y-2 mb-4 max-h-96 overflow-y-auto scrollbar-thin'>
            {selectedAssertions.map((assertion) => (
              <div
                key={assertion.id}
                className='flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors'
              >
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900'>
                    {assertion.description}
                  </p>
                  <div className='flex gap-2 mt-2'>
                    <span className='px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium'>
                      {assertion.category}
                    </span>
                    {assertion.priority && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                          assertion.priority
                        )}`}
                      >
                        {assertion.priority}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAssertions(
                      assertions.map((a) =>
                        a.id === assertion.id ? { ...a, enabled: false } : a
                      )
                    );
                  }}
                  className='ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='bg-white rounded-xl border border-gray-200 p-8 text-center'>
          <p className='text-gray-600 mb-4'>No assertions selected</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className='w-4 h-4' />
            Add Assertions
          </Button>
        </div>
      )}

      {showDialog && (
        <div className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col'>
            <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Select Assertions to Include
              </h2>
              <button
                onClick={handleDialogClose}
                className='p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='px-6 py-4 border-b border-gray-200 flex-shrink-0'>
              <div className='flex gap-3'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder='Search assertions...'
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div className='relative'>
                  <Filter className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white'
                  >
                    {categories.map((cat) => {
                      const count =
                        cat === 'All Categories'
                          ? tempAssertions.length
                          : tempAssertions.filter(
                              (a) => a.category.toUpperCase() === cat
                            ).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto scrollbar-thin px-6 py-4'>
              {Object.entries(groupedByCategory).length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  No assertions found
                </div>
              ) : (
                <div className='space-y-6'>
                  {Object.entries(groupedByCategory).map(
                    ([category, items]) => (
                      <div key={category}>
                        <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>
                          {category}
                        </h3>
                        <div className='space-y-2'>
                          {items.map((assertion) => (
                            <div
                              key={assertion.id}
                              onClick={() =>
                                handleToggleAssertion(assertion.id)
                              }
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                assertion.enabled
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className='flex items-start gap-3'>
                                <div className='mt-1 flex-shrink-0'>
                                  {assertion.enabled ? (
                                    <CheckCircle2 className='w-5 h-5 text-blue-600' />
                                  ) : (
                                    <Circle className='w-5 h-5 text-gray-400' />
                                  )}
                                </div>

                                <div className='flex-1 min-w-0'>
                                  <p className='text-sm font-medium text-gray-900 truncate'>
                                    {assertion.description}
                                  </p>

                                  {assertion.impact && (
                                    <p className='text-xs text-gray-600 mt-1 italic'>
                                      Impact: {assertion.impact}
                                    </p>
                                  )}
                                </div>

                                <div className='flex-shrink-0 flex items-center gap-2'>
                                  <span className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium'>
                                    {assertion.category}
                                  </span>

                                  {assertion.priority && (
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                                        assertion.priority
                                      )}`}
                                    >
                                      {assertion.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50'>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <span>
                  {tempSelectedCount} of {totalCount} assertions selected
                </span>

                {tempSelectedCount > 0 && (
                  <>
                    <span className='text-gray-400'>·</span>
                    <button
                      title='Deselect all assertions'
                      onClick={handleUnselectAll}
                      className='text-red-600 hover:text-red-700 font-medium transition-colors'
                    >
                      Unselect All
                    </button>
                  </>
                )}
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={handleDialogClose}
                  className='px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors'
                >
                  Cancel
                </button>

                <Button onClick={handleSaveAssertions}>Save Assertions</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssertionManager;
