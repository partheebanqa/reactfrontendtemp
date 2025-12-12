'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  User,
  UserCog,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  addUser,
  getUserRoles,
  getUserList,
  removeUserFromWorkspace,
  updateUserRole,
} from '@/services/managePeople.service';
import type {
  AddMemberPayload,
  RemoveUserPayload,
  UpdateRolePayload,
} from '@/shared/types/manageUser';
import { prepareInvitePayload } from '@/lib/people-validators';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import UserManagement from './UserManagement';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  // status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  workspace: string;
  workspaceList?: string[];
  workspaceIds?: string[];
  workspacePairs?: { id: string; name: string }[];
  avatar?: string;
}

export function PeopleManagement() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const { workspaces, currentWorkspace } = useWorkspace();
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    firstName?: string;
    lastName?: string;
    workspace?: string;
    role?: string;
  }>({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [roleDialogOpenFor, setRoleDialogOpenFor] = useState<TeamMember | null>(
    null
  );
  const [roleDialogSelectedRole, setRoleDialogSelectedRole] = useState('');
  const [roleDialogWorkspaceIds, setRoleDialogWorkspaceIds] = useState<
    string[]
  >([]);

  const [removeDialogOpenFor, setRemoveDialogOpenFor] =
    useState<TeamMember | null>(null);
  const [removeDialogWorkspaceIds, setRemoveDialogWorkspaceIds] = useState<
    string[]
  >([]);

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['userList'],
    queryFn: getUserList,
  });

  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['userRoles'],
    queryFn: getUserRoles,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [userType, setUserType] = useState<'existing' | 'new'>('existing');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const displayRoleName = (name?: string) => {
    const n = (name || '').toLowerCase().trim();
    return n === 'org admin' ? 'Account Owner' : name || '';
  };

  const members: TeamMember[] = useMemo(() => {
    if (!usersData?.users || !roles?.roles) return [];

    return usersData.users.map((user) => {
      const userRoleName =
        (typeof user?.role === 'string' && user.role) ||
        (Array.isArray(user?.roles) && user.roles[0]) ||
        '';

      const matchingRole = roles.roles.find(
        (r) => r.name?.toLowerCase() === String(userRoleName).toLowerCase()
      );

      const rawWorkspacePairs: { id: string; name: string }[] =
        Array.isArray(user.workspaces) && user.workspaces.length > 0
          ? user.workspaces
            .map((w: any) => ({
              id: (w?.id || '').toString().trim(),
              name: (w?.name || '').toString().trim(),
            }))
            .filter((w) => w.id && w.name)
          : [];

      const workspaceIds = Array.from(
        new Set(rawWorkspacePairs.map((w) => w.id))
      );
      const workspaceNames = Array.from(
        new Set(rawWorkspacePairs.map((w) => w.name))
      );

      const workspaceDisplay =
        workspaceNames.length > 0 ? workspaceNames.join(', ') : 'No Workspace';

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: String(userRoleName),
        roleId: matchingRole?.id,
        // status: 'active' as const,
        lastActive: user.createdAt,
        workspace: workspaceDisplay,
        workspaceList: workspaceNames,
        workspaceIds,
        workspacePairs: rawWorkspacePairs,
        avatar: undefined,
      };
    });
  }, [usersData, roles]);

  const backendUsers = useMemo(() => {
    if (!usersData?.users) return [];
    return usersData.users;
  }, [usersData]);

  const availableWorkspaces = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (Array.isArray(m.workspaceList) && m.workspaceList.length) {
        m.workspaceList.forEach((n) => set.add(n));
      } else if (m.workspace && m.workspace !== 'No Workspace') {
        set.add(m.workspace);
      }
    });
    return Array.from(set);
  }, [members]);

  const emailSuggestions = useMemo(() => {
    if (userType !== 'new') return [];
    const q = inviteEmail.trim().toLowerCase();
    if (!q) return [];
    return backendUsers
      .filter((u) => {
        const fields = [u.email, u.firstName, u.lastName]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        return fields.some((f) => f.includes(q));
      })
      .slice(0, 8);
  }, [userType, inviteEmail, backendUsers]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesWorkspace =
        filterWorkspace === 'all' ||
        (member.workspaceList?.includes(filterWorkspace) ??
          member.workspace === filterWorkspace);

      const matchesRole = filterRole === 'all' || member.roleId === filterRole;

      return matchesSearch && matchesWorkspace && matchesRole;
    });
  }, [members, searchTerm, filterWorkspace, filterRole]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterWorkspace, filterRole]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterWorkspace('all');
    setFilterRole('all');
    setCurrentPage(1);
  };

  const {
    mutate: inviteUser,
    mutateAsync: inviteUserAsync,
    isPending,
  } = useMutation({
    mutationFn: (payload: AddMemberPayload) => addUser(payload),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data?.message || 'Invitation sent successfully!',
      });
      setInviteEmail('');
      setFirstName('');
      setLastName('');
      setSelectedWorkspace('');
      setSelectedRole('');
      setSelectedUser('');
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    },
  });

  const {
    // mutate: updateRole,
    mutateAsync: updateRoleAsync,
    isPending: isUpdatingRole,
  } = useMutation({
    mutationFn: (payload: UpdateRolePayload) => updateUserRole(payload),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data?.message || 'Role updated successfully!',
      });
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    },
  });

  const {
    // mutate: removeUser,
    mutateAsync: removeUserAsync,
    isPending: isRemovingUser,
  } = useMutation({
    mutationFn: (payload: RemoveUserPayload) =>
      removeUserFromWorkspace(payload),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data?.message || 'User removed successfully!',
        variant: 'destructive',
      });
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove user',
        variant: 'destructive',
      });
    },
  });

  const handleInviteUser = async () => {
    const { payload, errors: rawErrors } = prepareInvitePayload({
      firstName,
      lastName,
      email: inviteEmail,
      roleId: selectedRole,
      workspaceId: selectedWorkspace,
    });

    const mappedErrors: {
      email?: string;
      firstName?: string;
      lastName?: string;
      workspace?: string;
      role?: string;
    } = {
      email: rawErrors.email,
      firstName: rawErrors.firstName,
      lastName: rawErrors.lastName,
      workspace: rawErrors.workspaceId,
      role: rawErrors.roleId,
    };

    setErrors(mappedErrors);

    if (Object.values(mappedErrors).some(Boolean)) {
      if (!selectedWorkspace || !selectedRole) {
        toast({
          title: 'Error',
          description: 'Please select a workspace and role',
          variant: 'destructive',
        });
      }
      return;
    }

    if (!payload) return;

    await inviteUser(payload);
  };

  // const handleChangeRole = (member: TeamMember, newRoleId: string) => {
  //   const payload: UpdateRolePayload = {
  //     userId: member.id,
  //     workspaceId: currentWorkspace?.id ?? '',
  //     roleId: newRoleId,
  //   };
  //   updateRole(payload);
  // };

  // const handleRemoveMember = (member: TeamMember) => {
  //   const payload: RemoveUserPayload = {
  //     userId: member.id,
  //     workspaceId: currentWorkspace?.id ?? '',
  //   };
  //   removeUser(payload);
  // };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getRoleIcon = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'org admin' || r === 'account owner')
      return <Crown className='h-4 w-4 text-yellow-600' />;
    if (r === 'admin') return <Shield className='h-4 w-4 text-blue-600' />;
    return <User className='h-4 w-4 text-gray-600' />;
  };

  const emailValid = useMemo(() => !errors.email, [errors.email]);
  const canInvite = useMemo(
    () =>
      emailValid &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      selectedWorkspace.length > 0 &&
      selectedRole.length > 0,
    [emailValid, firstName, lastName, selectedWorkspace, selectedRole]
  );

  const renderWorkspaceInline = (names?: string[]) => {
    const list = Array.isArray(names) ? names.filter(Boolean) : [];
    if (list.length === 0) return 'No Workspace';
    const full = list.join(', ');
    if (list.length <= 2) return <span title={full}>{full}</span>;
    const shown = list.slice(0, 2).join(', ');
    const more = list.length - 2;
    return (
      <span title={full}>
        {shown}, +{more} more
      </span>
    );
  };

  const openRoleDialog = (member: TeamMember) => {
    setRoleDialogOpenFor(member);
    setRoleDialogSelectedRole(member.roleId || '');
    setRoleDialogWorkspaceIds([]);
  };

  const submitRoleDialog = async () => {
    if (!roleDialogOpenFor) return;
    if (!roleDialogSelectedRole || roleDialogWorkspaceIds.length === 0) {
      toast({
        title: 'Select role and workspace(s)',
        description:
          'Please select at least one workspace and a role to continue.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await Promise.all(
        roleDialogWorkspaceIds.map((wid) =>
          updateRoleAsync({
            userId: roleDialogOpenFor.id,
            workspaceId: wid,
            roleId: roleDialogSelectedRole,
          })
        )
      );

      setRoleDialogOpenFor(null);
      refetchUsers();
    } catch (e: any) {
      // errors are also handled in mutation onError
    }
  };

  const openRemoveDialog = (member: TeamMember) => {
    setRemoveDialogOpenFor(member);
    setRemoveDialogWorkspaceIds([]);
  };

  const submitRemoveDialog = async () => {
    if (!removeDialogOpenFor) return;
    if (removeDialogWorkspaceIds.length === 0) {
      toast({
        title: 'Select workspace(s)',
        description:
          'Please select at least one workspace to remove the user from.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await Promise.all(
        removeDialogWorkspaceIds.map((wid) =>
          removeUserAsync({
            userId: removeDialogOpenFor.id,
            workspaceId: wid,
          })
        )
      );

      setRemoveDialogOpenFor(null);
      refetchUsers();
    } catch (e: any) {
      // errors are handled by mutation onError
    }
  };

  const inviteWorkspaces = useMemo(() => workspaces ?? [], [workspaces]);
  return (
    <div className='space-y-3'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <UserPlus className='h-5 w-5' />
            Invite Team Member
          </CardTitle>
        </CardHeader>

        <div className='px-6 pb-2'>
          <div className='flex items-center'>
            <div className='flex rounded-lg border overflow-hidden text-sm'>
              <button
                type='button'
                onClick={() => {
                  setUserType('existing');
                  setShowSuggestions(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 transition-all 
            ${userType === 'existing' ? 'text-white' : 'text-gray-700'}`}
                style={
                  userType === 'existing'
                    ? { backgroundColor: 'rgb(19 111 176)' }
                    : {}
                }
              >
                <User className='w-4 h-4' />
                Add Existing Member
              </button>
              <button
                type='button'
                onClick={() => {
                  setUserType('new');
                  setShowSuggestions(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 transition-all 
            ${userType === 'new' ? 'text-white' : 'text-gray-700'}`}
                style={
                  userType === 'new'
                    ? { backgroundColor: 'rgb(19 111 176)' }
                    : {}
                }
              >
                <Send className='w-4 h-4' />
                Invite New Member
              </button>
            </div>
          </div>
        </div>

        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Email Field */}
            <div className='space-y-2'>
              <Label htmlFor='invite-email'>
                Email Address <span className='text-red-600'>*</span>
              </Label>

              {userType === 'existing' ? (
                <Select
                  value={selectedUser}
                  onValueChange={(id) => {
                    setSelectedUser(id);
                    const user = backendUsers.find((u) => u.id === id);
                    if (user) {
                      setInviteEmail(user.email);
                      setFirstName(user.firstName);
                      setLastName(user.lastName);
                      if (errors.email)
                        setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                >
                  <SelectTrigger
                    id='invite-email'
                    aria-invalid={!!errors.email}
                    aria-describedby={
                      errors.email ? 'invite-email-error' : undefined
                    }
                    className={`${errors.email
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                      }`}
                  >
                    <SelectValue placeholder='Select existing member' />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <SelectItem value='loading' disabled>
                        Loading users...
                      </SelectItem>
                    ) : backendUsers.length ? (
                      backendUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value='no-users' disabled>
                        No users found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <div className='relative'>
                  <Input
                    id='invite-email'
                    type='email'
                    placeholder='Enter new email address'
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setShowSuggestions(!!e.target.value.trim());
                      if (errors.email)
                        setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    onFocus={() => {
                      if (inviteEmail.trim()) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 120);
                    }}
                    aria-invalid={!!errors.email}
                    aria-describedby={
                      errors.email ? 'invite-email-error' : undefined
                    }
                    className={`${errors.email
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                      }`}
                  />
                  {showSuggestions && emailSuggestions.length > 0 && (
                    <ul
                      role='listbox'
                      aria-label='Existing matching users'
                      className='absolute z-10 mt-1 w-full bg-background border rounded-md shadow-md max-h-60 overflow-auto scrollbar-thin'
                    >
                      {emailSuggestions.map((u) => (
                        <li key={u.id} role='option' aria-selected='false'>
                          <button
                            type='button'
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setInviteEmail(u.email);
                              setFirstName(u.firstName || '');
                              setLastName(u.lastName || '');
                              setSelectedUser('');
                              setErrors((prev) => ({
                                ...prev,
                                email: undefined,
                                firstName: undefined,
                                lastName: undefined,
                              }));
                              setShowSuggestions(false);
                            }}
                            className='w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground'
                          >
                            <div className='text-sm font-medium'>{u.email}</div>
                            <div className='text-xs opacity-70'>
                              {(u.firstName || '') + ' ' + (u.lastName || '')}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {errors.email && (
                <p id='invite-email-error' className='text-xs text-red-600'>
                  {errors.email}
                </p>
              )}
            </div>

            {/* First Name */}
            <div className='space-y-2'>
              <Label htmlFor='first-name'>
                First Name <span className='text-red-600'>*</span>
              </Label>
              <Input
                id='first-name'
                placeholder='Enter first name'
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName)
                    setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? 'first-name-error' : undefined
                }
                className={`${errors.firstName
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
                  }`}
              />
              {errors.firstName && (
                <p id='first-name-error' className='text-xs text-red-600'>
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className='space-y-2'>
              <Label htmlFor='last-name'>
                Last Name <span className='text-red-600'>*</span>
              </Label>
              <Input
                id='last-name'
                placeholder='Enter last name'
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName)
                    setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? 'last-name-error' : undefined
                }
                className={`${errors.lastName
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
                  }`}
              />
              {errors.lastName && (
                <p id='last-name-error' className='text-xs text-red-600'>
                  {errors.lastName}
                </p>
              )}
            </div>

            {/* Workspace */}
            <div className='space-y-2'>
              <Label htmlFor='workspace-select'>
                Workspace<span className='text-red-600'>*</span>
              </Label>
              <Select
                value={selectedWorkspace}
                onValueChange={(v) => {
                  setSelectedWorkspace(v);
                  if (errors.workspace)
                    setErrors((prev) => ({ ...prev, workspace: undefined }));
                }}
              >
                <SelectTrigger
                  id='workspace-select'
                  aria-invalid={!!errors.workspace}
                  aria-describedby={
                    errors.workspace ? 'workspace-error' : undefined
                  }
                  className={`${errors.workspace
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                    }`}
                >
                  <SelectValue placeholder='Select workspace' />
                </SelectTrigger>
                <SelectContent>
                  {inviteWorkspaces.length > 0 ? (
                    inviteWorkspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value='no-other' disabled>
                      No other workspaces
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.workspace && (
                <p id='workspace-error' className='text-xs text-red-600'>
                  {errors.workspace}
                </p>
              )}
            </div>

            {/* Role */}
            <div className='space-y-2'>
              <Label htmlFor='role-select'>
                Role <span className='text-red-600'>*</span>
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => {
                  setSelectedRole(v);
                  if (errors.role)
                    setErrors((prev) => ({ ...prev, role: undefined }));
                }}
              >
                <SelectTrigger
                  id='role-select'
                  aria-invalid={!!errors.role}
                  aria-describedby={errors.role ? 'role-error' : undefined}
                  className={`${errors.role
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                    }`}
                >
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingRoles ? (
                    <SelectItem value='loading' disabled>
                      Loading roles...
                    </SelectItem>
                  ) : !roles?.roles?.length ? (
                    <SelectItem value='no-roles' disabled>
                      No roles found
                    </SelectItem>
                  ) : (
                    roles.roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {displayRoleName(role.name)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.role && (
                <p id='role-error' className='text-xs text-red-600'>
                  {errors.role}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className='flex justify-end mt-4'>
            <Button
              onClick={handleInviteUser}
              disabled={!canInvite || isPending}
              className='flex items-center gap-2'
            >
              <Mail className='h-4 w-4' />
              {isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <UserManagement />
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='p-4 border rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <Crown className='h-5 w-5 text-yellow-600' />
                <h4 className='font-medium'>{displayRoleName('Org Admin')}</h4>
              </div>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• All permission of Admin</li>
                <li>• All permission of user</li>
                <li>• Billing management</li>
              </ul>
            </div>

            <div className='p-4 border rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <Shield className='h-5 w-5 text-blue-600' />
                <h4 className='font-medium'>{displayRoleName('Admin')}</h4>
              </div>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• All permission of user</li>
                <li>• Manage Workspaces</li>
                <li>• Manage Environments</li>
                <li>• Manage Members</li>
                <li>• Manage integrations</li>
              </ul>
            </div>

            <div className='p-4 border rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <User className='h-5 w-5 text-gray-600' />
                <h4 className='font-medium'>{displayRoleName('Member')}</h4>
              </div>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Create test suites</li>
                <li>• Create request chains</li>
                <li>• Run tests</li>
                <li>• View, Download and share reports</li>
                <li>• Use environments</li>
                <li>• Configure CICD</li>
                <li>• Basic workspace access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog
        open={!!roleDialogOpenFor}
        onOpenChange={(open) => {
          if (!open) setRoleDialogOpenFor(null);
        }}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
          </DialogHeader>

          {roleDialogOpenFor ? (
            <div className='space-y-4'>
              <div className='text-sm'>
                <div className='font-medium'>{roleDialogOpenFor.name}</div>
                <div className='text-muted-foreground'>
                  {roleDialogOpenFor.email}
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Apply to workspace</Label>
                {roleDialogOpenFor.workspacePairs &&
                  roleDialogOpenFor.workspacePairs.length > 0 ? (
                  <div className='border rounded-md p-3 space-y-2'>
                    <div className='grid grid-cols-1 gap-2'>
                      {(roleDialogOpenFor.workspacePairs || []).map((w) => {
                        const checked = roleDialogWorkspaceIds.includes(w.id);
                        return (
                          <label
                            key={w.id}
                            className='flex items-center gap-2 cursor-pointer'
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                setRoleDialogWorkspaceIds((prev) =>
                                  c
                                    ? Array.from(new Set([...prev, w.id]))
                                    : prev.filter((id) => id !== w.id)
                                );
                              }}
                            />
                            <span className='text-sm'>{w.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    This user is not part of any workspace.
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <Label>Role</Label>
                <Select
                  value={roleDialogSelectedRole}
                  onValueChange={setRoleDialogSelectedRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select role' />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <SelectItem value='loading' disabled>
                        Loading roles...
                      </SelectItem>
                    ) : !roles?.roles?.length ? (
                      <SelectItem value='no-roles' disabled>
                        No roles found
                      </SelectItem>
                    ) : (
                      roles.roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {displayRoleName(role.name)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRoleDialogOpenFor(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitRoleDialog}
              disabled={
                isUpdatingRole ||
                !roleDialogOpenFor ||
                !roleDialogSelectedRole ||
                !(roleDialogWorkspaceIds.length > 0)
              }
            >
              {isUpdatingRole ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog
        open={!!removeDialogOpenFor}
        onOpenChange={(open) => {
          if (!open) setRemoveDialogOpenFor(null);
        }}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Remove from workspace(s)</DialogTitle>
          </DialogHeader>

          {removeDialogOpenFor ? (
            <div className='space-y-4'>
              <div className='text-sm'>
                <div className='font-medium'>{removeDialogOpenFor.name}</div>
                <div className='text-muted-foreground'>
                  {removeDialogOpenFor.email}
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Select workspace(s) to remove</Label>
                {removeDialogOpenFor.workspacePairs &&
                  removeDialogOpenFor.workspacePairs.length > 0 ? (
                  <div className='border rounded-md p-3 space-y-2'>
                    <div className='grid grid-cols-1 gap-2'>
                      {(removeDialogOpenFor.workspacePairs || []).map((w) => {
                        const checked = removeDialogWorkspaceIds.includes(w.id);
                        return (
                          <label key={w.id} className='flex items-center gap-2'>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                setRemoveDialogWorkspaceIds((prev) =>
                                  c
                                    ? Array.from(new Set([...prev, w.id]))
                                    : prev.filter((id) => id !== w.id)
                                );
                              }}
                            />
                            <span className='text-sm'>{w.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    This user is not part of any workspace.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRemoveDialogOpenFor(null)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={submitRemoveDialog}
              disabled={
                isRemovingUser ||
                !removeDialogOpenFor ||
                !(removeDialogWorkspaceIds.length > 0)
              }
            >
              {isRemovingUser ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
