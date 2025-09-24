import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Globe, Lock, Trash2, Copy, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataManagement } from '@/hooks/useDataManagement';
import { Environment } from '@/shared/types/datamanagement';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const environmentSchema = z.object({
  name: z.string().min(1, 'Environment name is required'),
  description: z.string().optional(),
  baseUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  workspaceId: z.string().min(1, 'Please select a workspace'),
});

type EnvironmentFormData = z.infer<typeof environmentSchema>;
interface EditEnvironmentFormData extends EnvironmentFormData {
  id: string;
}

export function EnvironmentManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<EditEnvironmentFormData | null>(null);
  const {
    variables,
    environments,
    activeEnvironment,
    setActiveEnvironment,
    createEnvironmentMutation,
    updateEnvironmentMutation,
    deleteEnvironmentMutation,
  } = useDataManagement();
  const { workspaces } = useWorkspace();

  console.log('environments999,', environments);

  const form = useForm<EnvironmentFormData>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      name: '',
      description: '',
      baseUrl: '',
      workspaceId: '',
    },
  });

  // Effect to populate form when editing an environment
  React.useEffect(() => {
    if (editingEnvironment) {
      form.reset({
        name: editingEnvironment.name,
        description: editingEnvironment.description || '',
        baseUrl: editingEnvironment.baseUrl || '',
        workspaceId: editingEnvironment.workspaceId,
      });
    }
  }, [editingEnvironment, form]);

  const onSubmit = async (data: EnvironmentFormData) => {
    const environmentData = {
      workspaceId: data.workspaceId,
      name: data.name,
      description: data.description,
      defaultVariables: {
        baseUrl: data.baseUrl || undefined,
      },
      // baseUrl: data.baseUrl || undefined,
      isDefault: false,
    };

    try {
      if (editingEnvironment) {
        await updateEnvironmentMutation.mutateAsync({
          ...environmentData,
          id: editingEnvironment.id,
        });
      } else {
        await createEnvironmentMutation.mutateAsync(environmentData);
      }

      toast({
        title: editingEnvironment
          ? 'Environment updated'
          : 'Environment created',
        description: `Environment "${data.name}" has been ${
          editingEnvironment ? 'updated' : 'created'
        } successfully.`,
      });

      setIsCreateDialogOpen(false);
      setEditingEnvironment(null);
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem saving the environment.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (environment: Environment) => {
    if (environment.isDefault) {
      toast({
        title: 'Cannot delete default environment',
        description: 'The default environment cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteEnvironmentMutation.mutateAsync(environment.id);
      toast({
        title: 'Environment deleted',
        description: `Environment "${environment.name}" has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error deleting environment',
        description: 'There was a problem deleting the environment.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = (environment: Environment) => {
    // If clicking on the currently active environment, make it inactive
    // and activate the fallback environment (one without baseUrl)
    if (environment.id === activeEnvironment?.id) {
      const fallbackEnvironment = environments.find(
        (env) => !env.baseUrl && env.id !== environment.id
      );

      if (fallbackEnvironment) {
        setActiveEnvironment(fallbackEnvironment);
        toast({
          title: 'Environment switched',
          description: `${environment.name} is now inactive. ${fallbackEnvironment.name} is now active.`,
        });
      } else {
        toast({
          title: 'Cannot deactivate',
          description:
            'No fallback environment available. At least one environment must be active.',
          variant: 'destructive',
        });
      }
    } else {
      // If clicking on an inactive environment, make it active
      setActiveEnvironment(environment);
      toast({
        title: 'Environment activated',
        description: `${environment.name} is now active.`,
      });
    }
  };

  const handleDuplicate = async (environment: Environment) => {
    const duplicateData = {
      workspaceId: environment.workspaceId,
      name: `${environment.name} (Copy)`,
      description: environment.description,
      baseUrl: environment.baseUrl,
      isDefault: false,
    };

    try {
      await createEnvironmentMutation.mutateAsync(duplicateData);
      toast({
        title: 'Environment duplicated',
        description: `A copy of "${environment.name}" has been created.`,
      });
    } catch (error) {
      toast({
        title: 'Error duplicating environment',
        description: 'There was a problem creating a duplicate environment.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            Manage Environments
          </CardTitle>
          <Dialog
            open={isCreateDialogOpen || !!editingEnvironment}
            onOpenChange={(open) => {
              if (!open) {
                setIsCreateDialogOpen(false);
                setEditingEnvironment(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Add Environment
              </Button>
            </DialogTrigger>
            <DialogContent className='w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>
                  {editingEnvironment
                    ? 'Edit Environment'
                    : 'Create New Environment'}
                </DialogTitle>
                <DialogDescription>
                  Configure environment settings and variables for your API
                  tests.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-4'
                >
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Environment Name</FormLabel>
                          <FormControl>
                            <Input placeholder='Development' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='workspaceId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workspace</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select workspace' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workspaces.map((workspace) => (
                                <SelectItem
                                  key={workspace.id}
                                  value={workspace.id}
                                >
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
                    name='baseUrl'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='https://api.example.com'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Environment description'
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='flex justify-end gap-2 pt-4 border-t'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingEnvironment(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type='submit'>
                      {editingEnvironment
                        ? 'Update Environment'
                        : 'Create Environment'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {environments.length === 0 ? (
            <div className='text-center py-8'>
              <Settings className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No environments found
              </h3>
              <p className='text-gray-500 mb-4'>
                Create your first environment to get started.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Create Environment
              </Button>
            </div>
          ) : (
            environments.map((environment) => (
              <div
                key={environment.id}
                className='border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors'
              >
                <div className='flex flex-col gap-3'>
                  <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex flex-wrap items-center gap-2 mb-2'>
                        <h3 className='font-medium text-gray-900 text-sm sm:text-base truncate'>
                          {environment.name}
                        </h3>
                        {environment.isDefault && (
                          <Badge variant='secondary' className='text-xs'>
                            Default
                          </Badge>
                        )}
                      </div>
                      {environment.description && (
                        <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                          {environment.description}
                        </p>
                      )}
                      {environment.name != 'No Environment' && (
                        <div className='flex items-center gap-2 mb-2'>
                          <Globe className='h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
                          <span className='text-xs sm:text-sm text-gray-600 truncate'>
                            {environment.baseUrl}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mobile: Action buttons */}
                    {environment.name != 'No Environment' && (
                      <div className='flex items-center gap-2 sm:hidden'>
                        {/* <div className='flex items-center gap-1'>
                          <Switch
                            checked={environment.id === activeEnvironment?.id}
                            onCheckedChange={() =>
                              handleToggleActive(environment)
                            }
                            className='data-[state=checked]:bg-green-600'
                          />
                        </div> */}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleDuplicate(environment)}
                          className='px-2 py-1'
                        >
                          <Copy className='h-3 w-3' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setEditingEnvironment(environment)}
                          className='px-2 py-1'
                        >
                          <Edit className='h-3 w-3' />
                        </Button>
                        {!environment.isDefault && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                className='text-red-600 hover:text-red-700 px-2 py-1'
                              >
                                <Trash2 className='h-3 w-3' />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete this environment?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "
                                  {environment.name}". This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button
                                  onClick={() => handleDelete(environment)}
                                  // className='bg-red-600 text-white hover:bg-red-700'
                                >
                                  Delete
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                    {environment.name != 'No Environment' && (
                      <div className='hidden sm:flex items-center gap-3'>
                        {/* <div className='flex items-center gap-2'>
                          <Switch
                            checked={environment.id === activeEnvironment?.id}
                            onCheckedChange={() =>
                              handleToggleActive(environment)
                            }
                            className='data-[state=checked]:bg-green-600'
                          />
                          <span className='text-sm text-gray-600'>
                            {environment.id === activeEnvironment?.id
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </div> */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleDuplicate(environment)}
                              >
                                <Copy className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  setEditingEnvironment(environment)
                                }
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {!environment.isDefault && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      className='text-red-600 hover:text-red-700'
                                    >
                                      <Trash2 className='h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete this environment?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "
                                  {environment.name}". This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button
                                  onClick={() => handleDelete(environment)}
                                  // className='bg-red-600 text-white hover:bg-red-700'
                                >
                                  Delete
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile: Environment details */}
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 pt-2 border-t sm:hidden'>
                    <div>
                      <span className='font-medium block'>
                        {variables.length}
                      </span>
                      <span>variables</span>
                    </div>
                    <div>
                      <span className='font-medium block'>Created:</span>
                      <span>{formatDate(environment.createdAt)}</span>
                    </div>
                  </div>

                  {/* Desktop: Environment details */}
                  <div className='hidden sm:flex items-center gap-4 text-xs text-gray-500 pt-2 border-t'>
                    <span>{variables.length} variables</span>
                    <span className='flex items-center gap-1'>
                      <Lock className='h-3 w-3' />0 secrets
                    </span>
                    <span>Created {formatDate(environment.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Environment Usage Info */}
        <div className='mt-8 p-4 bg-blue-50 rounded-lg'>
          <h4 className='font-medium text-blue-900 mb-2'>Environment Usage</h4>
          <p className='text-sm text-blue-800'>
            Environments allow you to manage different API endpoints and
            configurations for development, staging, and production. Variables
            can be used in your requests using variable_name syntax.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
