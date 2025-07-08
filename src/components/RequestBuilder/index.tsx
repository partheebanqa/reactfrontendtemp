import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiRequest } from "@/lib/queryClient";
import { API_METHODS } from "@/lib/constants";
import {
  Play,
  Plus,
  Save,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Code,
  FileText,
} from "lucide-react";
import CollectionsSidebar from "./CollectionsSidebar";
import { useRequestBuilder } from "@/hooks/useRequestBuilder";
import { addCollection } from "@/service/request-builder.service";
import { Collection, CollectionRequest } from "@/shared/types/collection";
import RequestPanel from "./RequestPanel";
import { processVariables } from "@/lib/variableProcessor";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface TestAssertion {
  field: string;
  operator: string;
  expected: string;
}

const RequestBuilder = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();

  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState("");
  const [tests, setTests] = useState<TestAssertion[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const {
    collectionList,
    addCollectionMutation,
    activeRequest,
    setActiveRequest,
  } = useRequestBuilder();

  const handleCollectionCreate = (collection: any) => {
    addCollectionMutation.mutate({
      ...collection,
      workspaceId: currentWorkspace?.id,
    });
  };

  const executeMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);

      // Simulate API request execution
      const enabledHeaders = headers
        .filter((h) => h.enabled && h.key && h.value)
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

      // Mock response based on URL
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      const mockResponse = {
        status: Math.random() > 0.2 ? 200 : 500,
        statusText: Math.random() > 0.2 ? "OK" : "Internal Server Error",
        headers: {
          "Content-Type": "application/json",
          "X-Response-Time": `${Math.round(100 + Math.random() * 400)}ms`,
        },
        data:
          method === "GET"
            ? [
                { id: 1, name: "John Doe", email: "john@example.com" },
                { id: 2, name: "Jane Smith", email: "jane@example.com" },
              ]
            : { success: true, id: Date.now() },
        time: Math.round(100 + Math.random() * 400),
      };

      return mockResponse;
    },
    onSuccess: (data) => {
      setResponse(data);
      setIsLoading(false);
      toast({
        title: "Request executed successfully",
        description: `Response time: ${data.time}ms`,
      });
    },
    onError: (error) => {
      setIsLoading(false);
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveEndpointMutation = useMutation({
    mutationFn: async (endpointData: any) => {
      const projectId = currentWorkspace?.id;

      return await apiRequest("POST", "/api/endpoints", {
        ...endpointData,
        projectId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Endpoint saved",
        description: "Your API endpoint has been saved successfully",
      });
    },
  });

  const handleCollectionUpdate = (collection: Collection) => {
    // setCollections((prev) =>
    //   prev.map((c) => (c.id === collection.id ? collection : c))
    // );
  };
  const [loading, setLoading] = useState(false);
  
  const handleSend = async () => {
    setLoading(true);
    try {
      const storedDataRepoVars = localStorage.getItem("dataRepoVariables");
      const dataRepoVariables = storedDataRepoVars
        ? JSON.parse(storedDataRepoVars)
        : [];

      const processedUrl = processVariables(
        activeRequest.url,
        {},
        dataRepoVariables
      );

      const processedHeaders = Object.entries(activeRequest.headers).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: processVariables(value, {}, dataRepoVariables),
        }),
        {}
      );

      const processedParams = Object.entries(activeRequest.params).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: processVariables(value, {}, dataRepoVariables),
        }),
        {}
      );

      const body = prepareRequestBody({
        method: activeRequest.method,
        body: activeRequest.bodyFormData ? activeRequest.bodyFormData : "",
        // isGraphQL: activeRequest.isGraphQL,
        // graphQLQuery: processVariables(
        //   activeRequest.graphQLQuery || "",
        //   {},
        //   dataRepoVariables
        // ),
        // graphQLVariables: processVariables(
        //   activeRequest.graphQLVariables || "",
        //   {},
        //   dataRepoVariables
        // ),
      });

      const url = createUrlWithParams(processedUrl, processedParams);

      const options = prepareRequestOptions(
        activeRequest.method,
        processedHeaders,
        body,
        // activeRequest.isGraphQL
      );

      const startTime = performance.now();
      const response = await fetchWithTimeout(url, options);
      const endTime = performance.now();
      const responseTime = (endTime - startTime) / 1000;

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const responseObj: Response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        data,
        // responseTime,
      };

      // if (activeRequest.assertions) {
      //   responseObj.assertions = validateResponse(
      //     responseObj,
      //     activeRequest.assertions
      //   );
      // }

      setResponse(responseObj);
    } catch (error: any) {
      console.error("Request error:", error);

      let errorResponse: Response;
      if (error instanceof RequestError) {
        errorResponse = {
          status: error.status || 0,
          statusText: error.statusText || "Error",
          headers: error.response
            ? Object.fromEntries(error.response.headers)
            : {},
          data: null,
          error: error.message,
          errorDetails: {
            message: error.message,
            code: error.status?.toString(),
          },
        };
      } else {
        errorResponse = {
          status: 0,
          statusText: "Error",
          headers: {},
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }

      setResponse(errorResponse);
    }


    setLoading(false);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <CollectionsSidebar currentRequest={activeRequest} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <RequestPanel
          request={activeRequest}
          setRequest={setActiveRequest}
          onSend={handleSend}
          loading={loading}
          response={response}
        />
      </div>
    </div>
  );
};

export default RequestBuilder;
