import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Mail, MoreHorizontal, Crown, Settings, Trash2, Building2, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  workspace: string;
  avatar?: string;
}

export function PeopleManagement() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Fetch workspaces
  const { data: workspaces = [] } = useQuery({
    queryKey: ['/api/workspaces'],
    enabled: true,
  });

  const [members] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'demo@example.com',
      role: 'owner',
      status: 'active',
      lastActive: '2024-01-15T10:30:00Z',
      workspace: 'Main Workspace'
    },
    {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      role: 'admin',
      status: 'active',
      lastActive: '2024-01-14T16:45:00Z',
      workspace: 'Main Workspace'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.j@company.com',
      role: 'member',
      status: 'active',
      lastActive: '2024-01-14T09:15:00Z',
      workspace: 'Client Projects'
    },
    {
      id: '4',
      name: 'Lisa Wang',
      email: 'lisa.wang@external.com',
      role: 'member',
      status: 'pending',
      lastActive: '2024-01-10T14:20:00Z',
      workspace: 'Client Projects'
    },
    {
      id: '5',
      name: 'Alex Rivera',
      email: 'alex.rivera@company.com',
      role: 'admin',
      status: 'active',
      lastActive: '2024-01-13T11:30:00Z',
      workspace: 'Development'
    },
    {
      id: '6',
      name: 'Emma Thompson',
      email: 'emma.t@company.com',
      role: 'member',
      status: 'inactive',
      lastActive: '2024-01-05T15:45:00Z',
      workspace: 'Development'
    },
    {
      id: '7',
      name: 'David Park',
      email: 'david.park@company.com',
      role: 'member',
      status: 'active',
      lastActive: '2024-01-14T13:10:00Z',
      workspace: 'Testing'
    },
    {
      id: '8',
      name: 'Rachel Green',
      email: 'rachel.green@company.com',
      role: 'admin',
      status: 'active',
      lastActive: '2024-01-15T08:20:00Z',
      workspace: 'Testing'
    },
    {
      id: '9',
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      role: 'member',
      status: 'active',
      lastActive: '2024-01-14T17:30:00Z',
      workspace: 'Main Workspace'
    },
    {
      id: '10',
      name: 'Maria Garcia',
      email: 'maria.garcia@company.com',
      role: 'member',
      status: 'pending',
      lastActive: '2024-01-12T10:15:00Z',
      workspace: 'Development'
    }
  ]);

  // Get unique workspaces for filtering
  const availableWorkspaces = useMemo(() => {
    return [...new Set(members.map(member => member.workspace))];
  }, [members]);

  // Filter and search logic
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesWorkspace = filterWorkspace === 'all' || member.workspace === filterWorkspace;
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
      
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

  const handleInviteUser = () => {
    if (!inviteEmail || !selectedWorkspace) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Simulate API call
    toast({
      title: 'Invitation sent',
      description: `Invitation sent to ${inviteEmail}`,
    });
    
    setInviteEmail('');
    setSelectedWorkspace('');
    setSelectedRole('member');
  };

  const handleChangeRole = (member: TeamMember, newRole: string) => {
    toast({
      title: 'Role Updated',
      description: `${member.name} is now a ${newRole}`,
    });
  };

  const handleRemoveMember = (member: TeamMember) => {
    toast({
      title: 'Member Removed',
      description: `${member.name} has been removed from the workspace`,
      variant: 'destructive',
    });
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
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'member':
        return <Users className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-xs text-gray-600">Inactive</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite New User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workspace-select">Workspace</Label>
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger id="workspace-select">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkspaces.map((workspace) => (
                    <SelectItem key={workspace} value={workspace}>
                      {workspace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role-select">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleInviteUser} className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send Invitation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Team Members ({filteredMembers.length} of {members.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className={`${searchTerm || filterWorkspace !== 'all' || filterRole !== 'all' || filterStatus !== 'all' ? 'opacity-100' : 'opacity-0'} transition-opacity`}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="workspace-filter" className="text-xs text-gray-600 mb-1 block">
                  Workspace
                </Label>
                <Select value={filterWorkspace} onValueChange={setFilterWorkspace}>
                  <SelectTrigger id="workspace-filter">
                    <SelectValue placeholder="All workspaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All workspaces</SelectItem>
                    {availableWorkspaces.map((workspace) => (
                      <SelectItem key={workspace} value={workspace}>
                        {workspace}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role-filter" className="text-xs text-gray-600 mb-1 block">
                  Role
                </Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger id="role-filter">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status-filter" className="text-xs text-gray-600 mb-1 block">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {currentMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No team members found matching your criteria.</p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              currentMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Main Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={member.avatar || "/api/placeholder/40/40"} alt={member.name} />
                        <AvatarFallback className="text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {member.name}
                          </h4>
                          {getRoleIcon(member.role)}
                          {getStatusBadge(member.status)}
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {member.workspace} • Last active: {formatLastActive(member.lastActive)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {member.role !== 'owner' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeRole(member, member.role === 'admin' ? 'member' : 'admin')}
                          >
                            <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                              {member.role === 'admin' ? 'Make Member' : 'Make Admin'}
                            </span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline sm:ml-2">Remove</span>
                          </Button>
                        </>
                      )}
                      
                      {member.role === 'owner' && (
                        <Badge variant="outline" className="text-xs">
                          Account Owner
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Mobile: Additional Info */}
                  <div className="sm:hidden grid grid-cols-2 gap-4 pt-3 border-t text-xs">
                    <div>
                      <span className="font-medium text-gray-900">Role:</span>
                      <div className="flex items-center gap-1 mt-1">
                        {getRoleIcon(member.role)}
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Status:</span>
                      <div className="mt-1">
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length} members
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium">Owner</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Full workspace access</li>
                <li>• Manage all settings</li>
                <li>• Add/remove members</li>
                <li>• Delete workspace</li>
                <li>• Billing management</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Admin</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Manage test suites</li>
                <li>• Add/remove members</li>
                <li>• Configure environments</li>
                <li>• View all reports</li>
                <li>• Manage integrations</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-gray-600" />
                <h4 className="font-medium">Member</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
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

      {/* Invitation History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">lisa.wang@external.com</div>
                <div className="text-xs text-gray-600">Invited 3 days ago • Pending</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Resend
                </Button>
                <Button variant="outline" size="sm" className="text-xs text-red-600">
                  Cancel
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">mike.j@company.com</div>
                <div className="text-xs text-gray-600">Invited 1 week ago • Accepted</div>
              </div>
              <Badge variant="default" className="text-xs w-fit">
                Joined
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}