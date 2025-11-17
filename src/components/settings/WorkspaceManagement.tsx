import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Users,
  Plus,
  Settings,
  Trash2,
  Crown,
  ExternalLink,
  LogOut,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { Workspace as BaseWorkspace } from '@/shared/types/workspace';
import WorkspaceModal from '../WorkspaceModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

interface Workspace extends BaseWorkspace {
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
}

export function WorkspaceManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );

  // Get workspaces and mutations from the custom hook
  const {
    workspaces,
    refreshWorkspaces,
    createWorkspaceMutation,
    updateWorkspaceMutation,
    deleteWorkspaceMutation,
  } = useWorkspace();

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a workspace name.',
        variant: 'destructive',
      });
      return;
    }

    createWorkspaceMutation.mutate(
      {
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Workspace created',
            description: `Workspace "${newWorkspaceName}" has been created successfully.`,
          });
          setIsCreateDialogOpen(false);
          setNewWorkspaceName('');
          setNewWorkspaceDescription('');
          refreshWorkspaces();
        },
        onError: (error: any) => {
          toast({
            title: 'Failed to create workspace',
            description:
              error.message ||
              'An error occurred while creating the workspace.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Function to handle saving workspace (create or update)
  const handleSaveWorkspace = async (workspace: Partial<BaseWorkspace>) => {
    if (modalMode === 'add') {
      return new Promise((resolve, reject) => {
        createWorkspaceMutation.mutate(workspace, {
          onSuccess: (data) => {
            toast({
              title: 'Workspace created',
              description: `Workspace "${workspace.name}" has been created successfully.`,
            });
            refreshWorkspaces();
            resolve(data);
          },
          onError: (error: any) => {
            toast({
              title: 'Failed to create workspace',
              description:
                error.message ||
                'An error occurred while creating the workspace.',
              variant: 'destructive',
            });
            reject(error);
          },
        });
      });
    } else {
      // Edit mode
      return new Promise((resolve, reject) => {
        updateWorkspaceMutation.mutate(workspace, {
          onSuccess: (data) => {
            toast({
              title: 'Workspace updated',
              description: `Workspace "${workspace.name}" has been updated successfully.`,
            });
            refreshWorkspaces();
            resolve(data);
          },
          onError: (error: any) => {
            toast({
              title: 'Failed to update workspace',
              description:
                error.message ||
                'An error occurred while updating the workspace.',
              variant: 'destructive',
            });
            reject(error);
          },
        });
      });
    }
  };

  // Function to add a new workspace
  const handleAddWorkspace = () => {
    setSelectedWorkspace(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  // Function to edit a workspace
  const handleEditWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteWorkspace = (
    workspaceId: string,
    workspaceName: string
  ) => {
    try {
      deleteWorkspaceMutation.mutate(workspaceId, {
        onSuccess: () => {
          toast({
            title: 'Workspace deleted',
            description: `"${workspaceName}" has been deleted successfully.`,
          });
          refreshWorkspaces();
        },
        onError: (error: any) => {
          toast({
            title: 'Failed to delete workspace',
            description:
              error.message ||
              'An error occurred while deleting the workspace.',
            variant: 'destructive',
          });
        },
      });
    } catch (error: any) {
      toast({
        title: 'Unexpected Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  // Function to open the workspace settings modal
  const handleWorkspaceSettings = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleLeaveWorkspace = (workspace: Workspace) => {
    if (confirm(`Are you sure you want to leave "${workspace.name}"?`)) {
      // Call a leave workspace API here if implemented
      toast({
        title: 'Left workspace',
        description: `You have left ${workspace.name}.`,
      });
      refreshWorkspaces();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className='h-4 w-4 text-yellow-600' />;
      case 'admin':
        return <Settings className='h-4 w-4 text-blue-600' />;
      default:
        return <Users className='h-4 w-4 text-gray-600' />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      owner: 'default',
      admin: 'secondary',
      member: 'outline',
    } as const;

    return (
      <Badge
        variant={variants[role as keyof typeof variants]}
        className='text-xs'
      >
        {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown'}
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <CardTitle className='flex items-center gap-2'>
              <Building2 className='h-5 w-5' />
              Workspace Management
            </CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  <span className='hidden sm:inline'>Create Workspace</span>
                  <span className='sm:hidden'>Create</span>
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='workspace-name'>Workspace Name</Label>
                    <Input
                      id='workspace-name'
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder='Enter workspace name'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='workspace-description'>
                      Description (Optional)
                    </Label>
                    <Textarea
                      id='workspace-description'
                      value={newWorkspaceDescription}
                      onChange={(e) =>
                        setNewWorkspaceDescription(e.target.value)
                      }
                      placeholder='Enter workspace description'
                    />
                  </div>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateWorkspace}
                      disabled={createWorkspaceMutation.isPending}
                    >
                      {createWorkspaceMutation.isPending
                        ? 'Creating...'
                        : 'Create Workspace'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-gray-600'>
            Manage your workspaces and collaborate with team members. Each
            workspace contains its own test suites, environments, and settings.
          </p>
        </CardContent>
      </Card>

      {/* Workspaces List */}
      <div className='space-y-4'>
        {(workspaces || []).map((workspace) => {
          // Add default values for compatibility
          const enrichedWorkspace: Workspace = {
            ...workspace,
            role: (workspace as any).role || 'member',
            memberCount: (workspace as any).memberCount || 0,
          };

          return (
            <Card key={enrichedWorkspace.id}>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex flex-col gap-4'>
                  {/* Header Row */}
                  <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-3'>
                    <div className='flex items-start gap-3 flex-1 min-w-0'>
                      <Avatar className='h-10 w-10 flex-shrink-0'>
                        <AvatarImage
                          src='/api/placeholder/40/40'
                          alt={enrichedWorkspace.name}
                        />
                        <AvatarFallback className='text-sm'>
                          {enrichedWorkspace.name
                            ?.split(' ')
                            .map((n: string) => n?.[0] || '')
                            .join('') || 'W'}
                        </AvatarFallback>
                      </Avatar>

                      <div className='flex-1 min-w-0'>
                        <div className='flex flex-wrap items-center gap-2 mb-1'>
                          <h3 className='font-semibold text-gray-900 truncate'>
                            {enrichedWorkspace.name}
                          </h3>
                          {getRoleIcon(enrichedWorkspace.role)}
                          {getRoleBadge(enrichedWorkspace.role)}
                        </div>

                        {enrichedWorkspace.description && (
                          <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                            {enrichedWorkspace.description}
                          </p>
                        )}

                        <div className='flex flex-wrap items-center gap-4 text-xs text-gray-500'>
                          <div className='flex items-center gap-1'>
                            <Users className='h-3 w-3' />
                            <span>{enrichedWorkspace.memberCount} members</span>
                          </div>
                          <div>
                            Created{' '}
                            {enrichedWorkspace.createdAt
                              ? new Date(
                                  enrichedWorkspace.createdAt
                                ).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-2'>
                      {/* {enrichedWorkspace.role === 'owner' || enrichedWorkspace.role === 'admin' ? ( */}
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  handleWorkspaceSettings(enrichedWorkspace)
                                }
                              >
                                <Settings className='h-3 w-3 sm:h-4 sm:w-4 ' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Settings</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  handleEditWorkspace(enrichedWorkspace)
                                }
                              >
                                <Edit className='h-3 w-3 sm:h-4 sm:w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {/* {enrichedWorkspace.role === 'owner' && ( */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    className='text-red-600 hover:text-red-700'
                                  >
                                    <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                                  </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Workspace?
                                    </AlertDialogTitle>

                                    <AlertDialogDescription>
                                      This will permanently delete “
                                      <b>{enrichedWorkspace.name}</b>”. This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>

                                    <Button
                                      onClick={() =>
                                        handleDeleteWorkspace(
                                          enrichedWorkspace.id,
                                          enrichedWorkspace.name
                                        )
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {/* ) : null} */}
                      </>
                      {/* ) : null} */}

                      {enrichedWorkspace.role !== 'owner' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  handleLeaveWorkspace(enrichedWorkspace)
                                }
                                className='text-red-600 hover:text-red-700'
                              >
                                <LogOut className='h-3 w-3 sm:h-4 sm:w-4 ' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Leave</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>

                  {/* Mobile: Additional Info */}
                  <div className='sm:hidden grid grid-cols-2 gap-4 pt-3 border-t text-xs'>
                    <div>
                      <span className='font-medium text-gray-900'>Role:</span>
                      <div className='flex items-center gap-1 mt-1'>
                        {getRoleIcon(enrichedWorkspace.role)}
                        <span className='capitalize'>
                          {enrichedWorkspace.role}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className='font-medium text-gray-900'>
                        Members:
                      </span>
                      <div className='mt-1'>
                        {enrichedWorkspace.memberCount} people
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="">
            <Button variant="outline" className="h-auto p-4 flex-col w-full">
              <Plus className="h-5 w-5" />
              <span className="font-medium">Create Workspace</span>
              <span className="text-xs text-gray-600">Start a new project</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">Join Workspace</span>
              <span className="text-xs text-gray-600">Use invitation code</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Settings className="h-5 w-5" />
              <span className="font-medium">Workspace Settings</span>
              <span className="text-xs text-gray-600">Manage permissions</span>
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <h4 className='font-medium text-blue-900 mb-2'>
                Workspace Roles
              </h4>
              <div className='space-y-2 text-sm text-blue-800'>
                <div className='flex items-center gap-2'>
                  <Crown className='h-4 w-4 text-yellow-600' />
                  <span className='font-medium'>Owner:</span>
                  <span>Full access, can delete workspace</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Settings className='h-4 w-4 text-blue-600' />
                  <span className='font-medium'>Admin:</span>
                  <span>Manage members and settings</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Users className='h-4 w-4 text-gray-600' />
                  <span className='font-medium'>Member:</span>
                  <span>Create and run tests</span>
                </div>
              </div>
            </div>

            <div className='bg-gray-50 p-4 rounded-lg'>
              <h4 className='font-medium text-gray-900 mb-2'>
                Workspace Limits
              </h4>
              <ul className='text-sm text-gray-700 space-y-1'>
                <li>• Maximum 10 workspaces per account</li>
                <li>• Up to 50 members per workspace</li>
                <li>• Unlimited test suites and environments</li>
                <li>• Role-based access control</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit workspace modal */}
      <Button className='hidden' onClick={handleAddWorkspace}>
        Add Workspace
      </Button>
      <WorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveWorkspace={handleSaveWorkspace}
        workspace={selectedWorkspace}
        mode={modalMode}
      />
    </div>
  );
}
