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
  Settings,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  User,
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  workspace: string;
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
  }>({});

  // Fetch users from backend
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

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userType, setUserType] = useState<'existing' | 'new'>('existing');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Transform backend users to TeamMember format
  const members: TeamMember[] = useMemo(() => {
    if (!usersData?.users || !roles?.roles) return [];

    return usersData.users.map((user) => {
      const userRoleName = user.roles[0] || '';
      const matchingRole = roles.roles.find(
        (r) => r.name.toLowerCase() === userRoleName.toLowerCase()
      );

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: userRoleName, // keep original role name (e.g., "Org Admin")
        roleId: matchingRole?.id,
        status: 'active' as const,
        lastActive: user.createdAt,
        workspace: 'Main Workspace',
        avatar: undefined,
      };
    });
  }, [usersData, roles]);

  // Backend users for the dropdown (existing users)
  const backendUsers = useMemo(() => {
    if (!usersData?.users) return [];
    return usersData.users;
  }, [usersData]);

  // Get unique workspaces for filtering
  const availableWorkspaces = useMemo(() => {
    return [...new Set(members.map((member) => member.workspace))];
  }, [members]);

  // Filter and search logic
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesWorkspace =
        filterWorkspace === 'all' || member.workspace === filterWorkspace;

      const matchesRole = filterRole === 'all' || member.roleId === filterRole;

      const matchesStatus =
        filterStatus === 'all' || member.status === filterStatus;

      return matchesSearch && matchesWorkspace && matchesRole && matchesStatus;
    });
  }, [members, searchTerm, filterWorkspace, filterRole, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterWorkspace, filterRole, filterStatus]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterWorkspace('all');
    setFilterRole('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const { mutate: inviteUser, isPending } = useMutation({
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

  const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
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

  const { mutate: removeUser, isPending: isRemovingUser } = useMutation({
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
    const trimmedEmail = inviteEmail.trim();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    const newErrors: { email?: string; firstName?: string; lastName?: string } =
      {};
    if (!trimmedEmail) newErrors.email = 'Email is required';
    else if (!isValidEmail(trimmedEmail))
      newErrors.email = 'Enter a valid email address';

    if (!trimmedFirst) newErrors.firstName = 'First name is required';
    if (!trimmedLast) newErrors.lastName = 'Last name is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!selectedWorkspace || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a workspace and role',
        variant: 'destructive',
      });
      return;
    }

    const payload: AddMemberPayload = {
      accessList: [
        {
          roleIds: [selectedRole],
          workspaceId: selectedWorkspace,
        },
      ],
      email: trimmedEmail,
      firstName: trimmedFirst,
      lastName: trimmedLast,
    };

    await inviteUser(payload);
  };

  const handleChangeRole = (member: TeamMember, newRoleId: string) => {
    const payload: UpdateRolePayload = {
      userId: member.id,
      workspaceId: currentWorkspace?.id ?? '',
      roleIds: [newRoleId],
    };
    updateRole(payload);
  };

  const handleRemoveMember = (member: TeamMember) => {
    const payload: RemoveUserPayload = {
      userId: member.id,
      workspaceId: currentWorkspace?.id ?? '',
    };
    removeUser(payload);
  };

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
    if (r === 'org admin') return <Crown className='h-4 w-4 text-yellow-600' />;
    if (r === 'admin') return <Shield className='h-4 w-4 text-blue-600' />;
    return <User className='h-4 w-4 text-gray-600' />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant='default'
            className='text-xs bg-green-100 text-green-800'
          >
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant='secondary'
            className='text-xs bg-yellow-100 text-yellow-800'
          >
            Pending
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant='outline' className='text-xs text-gray-600'>
            Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <UserPlus className='h-5 w-5' />
            Invite Team Member
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='invite-email'>
                  Email Address <span className='text-red-600'>*</span>
                </Label>
                <button
                  type='button'
                  onClick={() =>
                    setUserType((prev) =>
                      prev === 'existing' ? 'new' : 'existing'
                    )
                  }
                  className='text-sm text-blue-600 hover:underline'
                >
                  {userType === 'existing' ? 'Add New' : 'Existing'}
                </button>
              </div>

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
                    className={`${
                      errors.email
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
                <Input
                  id='invite-email'
                  type='email'
                  placeholder='colleague@company.com'
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? 'invite-email-error' : undefined
                  }
                  className={`${
                    errors.email
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                />
              )}

              {errors.email && (
                <p id='invite-email-error' className='text-xs text-red-600'>
                  {errors.email}
                </p>
              )}
            </div>

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
                className={`${
                  errors.firstName
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
                className={`${
                  errors.lastName
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

            <div className='space-y-2'>
              <Label htmlFor='workspace-select'>
                Workspace <span className='text-red-600'>*</span>
              </Label>
              <Select
                value={selectedWorkspace}
                onValueChange={setSelectedWorkspace}
              >
                <SelectTrigger id='workspace-select'>
                  <SelectValue placeholder='Select workspace' />
                </SelectTrigger>
                <SelectContent>
                  {workspaces?.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='role-select'>
                Role <span className='text-red-600'>*</span>
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id='role-select'>
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
                        {role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex justify-end mt-4'>
            <Button
              onClick={handleInviteUser}
              disabled={isPending}
              className='flex items-center gap-2'
            >
              <Mail className='h-4 w-4' />
              {isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <CardTitle>
              Team Members ({filteredMembers.length} of {members.length})
            </CardTitle>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={clearFilters}
                className={`${
                  searchTerm ||
                  filterWorkspace !== 'all' ||
                  filterRole !== 'all' ||
                  filterStatus !== 'all'
                    ? 'opacity-100'
                    : 'opacity-0'
                } transition-opacity`}
              >
                <X className='h-4 w-4 mr-2' />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4 mb-6'>
            <div className='flex flex-col sm:flex-row gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search by name or email...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
              <Button
                variant='outline'
                size='sm'
                className='sm:w-auto bg-transparent'
              >
                <Filter className='h-4 w-4 mr-2' />
                Filters
              </Button>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div>
                <Label
                  htmlFor='workspace-filter'
                  className='text-xs text-gray-600 mb-1 block'
                >
                  Workspace
                </Label>
                <Select
                  value={filterWorkspace}
                  onValueChange={setFilterWorkspace}
                >
                  <SelectTrigger id='workspace-filter'>
                    <SelectValue placeholder='All workspaces' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All workspaces</SelectItem>
                    {availableWorkspaces.map((workspace) => (
                      <SelectItem key={workspace} value={workspace}>
                        {workspace}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor='role-filter'
                  className='text-xs text-gray-600 mb-1 block'
                >
                  Role
                </Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger id='role-filter'>
                    <SelectValue placeholder='All roles' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All roles</SelectItem>
                    {roles?.roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor='status-filter'
                  className='text-xs text-gray-600 mb-1 block'
                >
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id='status-filter'>
                    <SelectValue placeholder='All statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All statuses</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoadingUsers ? (
            <div className='text-center py-8 text-gray-500'>
              <Users className='h-12 w-12 mx-auto mb-3 text-gray-300 animate-pulse' />
              <p>Loading team members...</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {currentMembers.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Users className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                  <p>No team members found matching your criteria.</p>
                  <Button
                    variant='outline'
                    onClick={clearFilters}
                    className='mt-2 bg-transparent'
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                currentMembers.map((member) => (
                  <div
                    key={member.id}
                    className='flex flex-col gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        <Avatar className='h-10 w-10 flex-shrink-0'>
                          <AvatarImage
                            src={member.avatar || '/api/placeholder/40/40'}
                            alt={member.name}
                          />
                          <AvatarFallback className='text-sm'>
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>

                        <div className='flex-1 min-w-0'>
                          <div className='flex flex-wrap items-center gap-2 mb-1'>
                            <h4 className='font-medium text-gray-900 truncate'>
                              {member.name}
                            </h4>
                            {getRoleIcon(member.role)}
                            {getStatusBadge(member.status)}
                          </div>

                          <div className='flex items-center gap-1 text-sm text-gray-600 mb-1'>
                            <Mail className='h-3 w-3' />
                            <span className='truncate'>{member.email}</span>
                          </div>

                          <div className='text-xs text-gray-500'>
                            {member.workspace} • Last active:{' '}
                            {formatLastActive(member.lastActive)}
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        {member.role !== 'Org Admin' && (
                          <>
                            <Select
                              value={member.roleId}
                              onValueChange={(newRoleId) =>
                                handleChangeRole(member, newRoleId)
                              }
                              disabled={isUpdatingRole}
                            >
                              <SelectTrigger className='w-[140px] h-8 text-xs'>
                                <Settings className='h-3 w-3 mr-2' />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roles?.roles?.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleRemoveMember(member)}
                              disabled={isRemovingUser}
                              className='text-red-600 hover:text-red-700'
                            >
                              <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                              <span className='hidden sm:inline sm:ml-2'>
                                {isRemovingUser ? 'Removing...' : 'Remove'}
                              </span>
                            </Button>
                          </>
                        )}

                        {member.role === 'Org Admin' && (
                          <Badge variant='outline' className='text-xs'>
                            Account Owner
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className='sm:hidden grid grid-cols-2 gap-4 pt-3 border-t text-xs'>
                      <div>
                        <span className='font-medium text-gray-900'>Role:</span>
                        <div className='flex items-center gap-1 mt-1'>
                          {getRoleIcon(member.role)}
                          <span className='capitalize'>{member.role}</span>
                        </div>
                      </div>
                      <div>
                        <span className='font-medium text-gray-900'>
                          Status:
                        </span>
                        <div className='mt-1'>
                          {getStatusBadge(member.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t'>
              <div className='text-sm text-gray-600'>
                Showing {startIndex + 1} to{' '}
                {Math.min(endIndex, filteredMembers.length)} of{' '}
                {filteredMembers.length} members
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  Previous
                </Button>

                <div className='flex items-center gap-1'>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setCurrentPage(page)}
                        className='w-8 h-8 p-0'
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className='h-4 w-4 ml-1' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='p-4 border rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <Crown className='h-5 w-5 text-yellow-600' />
                <h4 className='font-medium'>Owner</h4>
              </div>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Full workspace access</li>
                <li>• Manage all settings</li>
                <li>• Add/remove members</li>
                <li>• Delete workspace</li>
                <li>• Billing management</li>
              </ul>
            </div>

            <div className='p-4 border rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <Shield className='h-5 w-5 text-blue-600' />
                <h4 className='font-medium'>Admin</h4>
              </div>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Manage test suites</li>
                <li>• Add/remove members</li>
                <li>• Configure environments</li>
                <li>• View all reports</li>
                <li>• Manage integrations</li>
              </ul>
            </div>

            <div className='p-4 border rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <User className='h-5 w-5 text-gray-600' />
                <h4 className='font-medium'>Member</h4>
              </div>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Create test suites</li>
                <li>• Run tests</li>
                <li>• View own reports</li>
                <li>• Use environments</li>
                <li>• Basic workspace access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <div className='flex-1'>
                <div className='font-medium text-sm'>
                  lisa.wang@external.com
                </div>
                <div className='text-xs text-gray-600'>
                  Invited 3 days ago • Pending
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-xs bg-transparent'
                >
                  Resend
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-xs text-red-600 bg-transparent'
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg'>
              <div className='flex-1'>
                <div className='font-medium text-sm'>mike.j@company.com</div>
                <div className='text-xs text-gray-600'>
                  Invited 1 week ago • Accepted
                </div>
              </div>
              <Badge variant='default' className='text-xs w-fit'>
                Joined
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
