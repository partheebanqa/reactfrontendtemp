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
import { allGenerators, getGenerator } from "@/lib/dynamicVariables";
// import ProtectedRoute from "@/components/ProtectedRoute";
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
  Settings,
  Zap,
  Code2,
  Shield,
  Calendar,
  Wifi
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  type: "string" | "number" | "boolean" | "secret" | "environment" | "dynamic";
  description?: string;
  environmentId?: string;
  isGlobal: boolean;
  generatorFunction?: string; // Added property
  scope?: "global" | "project" | "environment"; // Added scope property
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

type VariableType = "static" | "dynamic" | "environment";


const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("environments");
  const [isCreateEnvOpen, setIsCreateEnvOpen] = useState(false);
  const [isCreateVarOpen, setIsCreateVarOpen] = useState(false);
  const [isCreateDatasetOpen, setIsCreateDatasetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
   const [editingEnvironment, setEditingEnvironment] = useState<any>(null);

   const [variableSearch, setVariableSearch] = useState("");
   const [environmentFilter, setEnvironmentFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState("all");
    const [isEditEnvOpen, setIsEditEnvOpen] = useState(false);
    const [isEditVarOpen, setIsEditVarOpen] = useState(false);
const [editingVariable, setEditingVariable] = useState<Variable | null>(null);


  const [newEnvironment, setNewEnvironment] = useState({
    name: "",
    description: "",
    baseUrl: "",
  });

  const [newVariable, setNewVariable] = useState({
    key: "",
    value: "",
    type: "" as VariableType,
    generatorFunction: "",
    generatorConfig: {} as Record<string, any>,
    description: "",
    environmentId: "",
    scope: "global" as const,
    isGlobal: true,
    isSecret: false,
  });

  const [newDataset, setNewDataset] = useState({
    name: "",
    description: "",
    format: "json" as const,
  });

  // Mock data for demonstration
  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: "1",
      name: "Development",
      description: "Development environment for testing",
      baseUrl: "https://api-dev.company.com",
      variables: {
        api_version: "v1",
        timeout: "5000",
        retry_count: "3",
      },
      isDefault: true,
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Staging",
      description: "Staging environment for pre-production testing",
      baseUrl: "https://api-staging.company.com",
      variables: {
        api_version: "v1",
        timeout: "3000",
        retry_count: "2",
      },
      isDefault: false,
      createdAt: "2024-01-10T09:15:00Z",
    },
    {
      id: "3",
      name: "Production",
      description: "Production environment",
      baseUrl: "https://api.company.com",
      variables: {
        api_version: "v1",
        timeout: "10000",
        retry_count: "5",
      },
      isDefault: false,
      createdAt: "2024-01-05T14:20:00Z",
    },
  ]);

  const [variables, setVariables] = useState<Variable[]>([
    {
      id: "1",
      key: "API_TOKEN",
      value: "••••••••••••••••",
      type: "secret",
      description: "Authentication token for API access",
      isGlobal: true,
    },
    {
      id: "2",
      key: "USER_EMAIL",
      value: "test@example.com",
      type: "string",
      description: "Test user email for authentication flows",
      environmentId: "1",
      isGlobal: false,
    },
    {
      id: "3",
      key: "MAX_RETRIES",
      value: "3",
      type: "number",
      description: "Maximum number of retry attempts",
      isGlobal: true,
    },
    {
      id: "4",
      key: "DEBUG_MODE",
      value: "true",
      type: "boolean",
      description: "Enable debug logging",
      environmentId: "1",
      isGlobal: false,
    },
  ]);

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
        variant: 'success',
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
        type: "static", 
        generatorFunction: "",
        generatorConfig: {},
        description: "",
        environmentId: "",
        scope: "global",
        isGlobal: true,
        isSecret: false,
      });
      toast({
        title: "Variable created",
        description: "Your variable has been created successfully",
        variant: "success", // optional: use variant if you’ve styled for it
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
        variant: 'success',
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
  const handleDeleteEnv = (id: string, label: string) => {
    setEnvironments((prev) => prev.filter((env) => env.id !== id));
    toast({
      title: 'Environment Deleted',
      description: `${label} has been deleted`,
      variant: 'destructive',
    });
  };


  const handleDeleteVariable = (id: string, label: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
    toast({
      title: 'Variable Deleted',
      description: `${label} has been deleted`,
      variant: 'destructive',
    });
  };

  return (
    // <ProtectedRoute feature="data_management">
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="environments">Environments</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            {/* <TabsTrigger value="datasets">Test Data</TabsTrigger> */}
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
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Environment Name</label>
                      <Input
                        placeholder="e.g., Development, Staging, Production"
                        value={newEnvironment.name}
                        onChange={(e) => setNewEnvironment(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe this environment"
                        value={newEnvironment.description}
                        onChange={(e) => setNewEnvironment(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
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
              {environments.map((env) => (
                <Card key={env.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
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
                        <Button variant="outline" size="sm"
                           onClick={() => {
                            setEditingEnvironment(env);
                            setNewEnvironment({
                              name: env.name,
                              description: env.description,
                              baseUrl: env.baseUrl
                            });
                            setIsEditEnvOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm"
                      onClick={() => handleDeleteEnv(env.id, env.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
                        {/* Edit Environment Dialog */}
                        <Dialog open={isEditEnvOpen} onOpenChange={setIsEditEnvOpen}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Environment</DialogTitle>
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
                                <Button variant="outline" onClick={() => {
                                  setIsEditEnvOpen(false);
                                  setEditingEnvironment(null);
                                }}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => {
                                    toast({
                                      title: "Environment Updated",
                                      description: `${newEnvironment.name} has been updated successfully.`,
                                      variant: 'success',

                                    });
                                    setIsEditEnvOpen(false);
                                    setEditingEnvironment(null);
                                  }}
                                  disabled={!newEnvironment.name.trim()}
                                >
                                  Update Environment
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-4">   
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-xl font-semibold">Variables</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search variables..."
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                {/* Environment Filter */}
                <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                    {environments.map(env => (
                      <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold"></h2>
              <Dialog open={isCreateVarOpen} onOpenChange={setIsCreateVarOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variable
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Variable</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Variable Name</label>
                      <Input
                        placeholder="e.g., USER_ID, API_TOKEN"
                        value={newVariable.key}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use in requests as: <code>{'{{' + newVariable.key + '}}'}</code>
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Variable Type</label>
                      <Select 
                        value={newVariable.type} 
                        onValueChange={(value: any) => setNewVariable(prev => ({ 
                          ...prev, 
                          type: value, 
                          value: value === 'static' ? prev.value : '',
                          generatorFunction: value === 'dynamic' ? prev.generatorFunction : ''
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="static">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Static Variable</div>
                                <div className="text-xs text-muted-foreground">Fixed value that doesn't change</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="dynamic">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Dynamic Variable</div>
                                <div className="text-xs text-muted-foreground">Generated at runtime</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="environment">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Environment Variable</div>
                                <div className="text-xs text-muted-foreground">From system environment</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Static Variable Value */}
                    {newVariable.type === 'static' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Static Value</label>
                          <Input
                            placeholder="Enter fixed value"
                            type={newVariable.isSecret ? "password" : "text"}
                            value={newVariable.value}
                            onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            This value will remain constant for all requests
                          </p>
                        </div>
                        
                        {/* Secret Toggle */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="secret-toggle"
                            checked={newVariable.isSecret}
                            onCheckedChange={(checked) => setNewVariable(prev => ({ ...prev, isSecret: checked }))}
                          />
                          <label htmlFor="secret-toggle" className="text-sm font-medium cursor-pointer">
                            Mark as secret variable
                          </label>
                        </div>
                        {newVariable.isSecret && (
                          <p className="text-xs text-orange-600 dark:text-orange-400">
                            Secret variables will be hidden in the UI and logs for security
                          </p>
                        )}
                      </div>
                    )}

                    {/* Dynamic Variable Generator */}
                    {newVariable?.type === 'dynamic' && (
                      <div className="space-y-4">
                        <div className="space-y-1" >
                          <label className="text-sm font-medium">Generator Function</label>
                          <Select 
                            value={newVariable.generatorFunction} 
                            onValueChange={(value) => setNewVariable(prev => ({ ...prev, generatorFunction: value, generatorConfig: {} }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a generator function" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {/* Group by category */}
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Basic</div>
                              {allGenerators.filter(g => g.category === 'basic').map(generator => (
                                <SelectItem key={generator.name} value={generator.name}>
                                  <div className="flex items-center gap-2">
                                    <Code2 className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{generator.label}</div>
                                      <div className="text-xs text-muted-foreground">{generator.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                              
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">Random Data</div>
                              {allGenerators.filter(g => g.category === 'random').map(generator => (
                                <SelectItem key={generator.name} value={generator.name}>
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{generator.label}</div>
                                      <div className="text-xs text-muted-foreground">{generator.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                              
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">Authentication</div>
                              {allGenerators.filter(g => g.category === 'auth').map(generator => (
                                <SelectItem key={generator.name} value={generator.name}>
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{generator.label}</div>
                                      <div className="text-xs text-muted-foreground">{generator.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                              
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">Date & Time</div>
                              {allGenerators.filter(g => g.category === 'date').map(generator => (
                                <SelectItem key={generator.name} value={generator.name}>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{generator.label}</div>
                                      <div className="text-xs text-muted-foreground">{generator.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                              
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">Network</div>
                              {allGenerators.filter(g => g.category === 'network').map(generator => (
                                <SelectItem key={generator.name} value={generator.name}>
                                  <div className="flex items-center gap-2">
                                    <Wifi className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{generator.label}</div>
                                      <div className="text-xs text-muted-foreground">{generator.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Generator Configuration */}
                        {newVariable.generatorFunction && (() => {
                          const generator = getGenerator(newVariable.generatorFunction);
                          return generator?.configSchema ? (
                            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                              <div className="text-sm font-medium">Generator Configuration</div>
                              {Object.entries(generator.configSchema).map(([key, schema]: [string, any]) => (
                                <div key={key} className="space-y-1">
                                  <label className="text-xs font-medium capitalize">{key.replace(/_/g, ' ')}</label>
                                  <Input
                                    type={schema.type}
                                    placeholder={schema.default?.toString() || ''}
                                    value={newVariable.generatorConfig[key] || schema.default || ''}
                                    onChange={(e) => {
                                      const value = schema.type === 'number' ? parseInt(e.target.value) || schema.default : e.target.value;
                                      setNewVariable(prev => ({
                                        ...prev,
                                        generatorConfig: { ...prev.generatorConfig, [key]: value }
                                      }));
                                    }}
                                    min={schema.min}
                                    max={schema.max}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        {/* Preview */}
                        {newVariable.generatorFunction && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Preview</div>
                            <div className="text-sm font-mono text-blue-800 dark:text-blue-200">
                              {(() => {
                                try {
                                  const generator = getGenerator(newVariable.generatorFunction);
                                  if (generator) {
                                    const preview = generator.generate(newVariable.generatorConfig);
                                    return String(preview);
                                  }
                                  return 'Invalid generator';
                                } catch (error) {
                                  return 'Error generating preview';
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Environment Variable */}
                    {newVariable.type === 'environment' && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Environment Variable Key</label>
                        <Input
                          placeholder="e.g., API_BASE_URL, DATABASE_URL"
                          value={newVariable.value}
                          onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This will read the value from your system environment variables
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Scope</label>
                      <Select 
                        value={newVariable.scope} 
                        onValueChange={(value: any) => setNewVariable(prev => ({ ...prev, scope: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global (All Projects)</SelectItem>
                          <SelectItem value="project">Project Specific</SelectItem>
                          <SelectItem value="environment">Environment Specific</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe when and how this variable should be used"
                        value={newVariable.description}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setIsCreateVarOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => createVariableMutation.mutate(newVariable)}
                        disabled={!newVariable.key.trim() || createVariableMutation.isPending}
                      >
                        {createVariableMutation.isPending ? 'Creating...' : 'Create Variable'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {variables.map((variable) => (
                <Card key={variable.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {getVariableIcon(variable.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-semibold">{variable.key}</h4>
                            <Badge variant={variable.isGlobal ? "default" : "outline"}>
                              {variable.isGlobal ? "Global" : environments.find(e => e.id === variable.environmentId)?.name || "Environment"}
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
                        <Button variant="outline" size="sm"
                          onClick={() => {
                            setEditingVariable(variable); 
                            setIsEditVarOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm"
                         onClick={() => handleDeleteVariable(variable.id, variable.key)}
                         >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Dialog open={isEditVarOpen} onOpenChange={setIsEditVarOpen}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Edit Variable</DialogTitle>
    </DialogHeader>

    {editingVariable && (
      <div className="space-y-4">
        {/* Variable Key */}
        <div>
          <label className="text-sm font-medium">Variable Key</label>
          <Input
            value={editingVariable.key}
            onChange={(e) =>
              setEditingVariable((prev) => prev && { ...prev, key: e.target.value })
            }
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-sm font-medium">Variable Type</label>
          <Select
            value={editingVariable.type}
            onValueChange={(value) =>
              setEditingVariable((prev) => prev && { ...prev, type: value as "string" | "number" | "boolean" | "secret" | "environment" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="dynamic">Dynamic</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Value */}
        {editingVariable.type === "string" && (
          <div>
            <label className="text-sm font-medium">Static Value</label>
            <Input
              value={editingVariable.value}
              onChange={(e) =>
                setEditingVariable((prev) => prev && { ...prev, value: e.target.value })
              }
            />
          </div>
        )}

        {editingVariable.type === "environment" && (
          <div>
            <label className="text-sm font-medium">Environment Variable Key</label>
            <Input
              value={editingVariable.value}
              onChange={(e) =>
                setEditingVariable((prev) => prev && { ...prev, value: e.target.value })
              }
            />
          </div>
        )}

        {/* Generator function for dynamic */}
        {editingVariable.type === "dynamic" && (
          <>
            <div>
              <label className="text-sm font-medium">Generator Function</label>
              <Input
                value={editingVariable.generatorFunction}
                onChange={(e) =>
                  setEditingVariable((prev) =>
                    prev && { ...prev, generatorFunction: e.target.value }
                  )
                }
              />
            </div>
            {/* You can reuse your generatorConfig UI here too */}
          </>
        )}

        {/* Scope */}
        <div>
          <label className="text-sm font-medium">Scope</label>
          <Select
            value={editingVariable.scope}
            onValueChange={(value) =>
              setEditingVariable((prev) => prev && { ...prev, scope: value as "environment" | "global" | "project" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={editingVariable.description}
            onChange={(e) =>
              setEditingVariable((prev) => prev && { ...prev, description: e.target.value })
            }
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditVarOpen(false);
              setEditingVariable(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // TODO: Handle API update mutation here
              toast({
                title: "Variable Updated",
                description: `${editingVariable.key} has been updated successfully.`,
              });
              setIsEditVarOpen(false);
              setEditingVariable(null);
            }}
            disabled={!editingVariable.key.trim()}
          >
            Update Variable
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

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
    // </ProtectedRoute>
  );
};

export default DataManagement;
