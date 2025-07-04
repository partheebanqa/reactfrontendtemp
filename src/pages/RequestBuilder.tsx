import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  FileText
} from "lucide-react";

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

const RequestBuilder: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json", enabled: true }
  ]);
  const [body, setBody] = useState("");
  const [tests, setTests] = useState<TestAssertion[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: projectData } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      
      // Simulate API request execution
      const enabledHeaders = headers
        .filter(h => h.enabled && h.key && h.value)
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

      // Mock response based on URL
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const mockResponse = {
        status: Math.random() > 0.2 ? 200 : 500,
        statusText: Math.random() > 0.2 ? "OK" : "Internal Server Error",
        headers: {
          "Content-Type": "application/json",
          "X-Response-Time": `${Math.round(100 + Math.random() * 400)}ms`
        },
        data: method === "GET" ? [
          { id: 1, name: "John Doe", email: "john@example.com" },
          { id: 2, name: "Jane Smith", email: "jane@example.com" }
        ] : { success: true, id: Date.now() },
        time: Math.round(100 + Math.random() * 400)
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
    }
  });

  const saveEndpointMutation = useMutation({
    mutationFn: async (endpointData: any) => {
      const projectId = projectData?.projects?.[0]?.id;
      if (!projectId) throw new Error("No project selected");

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
    }
  });

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const addTest = () => {
    setTests([...tests, { field: "", operator: "equals", expected: "" }]);
  };

  const updateTest = (index: number, field: keyof TestAssertion, value: string) => {
    const newTests = [...tests];
    newTests[index] = { ...newTests[index], [field]: value };
    setTests(newTests);
  };

  const removeTest = (index: number) => {
    setTests(tests.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const endpointData = {
      name: `${method} ${url.split('/').pop() || 'Endpoint'}`,
      method,
      url,
      headers: headers.filter(h => h.enabled && h.key && h.value)
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
      body: body || null,
    };

    saveEndpointMutation.mutate(endpointData);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request Builder</h1>
          <p className="text-muted-foreground mt-1">
            Build and test API requests with our visual interface
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSave} disabled={!url}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button 
            onClick={() => executeMutation.mutate()} 
            disabled={!url || isLoading}
          >
            {isLoading ? (
              <Clock className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Method and URL */}
              <div className="flex space-x-4">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_METHODS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://api.example.com/users"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Request Tabs */}
              <Tabs defaultValue="headers" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                </TabsList>

                <TabsContent value="headers" className="space-y-4">
                  <div className="space-y-3">
                    {headers.map((header, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Header name"
                          value={header.key}
                          onChange={(e) => updateHeader(index, "key", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Header value"
                          value={header.value}
                          onChange={(e) => updateHeader(index, "value", e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeHeader(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" onClick={addHeader} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Header
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="body" className="space-y-4">
                  <Textarea
                    placeholder="Request body (JSON, XML, etc.)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="font-mono"
                  />
                </TabsContent>

                <TabsContent value="auth" className="space-y-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select auth type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Auth</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="api-key">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>

                <TabsContent value="tests" className="space-y-4">
                  <div className="space-y-3">
                    {tests.map((test, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Field path"
                          value={test.field}
                          onChange={(e) => updateTest(index, "field", e.target.value)}
                          className="flex-1"
                        />
                        <Select 
                          value={test.operator} 
                          onValueChange={(value) => updateTest(index, "operator", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="greater">Greater than</SelectItem>
                            <SelectItem value="less">Less than</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Expected value"
                          value={test.expected}
                          onChange={(e) => updateTest(index, "expected", e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeTest(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" onClick={addTest} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Test
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Response Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Response
                {response && (
                  <div className="flex items-center space-x-2">
                    {response.status === 200 ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {response.status} {response.statusText}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {response.status} {response.statusText}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {response.time}ms
                    </Badge>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!response ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Send a request to see the response</p>
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="body" className="w-full">
                  <TabsList>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="tests">Test Results</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="body" className="mt-4">
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-64 font-mono">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                    <div className="flex justify-end mt-2">
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="headers" className="mt-4">
                    <div className="space-y-2">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tests" className="mt-4">
                    {tests.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No tests configured</p>
                        <p className="text-sm">Add tests in the request configuration</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tests.map((test, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-mono">
                              {test.field} {test.operator} {test.expected}
                            </span>
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Passed
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestBuilder;
