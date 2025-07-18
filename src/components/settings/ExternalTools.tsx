import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Wrench, Plus, MessageSquare, CheckCircle, Users, Bug, Webhook, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const integrationSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  type: z.enum(['slack', 'teams', 'jira', 'webhook'], {
    required_error: 'Please select an integration type',
  }),
  webhookUrl: z.string().url('Please enter a valid webhook URL'),
  description: z.string().optional(),
  settings: z.object({
    channel: z.string().optional(),
    username: z.string().optional(),
    events: z.array(z.string()).optional(),
  }).optional(),
});

type IntegrationFormData = z.infer<typeof integrationSchema>;

interface Integration {
  id: string;
  name: string;
  type: 'slack' | 'teams' | 'jira' | 'webhook';
  status: 'active' | 'inactive' | 'error';
  webhookUrl: string;
  description?: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
  settings?: {
    channel?: string;
    username?: string;
    events?: string[];
  };
}

export function ExternalTools() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: '',
      type: 'slack',
      webhookUrl: '',
      description: '',
      settings: {
        channel: '',
        username: '',
        events: [],
      },
    },
  });

  // Mock data
  const integrations: Integration[] = [
    {
      id: '1',
      name: 'Team Slack',
      type: 'slack',
      status: 'active',
      webhookUrl: 'https://hooks.slack.com/services/...',
      isActive: true,
      description: 'Notifications for API test results',
      createdAt: '2024-01-15',
      lastUsed: '2024-01-20',
      settings: {
        channel: '#api-testing',
        username: 'API Bot',
        events: ['test_failed', 'test_passed'],
      },
    },
    {
      id: '2',
      name: 'Development Teams',
      type: 'teams',
      status: 'active',
      webhookUrl: 'https://outlook.office.com/webhook/...',
      description: 'Development team notifications',
      createdAt: '2024-01-18',
      lastUsed: '2024-01-19',
      isActive: true,
      settings: {
        events: ['test_failed', 'schedule_complete'],
      },
    },
    {
      id: '3',
      name: 'Bug Tracker',
      type: 'jira',
      status: 'inactive',
      webhookUrl: 'https://your-domain.atlassian.net/...',
      description: 'Automatic issue creation for failed tests',
      createdAt: '2024-01-20',
      isActive: false,
      settings: {
        events: ['test_failed'],
      },
    },
  ];

  const availableEvents = [
    { value: 'test_passed', label: 'Test Passed' },
    { value: 'test_failed', label: 'Test Failed' },
    { value: 'schedule_complete', label: 'Schedule Complete' },
    { value: 'execution_started', label: 'Execution Started' },
    { value: 'workspace_updated', label: 'Workspace Updated' },
  ];

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'slack':
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'teams':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'jira':
        return <Bug className="h-5 w-5 text-blue-800" />;
      case 'webhook':
        return <Webhook className="h-5 w-5 text-gray-600" />;
      default:
        return <Wrench className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={`text-xs ${variants[status as keyof typeof variants]}`}>
        {status}
      </Badge>
    );
  };

  const onSubmit = (data: IntegrationFormData) => {
    console.log('Integration saved:', data);
    toast({
      title: editingIntegration ? 'Integration updated' : 'Integration created',
      description: `${data.name} has been ${editingIntegration ? 'updated' : 'created'} successfully.`,
    });
    
    setIsCreateDialogOpen(false);
    setEditingIntegration(null);
    form.reset();
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    form.setValue('name', integration.name);
    form.setValue('type', integration.type);
    form.setValue('webhookUrl', integration.webhookUrl);
    form.setValue('description', integration.description || '');
    form.setValue('settings', integration.settings || {});
  };

  const handleDelete = (integration: Integration) => {
    if (confirm(`Are you sure you want to delete "${integration.name}"? This action cannot be undone.`)) {
      toast({
        title: 'Integration deleted',
        description: `${integration.name} has been deleted.`,
      });
    }
  };

  const handleTest = (integration: Integration) => {
    toast({
      title: 'Testing integration',
      description: `Sending test message to ${integration.name}...`,
    });
    
    // Simulate test result
    setTimeout(() => {
      toast({
        title: 'Test successful',
        description: `Test message sent to ${integration.name} successfully.`,
      });
    }, 2000);
  };

  const handleToggleStatus = (integration: Integration) => {
    const newStatus = integration.isActive ? 'inactive' : 'active';
    toast({
      title: `Integration ${newStatus}`,
      description: `${integration.name} has been ${integration.isActive ? 'deactivated' : 'activated'}.`,
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
            <Wrench className="h-5 w-5" />
            External Tools
          </CardTitle>
          <Dialog open={isCreateDialogOpen || !!editingIntegration} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingIntegration(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingIntegration ? 'Edit Integration' : 'Add New Integration'}
                </DialogTitle>
                <DialogDescription>
                  Configure external tool integration to receive notifications and updates.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Integration Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Team Slack" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Integration Type</FormLabel>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          {...field}
                        >
                          <option value="slack">Slack</option>
                          <option value="teams">Microsoft Teams</option>
                          <option value="jira">Jira</option>
                          <option value="webhook">Custom Webhook</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://hooks.slack.com/services/..." 
                            {...field} 
                          />
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
                            placeholder="Description of this integration" 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Event Selection */}
                  <div className="space-y-3">
                    <FormLabel>Notification Events</FormLabel>
                    <div className="space-y-2">
                      {availableEvents.map((event) => (
                        <div key={event.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={event.value}
                            className="w-4 h-4 text-blue-600"
                            defaultChecked={event.value === 'test_failed'}
                          />
                          <label htmlFor={event.value} className="text-sm">
                            {event.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingIntegration(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingIntegration ? 'Update Integration' : 'Create Integration'}
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
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations configured</h3>
              <p className="text-gray-500 mb-4">Connect external tools to receive notifications.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>
          ) : (
            integrations.map((integration) => (
              <div
                key={integration.id}
                className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">
                        {getIntegrationIcon(integration.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{integration.name}</h3>
                          {getStatusBadge(integration.status)}
                        </div>
                        {integration.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{integration.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Mobile: Action buttons */}
                    <div className="flex items-center gap-2 sm:hidden">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={integration.isActive}
                          onCheckedChange={() => handleToggleStatus(integration)}
                        />
                        <span className="text-xs text-gray-600">
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(integration)}
                        className="px-2 py-1 text-xs"
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(integration)}
                        className="px-2 py-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(integration)}
                        className="text-red-600 hover:text-red-700 px-2 py-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Desktop: Action buttons */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={integration.isActive}
                          onCheckedChange={() => handleToggleStatus(integration)}
                        />
                        <span className="text-sm text-gray-600">
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(integration)}
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(integration)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(integration)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mobile: Integration details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t sm:hidden">
                    <div>
                      <span className="font-medium block">Type:</span>
                      <span>{integration.type.charAt(0).toUpperCase() + integration.type.slice(1)}</span>
                    </div>
                    <div>
                      <span className="font-medium block">Created:</span>
                      <span>{formatDate(integration.createdAt)}</span>
                    </div>
                    {integration.lastUsed && (
                      <div className="col-span-2">
                        <span className="font-medium">Last used:</span> {formatDate(integration.lastUsed)}
                      </div>
                    )}
                    {integration.settings?.events && (
                      <div className="col-span-2">
                        <span className="font-medium">Events:</span> {integration.settings.events.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Desktop: Integration details */}
                  <div className="hidden sm:block space-y-1 text-xs text-gray-500 pt-2 border-t">
                    <div>Type: {integration.type.charAt(0).toUpperCase() + integration.type.slice(1)}</div>
                    <div>Created: {formatDate(integration.createdAt)}</div>
                    {integration.lastUsed && (
                      <div>Last used: {formatDate(integration.lastUsed)}</div>
                    )}
                    {integration.settings?.events && (
                      <div>Events: {integration.settings.events.join(', ')}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Integration Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Supported Integrations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Slack:</strong> Send notifications to Slack channels</li>
            <li>• <strong>Microsoft Teams:</strong> Post messages to Teams channels</li>
            <li>• <strong>Jira:</strong> Create issues for failed tests automatically</li>
            <li>• <strong>Custom Webhook:</strong> Send data to any HTTP endpoint</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}