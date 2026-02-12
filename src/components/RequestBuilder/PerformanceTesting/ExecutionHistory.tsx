import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExecutionResult } from '@/models/performanceTest.model';

interface ExecutionHistoryProps {
  history: ExecutionResult[];
  isLoading: boolean;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    label: 'Success',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600',
  },
  partial: {
    icon: AlertCircle,
    label: 'Partial',
    variant: 'secondary' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600',
  },
};

export function ExecutionHistory({ history, isLoading }: ExecutionHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Loading execution history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>No executions found for this configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p>Run a test to see execution history</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  console.log(history, "history");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution History</CardTitle>
        <CardDescription>Last {history.length} execution results</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {history.map((execution) => {
              const statusInfo = statusConfig[execution.status];
              const StatusIcon = statusInfo.icon;
              const successRate = ((execution.successfulRequests / execution.totalRequests) * 100).toFixed(1);

              return (
                <Card key={execution.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={statusInfo.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(execution.startTime), 'PPp')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold text-lg">{successRate}%</div>
                        <div className="text-muted-foreground text-xs">Success Rate</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Total Requests</div>
                        <div className="text-sm font-medium">{execution.totalRequests.toLocaleString()}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Successful
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {execution.successfulRequests.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          Failed
                        </div>
                        <div className="text-sm font-medium text-red-600">
                          {execution.failedRequests.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Throughput
                        </div>
                        <div className="text-sm font-medium">{execution.throughput} req/s</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Avg Response
                        </div>
                        <div className="text-sm font-medium">{execution.averageResponseTime}ms</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Min Response</div>
                        <div className="text-sm font-medium text-green-600">{execution.minResponseTime}ms</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Max Response</div>
                        <div className="text-sm font-medium text-red-600">{execution.maxResponseTime}ms</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Duration: {format(new Date(execution.startTime), 'HH:mm:ss')} -{' '}
                        {format(new Date(execution.endTime), 'HH:mm:ss')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
