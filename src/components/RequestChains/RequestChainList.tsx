import React, { useMemo, useState } from 'react';
import {
  Play,
  Eye,
  Edit2,
  MoreVertical,
  Copy,
  BarChart3,
  Trash2,
  Link2,
  Search,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/* =========================
   Types
========================= */

type ChainStatus = 'Enabled' | 'Disabled';
type ChainEnvironment = 'Production' | 'Staging' | 'No Environment';
type SortOrder = 'Newest First' | 'Oldest First' | 'A-Z' | 'Z-A';

type MenuAction =
  | 'execute'
  | 'view'
  | 'edit'
  | 'duplicate'
  | 'reports'
  | 'delete';

type EnvironmentFilter = 'All environments' | ChainEnvironment;
type StatusFilter = 'All Status' | ChainStatus;
type TagsFilter = 'All Tags' | string;

interface RequestChain {
  id: string;
  name: string;
  workspace: string;
  status: ChainStatus;
  environment: ChainEnvironment;
  description: string;
  flow: string[];
  createdAt: string; // dd/MM/yyyy
  tags: string[];
}

/* =========================
   Helpers
========================= */

const parseDDMMYYYY = (value: string): number => {
  // expected: "28/02/2026"
  const [dd, mm, yyyy] = value.split('/').map((x) => Number(x));
  if (!dd || !mm || !yyyy) return 0;
  return new Date(yyyy, mm - 1, dd).getTime();
};

const includesCI = (haystack: string, needle: string) =>
  haystack.toLowerCase().includes(needle.toLowerCase());

/* =========================
   Component
========================= */

const RequestChainsList: React.FC = () => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [environmentFilter, setEnvironmentFilter] =
    useState<EnvironmentFilter>('All environments');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All Status');
  const [tagsFilter, setTagsFilter] = useState<TagsFilter>('All Tags');
  const [sortOrder, setSortOrder] = useState<SortOrder>('Newest First');

  const requestChains: RequestChain[] = [
    {
      id: 'f0393f4f-0e55-4062-b29d-e7c8a1b2c3d4',
      name: 'Variable test 5',
      workspace: 'AniketTest',
      status: 'Enabled',
      environment: 'No Environment',
      description: 'Login → Tenant_get_Workspace',
      flow: ['Login', 'Tenant_get_Workspace'],
      createdAt: '28/02/2026',
      tags: [],
    },
    {
      id: '7c2e940f-c9f1-424a-9370-e734a61c9361',
      name: 'Newnetworkcall',
      workspace: 'No Environment',
      status: 'Enabled',
      environment: 'No Environment',
      description: 'Networkcall check',
      flow: ['Login', 'GetUserWorkspaces', 'GetWorkspaceToken'],
      createdAt: '24/02/2026',
      tags: ['Sanity'],
    },
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'User Authentication Flow',
      workspace: 'ProductionTest',
      status: 'Enabled',
      environment: 'Production',
      description: 'Complete user auth flow',
      flow: ['Register', 'VerifyEmail', 'Login', 'GetProfile'],
      createdAt: '27/02/2026',
      tags: ['Auth', 'Critical'],
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
      name: 'Payment Gateway Integration',
      workspace: 'StagingTest',
      status: 'Disabled',
      environment: 'Staging',
      description: 'End-to-end payment flow',
      flow: ['AddToCart', 'Checkout', 'ProcessPayment', 'ConfirmOrder'],
      createdAt: '26/02/2026',
      tags: ['Payment', 'E-commerce'],
    },
    {
      id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
      name: 'API Health Check Chain',
      workspace: 'MonitoringTest',
      status: 'Enabled',
      environment: 'Production',
      description: 'System health monitoring',
      flow: ['HealthCheck', 'DatabaseStatus', 'ServiceStatus'],
      createdAt: '25/02/2026',
      tags: ['Monitoring'],
    },
    {
      id: 'd4e5f6a7-b8c9-0123-def4-56789012345',
      name: 'Data Sync Workflow',
      workspace: 'IntegrationTest',
      status: 'Enabled',
      environment: 'Staging',
      description: 'Cross-system data sync',
      flow: ['FetchData', 'TransformData', 'ValidateData', 'SyncToTarget'],
      createdAt: '23/02/2026',
      tags: ['Integration', 'Sync'],
    },
  ];

  const filteredAndSortedChains = useMemo(() => {
    let list = [...requestChains];

    // Search
    const q = searchQuery.trim();
    if (q) {
      list = list.filter((c) => {
        const joinedFlow = c.flow.join(' ');
        const joinedTags = c.tags.join(' ');
        return (
          includesCI(c.name, q) ||
          includesCI(c.description, q) ||
          includesCI(c.workspace, q) ||
          includesCI(c.environment, q) ||
          includesCI(c.status, q) ||
          includesCI(joinedFlow, q) ||
          includesCI(joinedTags, q) ||
          includesCI(c.id, q)
        );
      });
    }

    // Environment filter
    if (environmentFilter !== 'All environments') {
      list = list.filter((c) => c.environment === environmentFilter);
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      list = list.filter((c) => c.status === statusFilter);
    }

    // Tags filter
    if (tagsFilter !== 'All Tags') {
      list = list.filter((c) => c.tags.includes(tagsFilter));
    }

    // Sort
    list.sort((a, b) => {
      if (sortOrder === 'Newest First') {
        return parseDDMMYYYY(b.createdAt) - parseDDMMYYYY(a.createdAt);
      }
      if (sortOrder === 'Oldest First') {
        return parseDDMMYYYY(a.createdAt) - parseDDMMYYYY(b.createdAt);
      }
      if (sortOrder === 'A-Z') return a.name.localeCompare(b.name);
      if (sortOrder === 'Z-A') return b.name.localeCompare(a.name);
      return 0;
    });

    return list;
  }, [
    requestChains,
    searchQuery,
    environmentFilter,
    statusFilter,
    tagsFilter,
    sortOrder,
  ]);

  const itemsPerPage = 10;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedChains.length / itemsPerPage),
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChains = filteredAndSortedChains.slice(startIndex, endIndex);

  const toggleMenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleAction = (action: MenuAction, chain: RequestChain) => {
    setOpenMenuId(null);
  };

  const handlePageChange = (page: number) => {
    const next = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When filters/search change, keep page valid
  useMemo(() => {
    if (currentPage > totalPages) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const renderPagination = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <div className='flex items-center justify-between px-4 py-4 bg-white border-t border-slate-200'>
        <div className='text-sm text-slate-600'>
          Showing {filteredAndSortedChains.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(endIndex, filteredAndSortedChains.length)} of{' '}
          {filteredAndSortedChains.length} Request Chains
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className='px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
              >
                1
              </button>
              {startPage > 2 && <span className='text-slate-400'>...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className='text-slate-400'>...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className='px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
        </div>
      </div>
    );
  };

  const totalCount = filteredAndSortedChains.length;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/40'>
      <main className='mx-auto px-2 sm:px-2 lg:px-2 py-6'>
        {/* Filters Section */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6'>
          {/* Search */}
          <div className='relative mb-4'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
            <input
              type='text'
              placeholder='Search request chains...'
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Filter Dropdowns */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4'>
            <select
              value={environmentFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setEnvironmentFilter(e.target.value as EnvironmentFilter);
                setCurrentPage(1);
              }}
              className='px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            >
              <option>All environments</option>
              <option>Production</option>
              <option>Staging</option>
              <option>No Environment</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              className='px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            >
              <option>All Status</option>
              <option>Enabled</option>
              <option>Disabled</option>
            </select>

            <select
              value={tagsFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setTagsFilter(e.target.value as TagsFilter);
                setCurrentPage(1);
              }}
              className='px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            >
              <option>All Tags</option>
              <option>Sanity</option>
              <option>Auth</option>
              <option>Payment</option>
              <option>Monitoring</option>
              <option>Integration</option>
              <option>Sync</option>
              <option>Critical</option>
              <option>E-commerce</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setSortOrder(e.target.value as SortOrder);
                setCurrentPage(1);
              }}
              className='px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            >
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>A-Z</option>
              <option>Z-A</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type='button'
            onClick={() => {}}
            className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-900/30 transition-all duration-200'
          >
            <RefreshCw className='w-4 h-4' />
            Refresh
          </button>
        </div>

        {/* Results Count */}
        <div className='text-sm text-slate-600 mb-4'>
          Showing {currentChains.length} of {totalCount} chains
        </div>

        {/* Desktop View */}
        <div className='hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-slate-50 border-b border-slate-200'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                  Request Chain
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                  Workspace
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                  Flow
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                  Created
                </th>
                <th className='px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className='divide-y divide-slate-100'>
              {currentChains.map((chain) => (
                <tr
                  key={chain.id}
                  className='hover:bg-slate-50/50 transition-colors'
                >
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm'>
                        <Link2 className='w-5 h-5 text-white' />
                      </div>

                      <div className='max-w-xs'>
                        <p className='font-semibold text-slate-900 truncate'>
                          {chain.name}
                        </p>
                        <p className='text-xs text-slate-500 truncate'>
                          {chain.description}
                        </p>
                        <p className='text-xs text-slate-400 font-mono truncate mt-0.5'>
                          ID: {chain.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className='px-6 py-4'>
                    <span className='text-sm text-slate-700'>
                      {chain.workspace}
                    </span>
                  </td>

                  <td className='px-6 py-4'>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        chain.status === 'Enabled'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {chain.status}
                    </span>
                  </td>

                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-1 text-xs text-slate-600 max-w-xs overflow-x-auto'>
                      {chain.flow.map((step, idx) => (
                        <React.Fragment key={`${chain.id}-flow-${idx}`}>
                          <span className='whitespace-nowrap font-medium'>
                            {step}
                          </span>
                          {idx < chain.flow.length - 1 && (
                            <span className='text-slate-400'>→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {chain.tags.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {chain.tags.map((tag, idx) => (
                          <span
                            key={`${chain.id}-tag-${idx}`}
                            className='px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className='px-6 py-4'>
                    <span className='text-sm text-slate-600'>
                      {chain.createdAt}
                    </span>
                  </td>

                  <td className='px-6 py-4'>
                    <div className='flex items-center justify-end gap-2'>
                      <button
                        onClick={() => handleAction('execute', chain)}
                        className='p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors'
                        title='Execute chain'
                      >
                        <Play className='w-4 h-4' />
                      </button>

                      <button
                        onClick={() => handleAction('view', chain)}
                        className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
                        title='View chain'
                      >
                        <Eye className='w-4 h-4' />
                      </button>

                      <button
                        onClick={() => handleAction('edit', chain)}
                        className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        title='Edit chain'
                      >
                        <Edit2 className='w-4 h-4' />
                      </button>

                      <div className='relative'>
                        <button
                          onClick={() => toggleMenu(chain.id)}
                          className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
                          title='More options'
                        >
                          <MoreVertical className='w-4 h-4' />
                        </button>

                        {openMenuId === chain.id && (
                          <>
                            <div
                              className='fixed inset-0 z-10'
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20'>
                              <button
                                onClick={() => handleAction('duplicate', chain)}
                                className='w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3'
                              >
                                <Copy className='w-4 h-4' />
                                Duplicate
                              </button>

                              <button
                                onClick={() => handleAction('reports', chain)}
                                className='w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3'
                              >
                                <BarChart3 className='w-4 h-4' />
                                Reports
                              </button>

                              <div className='border-t border-slate-100 my-1' />

                              <button
                                onClick={() => handleAction('delete', chain)}
                                className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3'
                              >
                                <Trash2 className='w-4 h-4' />
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

              {totalCount === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-10 text-center text-slate-500'
                  >
                    No chains match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {renderPagination()}
        </div>

        {/* Mobile/Tablet View */}
        <div className='lg:hidden space-y-4'>
          {currentChains.map((chain) => (
            <div
              key={chain.id}
              className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow'
            >
              {/* Card Header */}
              <div className='p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-transparent'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex items-start gap-3 flex-1 min-w-0'>
                    <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0'>
                      <Link2 className='w-6 h-6 text-white' />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <h3 className='font-bold text-slate-900 truncate'>
                        {chain.name}
                      </h3>

                      <div className='flex flex-wrap items-center gap-2 mt-1'>
                        <span className='text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded'>
                          {chain.workspace}
                        </span>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            chain.status === 'Enabled'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {chain.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='relative flex-shrink-0'>
                    <button
                      onClick={() => toggleMenu(chain.id)}
                      className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
                    >
                      <MoreVertical className='w-5 h-5' />
                    </button>

                    {openMenuId === chain.id && (
                      <>
                        <div
                          className='fixed inset-0 z-10'
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20'>
                          <button
                            onClick={() => handleAction('duplicate', chain)}
                            className='w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3'
                          >
                            <Copy className='w-4 h-4' />
                            Duplicate
                          </button>

                          <button
                            onClick={() => handleAction('reports', chain)}
                            className='w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3'
                          >
                            <BarChart3 className='w-4 h-4' />
                            Reports
                          </button>

                          <div className='border-t border-slate-100 my-1' />

                          <button
                            onClick={() => handleAction('delete', chain)}
                            className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3'
                          >
                            <Trash2 className='w-4 h-4' />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className='p-4 space-y-3'>
                <p className='text-sm text-slate-600'>{chain.description}</p>

                <div className='bg-slate-50 rounded-lg p-3 border border-slate-200'>
                  <div className='flex items-center flex-wrap gap-1.5 text-xs'>
                    {chain.flow.map((step, idx) => (
                      <React.Fragment key={`${chain.id}-flowm-${idx}`}>
                        <span className='px-2 py-1 bg-white text-slate-700 rounded font-medium border border-slate-200'>
                          {step}
                        </span>
                        {idx < chain.flow.length - 1 && (
                          <span className='text-slate-400 font-bold'>→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {chain.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1.5'>
                    {chain.tags.map((tag, idx) => (
                      <span
                        key={`${chain.id}-tagm-${idx}`}
                        className='px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className='flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100'>
                  <span className='font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200'>
                    ID: {chain.id.slice(0, 8)}...
                  </span>
                  <span>•</span>
                  <span>Created: {chain.createdAt}</span>
                </div>

                <div className='grid grid-cols-3 gap-2 pt-2'>
                  <button
                    onClick={() => handleAction('execute', chain)}
                    className='flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-teal-600/30 transition-all duration-200'
                  >
                    <Play className='w-4 h-4' />
                    <span className='text-xs'>Execute</span>
                  </button>

                  <button
                    onClick={() => handleAction('view', chain)}
                    className='flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors border border-slate-200'
                  >
                    <Eye className='w-4 h-4' />
                    <span className='text-xs'>View</span>
                  </button>

                  <button
                    onClick={() => handleAction('edit', chain)}
                    className='flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200'
                  >
                    <Edit2 className='w-4 h-4' />
                    <span className='text-xs'>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {renderPagination()}
        </div>

        {/* Empty State (only if truly no chains at all) */}
        {requestChains.length === 0 && (
          <div className='text-center py-16 bg-white rounded-xl border border-slate-200'>
            <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Link2 className='w-8 h-8 text-purple-600' />
            </div>
            <h3 className='text-lg font-semibold text-slate-900 mb-2'>
              No request chains yet
            </h3>
            <p className='text-slate-500 mb-6'>
              Create your first request chain to test complex user flows
            </p>
            <button className='px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-900/30 transition-all duration-200'>
              + Create Request Chain
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RequestChainsList;
