import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VariableTable from './VariableTable';
import CodeBlock from '../CodeBlock';
import { RequestTimelineItem } from './RequestTimeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { ValidationHistory, ValidationResult } from '@/components/Shared/Assertion/AssertionReport';

interface RequestCardProps {
  request: RequestTimelineItem;
  index: number;
}

export default function RequestCard({ request, index }: RequestCardProps) {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'POST':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'PUT':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'PATCH':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'skipped':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatResponse = (response: string) => {
    if (!response) return '';
    try {
      return JSON.stringify(JSON.parse(response), null, 2);
    } catch {
      return response;
    }
  };

  const hasSubstituted =
    request.substitutedVariables && request.substitutedVariables.length > 0;
  const hasExtracted =
    request.extractedVariables && request.extractedVariables.length > 0;

  const hasAssertion =
    request.assertionResults && request.assertionResults.length > 0;

  const [tableFilterStatus, setTableFilterStatus] = useState<
    'All' | 'Passed' | 'Failed'
  >('All');

  const [tableFilterCategory, setTableFilterCategory] = useState('All');
  const [tableSortConfig, setTableSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });

  const handleTableSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (tableSortConfig.key === key && tableSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setTableSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (tableSortConfig.key !== columnKey) {
      return <ArrowUpDown className='w-4 h-4 text-gray-400' />;
    }
    return tableSortConfig.direction === 'asc' ? (
      <ArrowUp className='w-4 h-4 text-blue-600' />
    ) : (
      <ArrowDown className='w-4 h-4 text-blue-600' />
    );
  };




  const getFilteredTableData = () => {
    let filtered = [...request?.assertionResults || []];

    if (tableFilterStatus !== 'All') {
      filtered = filtered.filter((r) => r.status === tableFilterStatus);
    }

    if (tableFilterCategory !== 'All') {
      // ✅ NORMALIZE CATEGORY MATCHING
      filtered = filtered.filter((r) => {
        const normalizedCategory = r.category.toLowerCase().trim();
        const filterValue = tableFilterCategory.toLowerCase();

        if (filterValue === 'body') {
          return (
            normalizedCategory === 'body' ||
            normalizedCategory === 'request body' ||
            normalizedCategory === 'request body fields'
          );
        }
        if (filterValue === 'headers') {
          return (
            normalizedCategory === 'headers' ||
            normalizedCategory === 'response headers'
          );
        }
        if (filterValue === 'headerguard™') {
          return (
            normalizedCategory === 'headerguard™' ||
            normalizedCategory === 'security headers guard'
          );
        }
        if (filterValue === 'performance') {
          return (
            normalizedCategory === 'performance' ||
            normalizedCategory === 'performance checks'
          );
        }
        if (filterValue === 'status') {
          return (
            normalizedCategory === 'status' ||
            normalizedCategory === 'status code'
          );
        }

        return normalizedCategory === filterValue;
      });
    }

    if (tableSortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = (a as any)[tableSortConfig.key as string];
        let bVal = (b as any)[tableSortConfig.key as string];

        // if (tableSortConfig.key === 'failureRate') {
        //   const aHistory = getHistory((a as any).id);
        //   const bHistory = getHistory((b as any).id);
        //   aVal = aHistory.failureRate as any;
        //   bVal = bHistory.failureRate as any;
        // }

        if (aVal < bVal) return tableSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return tableSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };


  return (
    <div className='relative pl-8' data-testid={`request-card-${index}`}>
      <div className='absolute left-0 top-0 bottom-0 w-0.5 bg-border' />
      <div className='absolute left-0 top-6 w-3 h-3 rounded-full bg-primary border-2 border-background -translate-x-[5px]' />

      <Accordion type='single' collapsible className='w-full'>
        <AccordionItem value={request.id} className='border-none'>
          <AccordionTrigger
            className='hover:no-underline py-0 hover-elevate rounded-md'
            data-testid={`accordion-trigger-${index}`}
          >
            <div className='flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-4 w-full'>
              <div className='flex items-center gap-3 flex-1'>
                <span className='text-sm font-medium text-muted-foreground min-w-[2rem]'>
                  #{request.order}
                </span>
                <Badge
                  className={`text-xs font-mono uppercase border ${getMethodColor(
                    request.method
                  )}`}
                >
                  {request.method}
                </Badge>
                <span
                  className='font-medium text-foreground'
                  data-testid={`text-request-name-${index}`}
                >
                  {request.name}
                </span>
              </div>
              <div className='flex items-center gap-3 flex-wrap'>
                <Badge
                  variant={getStatusColor(request.status)}
                  className='text-xs uppercase'
                  data-testid={`badge-status-${index}`}
                >
                  {request.status}
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  {request.duration}ms
                </span>
                <span className='text-xs text-muted-foreground'>
                  {request.responseStatusCode}
                </span>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className='pb-6'>
            <div className='px-4 space-y-4'>
              {/* Top details grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm'>
                <div>
                  <span className='text-muted-foreground'>URL:</span>
                  <p
                    className='font-mono text-xs text-foreground break-all mt-1'
                    data-testid={`text-url-${index}`}
                  >
                    {request.url}
                  </p>
                </div>
                <div>
                  <span className='text-muted-foreground'>Status Code:</span>
                  <p className='font-medium text-foreground mt-1'>
                    {request.responseStatusCode}
                  </p>
                </div>
                <div>
                  <span className='text-muted-foreground'>Response Size:</span>
                  <p className='font-medium text-foreground mt-1'>
                    {formatBytes(request.responseSize)}
                  </p>
                </div>
                <div>
                  <span className='text-muted-foreground'>Duration:</span>
                  <p className='font-medium text-foreground mt-1'>
                    {request.duration}ms
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs
                defaultValue={request.requestCurl ? 'curl' : 'response'}
                className='w-full'
              >
                <TabsList>
                  {request.requestCurl && (
                    <TabsTrigger value='curl' data-testid={`tab-curl-${index}`}>
                      cURL Command
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value='response'
                    data-testid={`tab-response-${index}`}
                  >
                    Response
                  </TabsTrigger>
                  {hasSubstituted && (
                    <TabsTrigger
                      value='substituted'
                      data-testid={`tab-substituted-${index}`}
                    >
                      Used Variables ({request.substitutedVariables!.length})
                    </TabsTrigger>
                  )}
                  {hasExtracted && (
                    <TabsTrigger
                      value='variables'
                      data-testid={`tab-variables-${index}`}
                    >
                      Extracted Variables ({request.extractedVariables!.length})
                    </TabsTrigger>
                  )}
                  {hasAssertion && (
                    <TabsTrigger
                      value='assertions'
                      data-testid={`tab-assertions-${index}`}
                    >
                      Assertion Results({request?.assertionResults?.length})
                    </TabsTrigger>
                  )}
                </TabsList>

                {request.requestCurl && (
                  <TabsContent value='curl' className='mt-4'>
                    <CodeBlock
                      code={request.requestCurl}
                      testId={`code-curl-${index}`}
                    />
                  </TabsContent>
                )}

                <TabsContent value='response' className='mt-4'>
                  <CodeBlock
                    code={formatResponse(request.response)}
                    language='json'
                    testId={`code-response-${index}`}
                  />
                </TabsContent>

                {hasSubstituted && (
                  <TabsContent value='substituted' className='mt-4'>
                    <div className='border rounded-lg overflow-hidden'>
                      <div className='bg-muted px-4 py-3 border-b'>
                        <h4 className='text-sm font-semibold text-foreground'>
                          Variable Substitutions
                        </h4>
                        <p className='text-xs text-muted-foreground mt-1'>
                          Variables from previous requests used in this request
                        </p>
                      </div>
                      <div className='overflow-x-auto scrollbar-thin'>
                        <table
                          className='w-full text-sm'
                          data-testid={`table-substituted-${index}`}
                        >
                          <thead className='border-b bg-muted/50'>
                            <tr className='text-left'>
                              <th className='py-3 px-4 font-medium text-muted-foreground'>
                                Variable Name
                              </th>
                              <th className='py-3 px-4 font-medium text-muted-foreground'>
                                Value
                              </th>
                              <th className='py-3 px-4 font-medium text-muted-foreground'>
                                Used In
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {request.substitutedVariables!.map(
                              (variable: any, vIndex: any) => (
                                <tr
                                  key={vIndex}
                                  className='border-b last:border-0 hover-elevate'
                                  data-testid={`substituted-row-${index}-${vIndex}`}
                                >
                                  <td className='py-3 px-4 font-mono text-xs text-foreground font-medium'>
                                    {variable.name}
                                  </td>
                                  <td className='py-3 px-4 font-mono text-xs text-muted-foreground max-w-md truncate'>
                                    {variable.value.slice(0, 100)}
                                    {variable.value.length > 100 && '...'}
                                  </td>
                                  <td className='py-3 px-4 text-xs text-muted-foreground'>
                                    {variable.usedIn}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                )}

                {hasExtracted && (
                  <TabsContent value='variables' className='mt-4'>
                    <VariableTable
                      variables={request.extractedVariables!.map((v: any) => ({
                        ...v,
                        status: (v as any).status ?? 'success',
                        source: (v as any).source ?? 'response',
                      }))}
                      title='Extracted Variables'
                      testId={`table-extracted-${index}`}
                    />
                  </TabsContent>
                )}

                {hasAssertion && (
                  <TabsContent value='assertions' className='mt-4'>

                    <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
                      <div className='p-4 border-b border-gray-200'>
                        <div className='flex items-center justify-between mb-1'>
                          <h3 className='font-semibold text-gray-900 text-lg'>
                            Detailed Results
                          </h3>
                          <div className='flex gap-2'>
                            <Select
                              value={tableFilterStatus}
                              onValueChange={(value) =>
                                setTableFilterStatus(value as any)
                              }
                            >
                              <SelectTrigger className='w-[180px]'>
                                <SelectValue placeholder='Filter by status' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='All'>All Status</SelectItem>
                                <SelectItem value='Passed'>Passed Only</SelectItem>
                                <SelectItem value='Failed'>Failed Only</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={tableFilterCategory}
                              onValueChange={(value) => setTableFilterCategory(value)}
                            >
                              <SelectTrigger className='w-[180px]'>
                                <SelectValue placeholder='Filter by category' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='All'>All Categories</SelectItem>
                                <SelectItem value='body'>Request Body</SelectItem>
                                <SelectItem value='headers'>Response Headers</SelectItem>
                                <SelectItem value='HeaderGuard™'>Security</SelectItem>
                                <SelectItem value='performance'>Performance</SelectItem>
                                <SelectItem value='status'>Status</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className='overflow-x-auto'>
                        <table className='w-full'>
                          <thead className='bg-gray-50 border-b border-gray-200'>
                            <tr>
                              <th
                                className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                                onClick={() => handleTableSort('result')}
                              >
                                <div className='flex items-center gap-2'>
                                  Status
                                  <SortIcon columnKey='result' />
                                </div>
                              </th>
                              <th
                                className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                                onClick={() => handleTableSort('category')}
                              >
                                <div className='flex items-center gap-2'>
                                  Category
                                  <SortIcon columnKey='category' />
                                </div>
                              </th>

                              <th
                                className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                                onClick={() => handleTableSort('field')}
                              >
                                <div className='flex items-center gap-2'>
                                  Field
                                  <SortIcon columnKey='field' />
                                </div>
                              </th>
                              <th
                                className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                                onClick={() => handleTableSort('type')}
                              >
                                <div className='flex items-center gap-2'>
                                  Type
                                  <SortIcon columnKey='type' />
                                </div>
                              </th>
                              <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase'>
                                Actual
                              </th>
                              <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase'>
                                Expected
                              </th>
                              {/* <th
                                onClick={() => handleTableSort('responseStatus')}
                                className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase'>
                                <div className='flex items-center gap-2'>
                                  Code
                                  <SortIcon columnKey='responseStatus' />
                                </div>
                              </th> */}
                              {/* <th
                                onClick={() => handleTableSort('responseTime')}
                                className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase'>
                                <div className='flex items-center gap-2'>
                                  Time
                                  <SortIcon columnKey='responseTime' />
                                </div>
                              </th> */}
                              {/* <th
                                onClick={() => handleTableSort('responseSize')}
                                className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase'>
                                <div className='flex items-center gap-2'>
                                  Size
                                  <SortIcon columnKey='responseSize' />
                                </div>
                              </th> */}

                              {/* <th
                                className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                                onClick={() => handleTableSort('failureRate')}
                              >
                                <div className='flex items-center gap-2'>
                                  Status
                                  <SortIcon columnKey='' />
                                </div>
                              </th> */}
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-gray-200'>
                            {getFilteredTableData().map((result, index) => {
                              // const history = getHistory(result.index);
                              // const isResultFlaky = isFlaky(result.index);

                              return (
                                <tr
                                  key={index}
                                  className={`hover:bg-gray-50 transition-colors ${result.status === 'failed' ? 'bg-red-50' : ''
                                    }`}
                                >
                                  <td className='px-4 py-3 whitespace-nowrap'>
                                    <div
                                      className={` w-8 h-8 rounded-full flex items-center justify-center ${result.status === 'Passed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                      {result.status === 'Passed' ? (
                                        <Check className='w-5 h-5' />
                                      ) : (
                                        <X className='w-5 h-5' />
                                      )}
                                    </div>
                                    {/* <span className='text-sm text-gray-600'>

                                    </span> */}
                                  </td>
                                  <td className='px-4 py-3'>
                                    <span className='text-sm text-gray-600'>
                                      {result?.category}
                                    </span>
                                  </td>
                                  <td className='px-4 py-3'>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded'>
                                        {result?.field || 'N/A'}
                                      </span>

                                    </div>
                                  </td>
                                  <td className='px-4 py-3'>
                                    <span className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded'>
                                      {result.type}
                                    </span>
                                  </td>

                                  <td className='px-4 py-3'>
                                    <span className="text-sm text-gray-600 w-[150px] line-clamp-1">
                                      {result.actualValue || "NA"}
                                    </span>
                                  </td>
                                  <td className='px-4 py-3'>
                                    <span className="text-sm text-gray-600 w-[10px] truncate">
                                      {result?.expectedValue || "NA"}
                                    </span>
                                  </td>
                                  {/* <td className='px-4 py-3'>
                                    <span className="text-sm text-gray-600 w-[10px] truncate">
                                      {result?.responseStatus || "NA"}
                                    </span>
                                  </td>
                                  <td className='px-4 py-3'>
                                    <span className="text-sm text-gray-600 w-[10px] truncate">
                                      {result?.responseTime || "NA"}
                                    </span>
                                  </td>
                                  <td className='px-4 py-3'>
                                    <span className="text-sm text-gray-600 w-[10px] truncate">
                                      {result?.responseSize || "NA"}
                                    </span>
                                  </td> */}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {getFilteredTableData().length === 0 && (
                        <div className='p-8 text-center text-gray-500'>
                          No results match the selected filters
                        </div>
                      )}
                    </div>

                  </TabsContent>
                )}
              </Tabs>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
