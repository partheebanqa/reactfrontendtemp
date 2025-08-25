import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Settings } from "lucide-react";
import { TestCaseSelectionModal } from "./TestCaseSelectionModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCcw } from "lucide-react";
import { useDataManagement } from "@/hooks/useDataManagement";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

interface Request {
  id: string;
  method: string;
  name: string;
  endpoint: string;
  description: string;
  testCases: {
    functional: number;
    total: number;
  };
  selectedTestCases?: string[];
}

interface RequestStat {
  requestId: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  lastGeneratedAt?: string;
  meta?: {
    totalTests?: number;
    selectedTests?: number;
  };
}



interface ManageRequestsProps {
  requests: Request[];
  testSuiteId: string;
  onImport: () => void;
  onDeleteRequest: (requestId: string) => void;
  onUpdateTestCases: (requestId: string, testCaseIds: string[]) => void;
  onRefreshRequests?: () => Promise<void> | void;
  requestStats?: RequestStat[]; 
}

const getMethodBadgeColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "POST":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "PUT":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "DELETE":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "PATCH":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

export const ManageRequests: React.FC<ManageRequestsProps> = ({
  requests,
  testSuiteId,
  onImport,
  onDeleteRequest,
  onUpdateTestCases,
  onRefreshRequests,
  requestStats = [],
}) => {
  const { variables, environments, activeEnvironment } = useDataManagement();

  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);


  // console.log(requests, "selectedRequest")

  const statMap = useMemo(() => {
    const m = new Map<string, RequestStat>();
    requestStats.forEach(s => m.set(s.requestId, s));
    return m;
  }, [requestStats]);

  const substituteVariables = (text: string): string => {
    let result = text;
    variables.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, "g");
      result = result.replace(regex, variable.initialValue);
    });
    return result;
  };

  const buildFinalUrl = (url: string): string => {
    if (!url) return "";
    let finalUrl = url;

    // Apply variable substitution
    finalUrl = substituteVariables(finalUrl);

    const baseUrVar =
      variables.find((v) => v.name === "baseUrl")?.initialValue || "";

    if (baseUrVar) {
      try {
        const originalUrl = new URL(finalUrl);
        const pathAndQuery =
          originalUrl.pathname + originalUrl.search + originalUrl.hash;

        // Combine activeEnvironment base URL with the path from original URL
        const baseUrl = baseUrVar.replace(/\/$/, "");
        finalUrl = `${baseUrl}${pathAndQuery}`;
      } catch (error) {
        if (
          !finalUrl.startsWith("http://") &&
          !finalUrl.startsWith("https://")
        ) {
          finalUrl = finalUrl.startsWith("/") ? finalUrl : `/${finalUrl}`;
          finalUrl = `${baseUrVar.replace(/\/$/, "")}${finalUrl}`;
        }
      }
    }
    return finalUrl;
  };

  const handleConfigureTestCases = (request: Request) => {
    setSelectedRequest(request);
    setIsTestCaseModalOpen(true);
  };

  const handleTestCaseSelection = (testCaseIds: string[]) => {
    if (selectedRequest) {
      onUpdateTestCases(selectedRequest.id, testCaseIds);
    }
    setIsTestCaseModalOpen(false);
    setSelectedRequest(null);
  };


  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Functional': return 'bg-blue-100 text-blue-800';
      case 'Performance': return 'bg-purple-100 text-purple-800';
      case 'Security': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Functional': return '🔧';
      case 'Performance': return '⚡';
      case 'Security': return '🛡️';
      default: return '📋';
    }
  };

  // console.log(requests, "requests");

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefreshRequests) return;
    try {
      setRefreshing(true);
      await onRefreshRequests();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Requests ({requests.length})</CardTitle>

          <div className="flex items-center space-x-2">
          <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" onClick={onImport}>
              <Download className="w-4 h-4 mr-2" />
              Import More Requests
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => {
            const finalUrl = buildFinalUrl(request.endpoint);
            const stat = statMap.get(request.id);
            const totalTests = stat?.meta?.totalTests ?? 0;
            const selectedCountFromServer = stat?.meta?.selectedTests ?? 0;
            const selectedCount = (request.selectedTestCases?.length ?? 0) || selectedCountFromServer;

            return (
              <div
                key={request.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Badge className={getMethodBadgeColor(request.method)}>
                      {request.method}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-base">{request.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {finalUrl}
                      </p>
                      {/* {request.description && (
                        <p className='text-sm text-muted-foreground mt-1'>
                          {request.description}
                        </p>
                      )} */}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfigureTestCases(request)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            {testSuiteId && <Settings className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Select testcases</TooltipContent>
                      </Tooltip>

                      {/* <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onDeleteRequest(request.id)}
                            className='text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete API</TooltipContent>
                      </Tooltip> */}

                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Delete API</TooltipContent>
                        </Tooltip>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this suite?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete “{request.name}”.
                              This action cannot be undo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button onClick={() => onDeleteRequest(request.id)}>
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TooltipProvider>
                  </div>
                </div>
                {testSuiteId && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">Test Cases</h5>
                   
                      {/* {(request.selectedTestCases?.length || 0) > 0 && (
                         <div className="flex items-center justify-between text-xs">
                         <div className="flex items-center">
                           <span className="mr-1">{getCategoryIcon('Functional')}</span>
                           <span className="capitalize text-gray-600">{'Functional'}</span>
                         </div>
                         <span className={`px-2 py-0.5 rounded-full font-medium ${getCategoryColor('Functional')}`}>
                         {request.selectedTestCases?.length || 0}
                         </span>
                       </div>
                      )} */}

{selectedCount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <span className="mr-1">{getCategoryIcon('Functional')}</span>
                          <span className="capitalize text-gray-600">{'Functional'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${getCategoryColor('Functional')}`}>
                          {selectedCount}
                        </span>
                      </div>
                    )}
                      <div className="pt-1 border-t border-gray-200 mt-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-700">Total:</span>
                    <span className="text-gray-900">   {totalTests ? <>  {totalTests}</> : null} test cases</span>
                  </div>
                  </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {selectedRequest && (
        <TestCaseSelectionModal
          isOpen={isTestCaseModalOpen}
          onClose={() => {
            setIsTestCaseModalOpen(false);
            setSelectedRequest(null);
          }}
          onSelect={handleTestCaseSelection}
          request={{
            ...selectedRequest,
            selectedTestCases: selectedRequest.selectedTestCases || [],
          }}
          testSuiteId={testSuiteId}
        />
      )}
    </Card>
  );
};
