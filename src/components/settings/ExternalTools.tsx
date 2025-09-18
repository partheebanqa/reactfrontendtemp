import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Wrench,
  Plus,
  MessageSquare,
  Users,
  Bug,
  Webhook,
  Edit,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { createWorkSpaceIntegration, deleteWorkSpaceIntegration, getWorkSpaceIntegrations, toggleWorkSpaceIntegrationStatus, updateWorkSpaceIntegration } from '@/services/integrationTools.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useCurrentPlan } from '@/context/CurrentPlanContext';



const integrationSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  type: z.enum(['slack', 'teams', 'jira', 'webhook'], {
    required_error: 'Please select an integration type',
  }),
  webhookUrl: z.string().url('Please enter a valid webhook URL'),
  description: z.string().optional(),
  settings: z
    .object({
      channel: z.string().optional(),
      username: z.string().optional(),
      events: z.array(z.string()).optional(),
    })
    .optional(),
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


interface IntegrationConfig {
  channel: string;
  webhook_url: string;
}

export interface WorkSpaceIntegration {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  status: string;
  webhookUrl: string;
  description: string;
  config: IntegrationConfig;
  events: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface IntegrationPayload {
  name: string;
  type: string;
  description?: string;
  config: {
    webhook_url: string;
    channel: string;
  };
  events: string[];
}


export function ExternalTools() {

  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<WorkSpaceIntegration | null>(null);
  const [integrations, setIntegrations] = useState<WorkSpaceIntegration[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;


  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    type: 'slack',
    description: '',
    config: {
      webhook_url: '',
      channel: '#general',
    },
    events: [] as string[],
  });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('config.')) {
      const key = name.split('.')[1];
      setIntegrationForm((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          [key]: value,
        },
      }));
    } else {
      setIntegrationForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  const handleEventChange = (eventValue: string, checked: boolean) => {
    setIntegrationForm((prev) => ({
      ...prev,
      events: checked
        ? [...prev.events, eventValue]
        : prev.events.filter((v) => v !== eventValue),
    }));
  };





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
        return <MessageSquare className='h-5 w-5 text-purple-600' />;
      case 'teams':
        return <Users className='h-5 w-5 text-blue-600' />;
      case 'jira':
        return <Bug className='h-5 w-5 text-blue-800' />;
      case 'webhook':
        return <Webhook className='h-5 w-5 text-gray-600' />;
      default:
        return <Wrench className='h-5 w-5 text-gray-600' />;
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




  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };



  const getIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWorkSpaceIntegrations(workspaceId || "");
      const data: WorkSpaceIntegration[] = await response;
      setIntegrations(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      getIntegrations();
    }
  }, [workspaceId]);


  const handleToggleStatus = async (integrationId: string) => {
    try {
      const currentIntegration = integrations.find((i) => i.id === integrationId);
      if (!currentIntegration) return;

      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integrationId ? { ...i, isActive: !i.isActive } : i
        )
      );

      const updated = await toggleWorkSpaceIntegrationStatus(
        integrationId,
        workspaceId || '',
        !currentIntegration.isActive
      );

      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integrationId ? { ...i, isActive: updated.isActive } : i
        )
      );

      toast({
        variant: 'success',
        title: `Integration ${updated.isActive ? 'Activated' : 'Deactivated'}`,
        description: `${currentIntegration.name} has been ${updated.isActive ? 'activated' : 'deactivated'}.`,
      });
      // getIntegrations();
    } catch (error: any) {
      console.error('Failed to toggle integration status:', error.message);
      const originalIntegration = integrations.find((x) => x.id === integrationId);
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integrationId
            ? { ...i, isActive: originalIntegration?.isActive || false }
            : i
        )
      );

      toast({
        variant: 'destructive',
        title: 'Failed to toggle integration status',
        description: error.message || 'Something went wrong. Please try again.',
      });
    }
  };


  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await deleteWorkSpaceIntegration(integrationId, workspaceId || "");
      toast({
        variant: 'success',
        title: 'Integration Deleted',
        description: 'The integration has been successfully deleted.',
      });
      getIntegrations();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to delete integration:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to Delete Integration',
        description: error.message || 'Something went wrong. Please try again.',
      });
    }
  };

  const handleSubmitForm = async () => {
    try {
      if (editingIntegration) {
        await updateWorkSpaceIntegration(
          editingIntegration.id,
          workspaceId || "",
          integrationForm
        );

        toast({
          variant: 'success',
          title: 'Integration Updated',
          description: `${integrationForm.name} has been successfully updated.`,
        });
      } else {
        await createWorkSpaceIntegration(workspaceId || "", integrationForm);

        toast({
          variant: 'success',
          title: 'Integration Created',
          description: `${integrationForm.name} has been successfully created.`,
        });
      }
      setIsCreateDialogOpen(false);
      setEditingIntegration(null);
      setIntegrationForm({
        name: '',
        type: 'slack',
        description: '',
        config: { webhook_url: '', channel: '#general' },
        events: [],
      });
      getIntegrations();
    } catch (error: any) {
      console.error('Failed to create/update integration:', error.message);

      toast({
        variant: 'destructive',
        title: 'Failed to Create/Update Integration',
        description: error.message || 'Something went wrong. Please try again.',
      });
    }
  };



  const handleEdit = (integration: WorkSpaceIntegration) => {
    setEditingIntegration(integration);

    setIntegrationForm({
      name: integration.name || '',
      type: integration.type || 'slack',
      description: integration.description || '',
      config: {
        webhook_url: integration.config?.webhook_url || '',
        channel: integration.config?.channel || '#general',
      },
      events: integration.events || [],
    });

    setIsCreateDialogOpen(true);
  };


  const { currentPlan } = useCurrentPlan();




  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Wrench className='h-5 w-5' />
            External Tools
          </CardTitle>
          <Dialog
            open={isCreateDialogOpen || !!editingIntegration}
            onOpenChange={(open) => {
              if (!open) {
                setIsCreateDialogOpen(false);
                setEditingIntegration(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-xl'>
              <DialogHeader>
                <DialogTitle>
                  {editingIntegration
                    ? 'Edit Integration'
                    : 'Add New Integration'}
                </DialogTitle>
                <DialogDescription>
                  Configure external tool integration to receive notifications
                  and updates.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className='block text-sm font-medium mb-2'>Integration Name</label>
                  <Input
                    type="text"
                    name="name"
                    value={integrationForm.name}
                    onChange={handleChange}
                    placeholder="Team Slack"
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Integration Type</label>
                  <Select
                    value={integrationForm.type}
                    onValueChange={(value) =>
                      setIntegrationForm((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger id="integration-type-select">
                      <SelectValue placeholder="Select Integration Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                      <SelectItem
                        value="jira"
                        disabled={
                          currentPlan?.PlanName !== 'Enterprise' &&
                          currentPlan?.IsTrial !== true
                        }
                      >
                        Jira
                      </SelectItem>

                      <SelectItem
                        value="webhook"
                        disabled={
                          currentPlan?.PlanName !== 'Enterprise' &&
                          currentPlan?.IsTrial !== true
                        }
                      >
                        Custom Webhook
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                <div>
                  <label className='block text-sm font-medium mb-2'>Webhook URL</label>
                  <Input
                    type="text"
                    name="config.webhook_url"
                    value={integrationForm.config.webhook_url}
                    onChange={handleChange}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2'>Description (Optional)</label>
                  <Textarea
                    name="description"
                    value={integrationForm.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2'>Notification Events</label>
                  <div className="grid grid-cols-3 gap-4">
                    {availableEvents.map((event) => (
                      <label key={event.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={integrationForm.events.includes(event.value)}
                          onChange={(e) => handleEventChange(event.value, e.target.checked)}
                        />
                        <span className="text-sm">{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingIntegration(null);
                      setIntegrationForm({
                        name: '',
                        type: 'slack',
                        description: '',
                        config: { webhook_url: '', channel: '#general' },
                        events: [],
                      });
                    }}
                    className="px-3 py-1 border rounded"
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    onClick={handleSubmitForm}
                  >
                    {editingIntegration ? 'Update Integration' : 'Create Integration'}
                  </Button>
                </div>
              </div>

            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>

        <div className="space-y-4">
          {!integrations || integrations.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No integrations configured
              </h3>
              <p className="text-gray-500 mb-4">
                Connect external tools to receive notifications.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Integration
              </Button>
            </div>
          ) : (
            integrations?.map((integration) => (
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
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {integration.name}
                          </h3>
                          {getStatusBadge(integration.status)}
                        </div>
                        {integration.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {integration.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex items-center gap-2 sm:hidden">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.isActive}
                          onCheckedChange={() => handleToggleStatus(integration.id)}
                          className={`${integration.isActive ? 'bg-green-500' : 'bg-gray-300'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                        >
                          <span
                            className={`${integration.isActive ? 'translate-x-6' : 'translate-x-1'
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                        <span className="text-xs text-gray-600">
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2 py-1"
                              onClick={() => handleEdit(integration as WorkSpaceIntegration)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            className='text-red-600 hover:text-red-700'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this Integration?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete “
                              {integration.name}”. This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              Cancel
                            </AlertDialogCancel>
                            <Button
                              onClick={() => handleDeleteIntegration(integration?.id || "")}
                            >
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.isActive}
                          onCheckedChange={() => handleToggleStatus(integration.id)}
                          className={`${integration.isActive ? 'bg-green-500' : 'bg-gray-300'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                        >
                          <span
                            className={`${integration.isActive ? 'translate-x-6' : 'translate-x-1'
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                        <span className="text-xs text-gray-600">
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(integration as WorkSpaceIntegration)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            className='text-red-600 hover:text-red-700'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this Integration?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete “
                              {integration.name}”. This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              Cancel
                            </AlertDialogCancel>
                            <Button
                              onClick={() => handleDeleteIntegration(integration?.id || "")}
                            >
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>



                  {/* Mobile Integration Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t sm:hidden">
                    <div>
                      <span className="font-medium block">Type:</span>
                      <span>
                        {integration.type.charAt(0).toUpperCase() +
                          integration.type.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium block">Created:</span>
                      <span>{formatDate(integration.createdAt)}</span>
                    </div>
                  </div>

                  {/* Desktop Integration Details */}
                  <div className="hidden sm:block space-y-1 text-xs text-gray-500 pt-2 border-t">
                    <div>
                      Type:{' '}
                      {integration.type.charAt(0).toUpperCase() + integration.type.slice(1)}
                    </div>
                    <div>Created: {formatDate(integration.createdAt)}</div>
                    <div>Last Updated: {formatDate(integration.updatedAt)}</div>
                    <div>
                      Events:{' '}
                      {integration.events.length > 0
                        ? integration.events.join(', ')
                        : 'No events configured'}
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>




        {/* Integration Info */}
        <div className='mt-8 p-4 bg-blue-50 rounded-lg' >
          <h4 className='font-medium text-blue-900 mb-2'>
            Supported Integrations
          </h4>
          <ul className='text-sm text-blue-800 space-y-1'>
            <li>
              • <strong>Slack:</strong> Send notifications to Slack channels
            </li>
            <li>
              • <strong>Microsoft Teams:</strong> Post messages to Teams
              channels
            </li>
            <li>
              • <strong>Jira:</strong> Create issues for failed tests
              automatically
            </li>
            <li>
              • <strong>Custom Webhook:</strong> Send data to any HTTP endpoint
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
