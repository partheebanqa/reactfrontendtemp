import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiRequest } from "@/lib/queryClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  Plus, 
  Database, 
  Edit, 
  Trash2, 
  Copy,
  Search,
  Upload,
  Download,
  Globe,
  Key,
  FileText,
  Settings
} from "lucide-react";

interface Environment {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  variables: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
}

interface Variable {
  id: string;
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "secret";
  description?: string;
  environmentId?: string;
  isGlobal: boolean;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>[];
  format: "json" | "csv" | "xml";
  size: number;
  createdAt: string;
}

const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("environments");
  const [isCreateEnvOpen, setIsCreateEnvOpen] = useState(false);
  const [isCreateVarOpen, setIsCreateVarOpen] = useState(false);
  const [isCreateDatasetOpen, setIsCreateDatasetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newEnvironment, setNewEnvironment] = useState({
    name: "",
    description: "",
    baseUrl: "",
  });

  const [newVariable, setNewVariable] = useState({
    key: "",
    value: "",
    type: "string" as const,
    description: "",
    environmentId: "",
    isGlobal: true,
  });

  const [newDataset, setNewDataset] = useState({
    name: "",
    description: "",
    format: "json" as const,
  });

  // Mock data for demonstration
  const mockEnvironments: Environment[] = [
    {
      id: "1",
      name: "Development",
      description: "Development environment for testing",
      baseUrl: "https://api-dev.company.com",
      variables: {
        "api_version": "v1",
        "timeout": "5000",
        "retry_count": "3"
      },
      isDefault: true,
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      id: "2",
      name: "Staging",
      description: "Staging environment for pre-production testing",
      baseUrl: "https://api-staging.company.com",
      variables: {
        "api_version": "v1",
        "timeout": "3000",
        "retry_count": "2"
      },
      isDefault: false,
      createdAt: "2024-01-10T09:15:00Z"
    },
    {
      id: "3",
      name: "Production",
      description: "Production environment",
      baseUrl: "https://api.company.com",
      variables: {
        "api_version": "v1",
        "timeout": "10000",
        "retry_count": "5"
      },
      isDefault: false,
      createdAt: "2024-01-05T14:20:00Z"
    }
  ];

  const mockVariables: Variable[] = [
    {
      id: "1",
      key: "API_TOKEN",
      value: "••••••••••••••••",
      type: "secret",
      description: "Authentication token for API access",
      isGlobal: true
    },
    {
      id: "2",
      key: "USER_EMAIL",
      value: "test@example.com",
      type: "string",
      description: "Test user email for authentication flows",
      environmentId: "1",
      isGlobal: false
    },
    {
      id: "3",
      key: "MAX_RETRIES",
      value: "3",
      type: "number",
      description: "Maximum number of retry attempts",
      isGlobal: true
    },
    {
      id: "4",
      key: "DEBUG_MODE",
      value: "true",
      type: "boolean",
      description: "Enable debug logging",
      environmentId: "1",
      isGlobal: false
    }
  ];

  const mockDatasets: Dataset[] = [
    {
      id: "1",
      name: "User Test Data",
      description: "Sample user data for testing user-related APIs",
      data: [
        { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user" }
      ],
      format: "json",
      size: 2,
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      id: "2",
      name: "Product Catalog",
      description: "Product data for e-commerce testing",
      data: [
        { id: "PROD001", name: "Widget A", price: 29.99, category: "Electronics" },
        { id: "PROD002", name: "Widget B", price: 49.99, category: "Electronics" }
      ],
      format: "json",
      size: 2,
      createdAt: "2024-01-12T14:20:00Z"
    }
  ];

  const createEnvironmentMutation = useMutation({
    mutationFn: async (envData: typeof newEnvironment) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setIsCreateEnvOpen(false);
      setNewEnvironment({ name: "", description: "", baseUrl: "" });
      toast({
        title: "Environment created",
        description: "Your environment has been created successfully",
      });
    }
  });

  const createVariableMutation = useMutation({
    mutationFn: async (varData: typeof newVariable) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setIsCreateVarOpen(false);
      setNewVariable({
        key: "",
        value: "",
        type: "string",
        description: "",
        environmentId: "",
        isGlobal: true,
      });
      toast({
        title: "Variable created",
        description: "Your variable has been created successfully",
      });
    }
  });

  const createDatasetMutation = useMutation({
    mutationFn: async (datasetData: typeof newDataset) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setIsCreateDatasetOpen(false);
      setNewDataset({ name: "", description: "", format: "json" });
      toast({
        title: "Dataset created",
        description: "Your dataset has been created successfully",
      });
    }
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied`,
    });
  };

  const getVariableIcon = (type: string) => {
    switch (type) {
      case "secret":
        return <Key className="w-4 h-4 text-red-500" />;
      case "string":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "number":
        return <span className="text-purple-500 font-bold">#</span>;
      case "boolean":
        return <span className="text-green-500 font-bold">✓</span>;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <ProtectedRoute feature="data_management">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Data Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage environments, variables, and test datasets
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="environments">Environments</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="datasets">Test Data</TabsTrigger>
          </TabsList>

          {/* Environments Tab */}
          <TabsContent value="environments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Environments</h2>
              <Dialog open={isCreateEnvOpen} onOpenChange={setIsCreateEnvOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Environment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Environment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Environment Name</label>
                      <Input
                        placeholder="e.g., Development, Staging, Production"
                        value={newEnvironment.name}
                        onChange={(e) => setNewEnvironment(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe this environment"
                        value={newEnvironment.description}
                        onChange={(e) => setNewEnvironment(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Base URL</label>
                      <Input
                        placeholder="https://api.example.com"
                        value={newEnvironment.baseUrl}
                        onChange={(e) => setNewEnvironment(prev => ({ ...prev, baseUrl: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateEnvOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => createEnvironmentMutation.mutate(newEnvironment)}
                        disabled={!newEnvironment.name.trim() || createEnvironmentMutation.isPending}
                      >
                        Create Environment
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {mockEnvironments.map((env) => (
                <Card key={env.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Globe className="w-8 h-8 text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{env.name}</h3>
                            {env.isDefault && (
                              <Badge className="bg-green-100 text-green-700">Default</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{env.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">Base URL:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{env.baseUrl}</code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(env.baseUrl, "Base URL")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {Object.keys(env.variables).length} variables • Created {new Date(env.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Variables</h2>
              <Dialog open={isCreateVarOpen} onOpenChange={setIsCreateVarOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variable
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Variable</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Variable Key</label>
                      <Input
                        placeholder="e.g., API_TOKEN, BASE_URL"
                        value={newVariable.key}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, key: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Value</label>
                      <Input
                        placeholder="Enter variable value"
                        type={newVariable.type === "secret" ? "password" : "text"}
                        value={newVariable.value}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select 
                        value={newVariable.type} 
                        onValueChange={(value: any) => setNewVariable(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="secret">Secret</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Environment</label>
                      <Select 
                        value={newVariable.environmentId} 
                        onValueChange={(value) => setNewVariable(prev => ({ ...prev, environmentId: value, isGlobal: !value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment (or leave empty for global)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Global Variable</SelectItem>
                          {mockEnvironments.map(env => (
                            <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe this variable"
                        value={newVariable.description}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateVarOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => createVariableMutation.mutate(newVariable)}
                        disabled={!newVariable.key.trim() || createVariableMutation.isPending}
                      >
                        Create Variable
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {mockVariables.map((variable) => (
                <Card key={variable.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {getVariableIcon(variable.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-semibold">{variable.key}</h4>
                            <Badge variant={variable.isGlobal ? "default" : "outline"}>
                              {variable.isGlobal ? "Global" : mockEnvironments.find(e => e.id === variable.environmentId)?.name || "Environment"}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {variable.type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {variable.value}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(variable.type === "secret" ? "••••••••" : variable.value, "Variable value")}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {variable.description && (
                            <p className="text-xs text-muted-foreground">{variable.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Test Data Tab */}
          <TabsContent value="datasets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Test Datasets</h2>
              <Dialog open={isCreateDatasetOpen} onOpenChange={setIsCreateDatasetOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Dataset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Dataset</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Dataset Name</label>
                      <Input
                        placeholder="e.g., User Test Data, Product Catalog"
                        value={newDataset.name}
                        onChange={(e) => setNewDataset(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe this dataset"
                        value={newDataset.description}
                        onChange={(e) => setNewDataset(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Format</label>
                      <Select 
                        value={newDataset.format} 
                        onValueChange={(value: any) => setNewDataset(prev => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateDatasetOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => createDatasetMutation.mutate(newDataset)}
                        disabled={!newDataset.name.trim() || createDatasetMutation.isPending}
                      >
                        Create Dataset
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {mockDatasets.map((dataset) => (
                <Card key={dataset.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Database className="w-8 h-8 text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{dataset.name}</h3>
                            <Badge variant="outline" className="uppercase">
                              {dataset.format}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{dataset.description}</p>
                          
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              {dataset.size} records • Created {new Date(dataset.createdAt).toLocaleDateString()}
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs font-mono">
                                <pre>{JSON.stringify(dataset.data[0], null, 2).substring(0, 200)}...</pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default DataManagement;
