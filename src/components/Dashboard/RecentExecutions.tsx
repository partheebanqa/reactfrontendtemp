import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useExecutions } from "@/hooks/use-api";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format, formatDistanceToNow } from "date-fns";

const getStatusIcon = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
      return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }
};

const getStatusVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'running':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function RecentExecutions() {
  const { currentWorkspace } = useWorkspace();
  const { data: executions = [], isLoading } = useExecutions(10, currentWorkspace?.id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Executions
          </div>
          <Badge variant="secondary">{executions?.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No executions yet</p>
            <p className="text-sm text-gray-400">Run a test suite to see executions here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {executions.map((execution: any) => (
              <div
                key={execution?.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(execution?.status)}
                  <div>
                    <h4 className="font-medium text-sm">
                      {execution.testSuite?.name || 'Unknown Test Suite'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {/* <span>{formatDistanceToNow(new Date(execution?.startTime), { addSuffix: true })}</span> */}
                      {execution?.duration && (
                        <span>• {execution?.duration}ms</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={getStatusVariant(execution?.status)}
                    className="text-xs"
                  >
                    {execution?.status}
                  </Badge>
                  {execution?.resultData && (
                    <div className="text-xs text-gray-500">
                      {execution.resultData.passed || 0}/{(execution?.resultData?.passed || 0) + (execution?.resultData?.failed || 0)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {executions.length >= 10 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View All Executions
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}