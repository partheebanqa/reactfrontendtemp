import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Search, Filter, Download, Eye, Calendar } from 'lucide-react';
import AuditViewerFilters from './AuditViewerFilters';
import PaginationControls from './PaginationControls';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AuditFilters {
  search: string;
  userId: string;
  action: string;
  resource: string;
  severity: string;
  dateRange: string;
}

export default function AuditViewer() {
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    userId: '',
    action: '',
    resource: '',
    severity: '',
    dateRange: '7d',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['/api/admin/audit-logs', filters, currentPage, pageSize],
    initialData: {
      logs: [
        {
          id: '1',
          timestamp: '2025-01-01T18:30:00Z',
          userId: 'user123',
          userEmail: 'john.smith@example.com',
          action: 'CREATE',
          resource: 'test_suite',
          resourceId: 'suite_456',
          ipAddress: '192.168.1.100',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          details: {
            testSuiteName: 'User Authentication Tests',
            testCount: 12,
          },
          severity: 'low' as const,
        },
        {
          id: '2',
          timestamp: '2025-01-01T18:25:00Z',
          userId: 'user456',
          userEmail: 'jane.smith@example.com',
          action: 'DELETE',
          resource: 'api_key',
          resourceId: 'key_789',
          ipAddress: '10.0.0.50',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          details: {
            keyName: 'Production API Key',
            reason: 'Key rotation',
          },
          severity: 'high' as const,
        },
        {
          id: '3',
          timestamp: '2025-01-01T18:20:00Z',
          userId: 'admin001',
          userEmail: 'admin@example.com',
          action: 'UPDATE',
          resource: 'user_permissions',
          resourceId: 'user123',
          ipAddress: '203.0.113.15',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          details: {
            permissionsAdded: ['admin_access'],
            permissionsRemoved: [],
          },
          severity: 'critical' as const,
        },
      ] as AuditLog[],
      total: 3,
      page: currentPage,
      pageSize: pageSize,
      totalPages: 1,
    },
  });

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'outline',
      high: 'destructive',
      critical: 'destructive',
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'outline'}>
        {severity}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    // Return appropriate icon based on action
    return <Shield className='h-4 w-4' />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportLogs = () => {};

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold'>Audit Logs</h1>
        <div className='animate-pulse space-y-4'>
          <div className='h-32 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
          <div className='h-64 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Audit Logs</h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Monitor user activities and system events
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className='mr-2 h-4 w-4' />
            Filters
          </Button>
          <Button variant='outline' onClick={exportLogs}>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Total Events
                </p>
                <p className='text-2xl font-bold'>{auditData?.total || 0}</p>
              </div>
              <Shield className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Critical Events
                </p>
                <p className='text-2xl font-bold text-red-500'>1</p>
              </div>
              <Shield className='h-8 w-8 text-red-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Active Users
                </p>
                <p className='text-2xl font-bold'>3</p>
              </div>
              <Shield className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Last 24h
                </p>
                <p className='text-2xl font-bold'>15</p>
              </div>
              <Calendar className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <AuditViewerFilters filters={filters} onFiltersChange={setFilters} />
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events</CardTitle>
          <CardDescription>
            Detailed view of all user activities and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData?.logs?.map((log: AuditLog) => (
                <TableRow key={log.id}>
                  <TableCell className='font-mono text-sm'>
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium'>{log.userEmail}</div>
                      <div className='text-sm text-gray-500'>{log.userId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {getActionIcon(log.action)}
                      <span className='font-medium'>{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium'>{log.resource}</div>
                      {log.resourceId && (
                        <div className='text-sm text-gray-500'>
                          {log.resourceId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className='font-mono text-sm'>
                    {log.ipAddress}
                  </TableCell>
                  <TableCell>
                    <Button variant='outline' size='sm'>
                      <Eye className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className='mt-4'>
            <PaginationControls
              currentPage={currentPage}
              totalPages={auditData?.totalPages || 1}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
