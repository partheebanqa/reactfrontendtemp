import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Globe, Lock, Edit, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const environmentSchema = z.object({
  name: z.string().min(1, 'Environment name is required'),
  description: z.string().optional(),
  baseUrl: z.string().url('Please enter a valid URL'),
  workspaceId: z.string().min(1, 'Please select a workspace'),
  variables: z.array(z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string(),
    isSecret: z.boolean().default(false),
  })).optional(),
});

type EnvironmentFormData = z.infer<typeof environmentSchema>;

interface Environment {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  workspaceId: string;
  workspaceName: string;
  variableCount: number;
  secretCount: number;
  createdAt: string;
  isDefault?: boolean;
  isActive: boolean;
}

interface Variable {
  key: string;
  value: string;
  isSecret: boolean;
}

export function EnvironmentManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [variables, setVariables] = useState<Variable[]>([{ key: '', value: '', isSecret: false }]);

  const form = useForm<EnvironmentFormData>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      name: '',
      description: '',
      baseUrl: '',
      workspaceId: '',
      variables: [],
    },
  });

  // Mock data
  const workspaces = [
    { id: 'workspace-1', name: 'Default Workspace' },
    { id: 'workspace-2', name: 'Development Team' },
    { id: 'workspace-3', name: 'QA Testing' },
  ];

  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: '1',
      name: 'Development',
      description: 'Development environment for testing',
      baseUrl: 'https://dev-api.example.com',
      workspaceId: 'workspace-1',
      workspaceName: 'Default Workspace',
      variableCount: 5,
      secretCount: 2,
      createdAt: '2024-01-15',
      isDefault: true,
      isActive: true,
    },
    {
      id: '2',
      name: 'Staging',
      description: 'Staging environment for pre-production testing',
      baseUrl: 'https://staging-api.example.com',
      workspaceId: 'workspace-1',
      workspaceName: 'Default Workspace',
      variableCount: 8,
      secretCount: 3,
      createdAt: '2024-01-18',
      isActive: false,
    },
    {
      id: '3',
      name: 'Production',
      description: 'Production environment',
      baseUrl: 'https://api.example.com',
      workspaceId: 'workspace-2',
      workspaceName: 'Development Team',
      variableCount: 12,
      secretCount: 6,
      createdAt: '2024-01-20',
      isActive: true,
    },
  ]);

  const addVariable = () => {
    setVariables([...variables, { key: '', value: '', isSecret: false }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: keyof Variable, value: any) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const onSubmit = (data: EnvironmentFormData) => {
    const environmentData = {
      ...data,
      variables: variables.filter(v => v.key.trim() !== ''),
    };
    
    console.log('Environment saved:', environmentData);
    toast({
      title: editingEnvironment ? 'Environment updated' : 'Environment created',
      description: `Environment "${data.name}" has been ${editingEnvironment ? 'updated' : 'created'} successfully.`,
    });
    
    setIsCreateDialogOpen(false);
    setEditingEnvironment(null);
    form.reset();
    setVariables([{ key: '', value: '', isSecret: false }]);
  };

  const handleEdit = (environment: Environment) => {
    setEditingEnvironment(environment);
    form.setValue('name', environment.name);
    form.setValue('description', environment.description || '');
    form.setValue('baseUrl', environment.baseUrl);
    form.setValue('workspaceId', environment.workspaceId);
    // Mock variables for editing
    setVariables([
      { key: 'API_KEY', value: 'sk-1234...', isSecret: true },
      { key: 'BASE_PATH', value: '/api/v1', isSecret: false },
      { key: 'TIMEOUT', value: '30000', isSecret: false },
    ]);
  };

  const handleDelete = (environment: Environment) => {
    if (environment.isDefault) {
      toast({
        title: 'Cannot delete default environment',
        description: 'The default environment cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${environment.name}"? This action cannot be undone.`)) {
      toast({
        title: 'Environment deleted',
        description: `Environment "${environment.name}" has been deleted.`,
      });
    }
  };

  const handleToggleActive = (environment: Environment) => {
    const newStatus = !environment.isActive;
    setEnvironments(envs => 
      envs.map(env => 
        env.id === environment.id 
          ? { ...env, isActive: newStatus }
          : env
      )
    );
    toast({
      title: `Environment ${newStatus ? 'activated' : 'deactivated'}`,
      description: `${environment.name} is now ${newStatus ? 'active' : 'inactive'}.`,
    });
  };

  const handleDuplicate = (environment: Environment) => {
    const duplicatedEnv: Environment = {
      ...environment,
      id: `${environment.id}-copy-${Date.now()}`,
      name: `${environment.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setEnvironments(envs => [...envs, duplicatedEnv]);
    toast({
      title: 'Environment duplicated',
      description: `A copy of "${environment.name}" has been created.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Environments
          </CardTitle>
          <Dialog open={isCreateDialogOpen || !!editingEnvironment} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingEnvironment(null);
              form.reset();
              setVariables([{ key: '', value: '', isSecret: false }]);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Environment
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEnvironment ? 'Edit Environment' : 'Create New Environment'}
                </DialogTitle>
                <DialogDescription>
                  Configure environment settings and variables for your API tests.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Environment Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Development" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="workspaceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workspace</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select workspace" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workspaces.map((workspace) => (
                                <SelectItem key={workspace.id} value={workspace.id}>
                                  {workspace.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Environment description" 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Environment Variables */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Environment Variables</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Variable
                      </Button>
                    </div>
                    
                    {variables.map((variable, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-4">
                          <Input
                            placeholder="Variable key"
                            value={variable.key}
                            onChange={(e) => updateVariable(index, 'key', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="md:col-span-5">
                          <Input
                            type={variable.isSecret ? 'password' : 'text'}
                            placeholder="Variable value"
                            value={variable.value}
                            onChange={(e) => updateVariable(index, 'value', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={variable.isSecret}
                              onChange={(e) => updateVariable(index, 'isSecret', e.target.checked)}
                              className="w-3 h-3"
                            />
                            Secret
                          </label>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeVariable(index)}
                            disabled={variables.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingEnvironment(null);
                        form.reset();
                        setVariables([{ key: '', value: '', isSecret: false }]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingEnvironment ? 'Update Environment' : 'Create Environment'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {environments.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No environments found</h3>
              <p className="text-gray-500 mb-4">Create your first environment to get started.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Environment
              </Button>
            </div>
          ) : (
            environments.map((environment) => (
              <div
                key={environment.id}
                className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{environment.name}</h3>
                        {environment.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        <Badge 
                          variant={environment.isActive ? "default" : "secondary"} 
                          className={`text-xs ${environment.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {environment.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {environment.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{environment.description}</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-600 truncate">{environment.baseUrl}</span>
                      </div>
                    </div>
                    
                    {/* Mobile: Action buttons */}
                    <div className="flex items-center gap-2 sm:hidden">
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={environment.isActive}
                          onCheckedChange={() => handleToggleActive(environment)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(environment)}
                        className="px-2 py-1"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEnvironment(environment)}
                        className="px-2 py-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!environment.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(environment)}
                          className="text-red-600 hover:text-red-700 px-2 py-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Desktop: Action buttons */}
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={environment.isActive}
                          onCheckedChange={() => handleToggleActive(environment)}
                          className="data-[state=checked]:bg-green-600"
                        />
                        <span className="text-sm text-gray-600">
                          {environment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(environment)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEnvironment(environment)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {!environment.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(environment)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile: Environment details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 pt-2 border-t sm:hidden">
                    <div>
                      <span className="font-medium block">Workspace:</span>
                      <span className="truncate">{environment.workspaceName}</span>
                    </div>
                    <div>
                      <span className="font-medium block">{environment.variableCount}</span>
                      <span>variables</span>
                    </div>
                    <div>
                      <span className="font-medium block">{environment.secretCount}</span>
                      <span>secrets</span>
                    </div>
                    <div>
                      <span className="font-medium block">Created:</span>
                      <span>{formatDate(environment.createdAt)}</span>
                    </div>
                  </div>

                  {/* Desktop: Environment details */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                    <span>Workspace: {environment.workspaceName}</span>
                    <span>{environment.variableCount} variables</span>
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {environment.secretCount} secrets
                    </span>
                    <span>Created {formatDate(environment.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Environment Usage Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Environment Usage</h4>
          <p className="text-sm text-blue-800">
            Environments allow you to manage different API endpoints and configurations for development, 
            staging, and production. Variables can be used in your requests using variable_name syntax.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}