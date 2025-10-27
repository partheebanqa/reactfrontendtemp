'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    getUserList,
    getUserRoles,
    updateUserRole,
    removeUserFromWorkspace,
} from '@/services/managePeople.service';
import { Search, Crown, UserCog, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// ===== API shapes (liberal to match your samples) =====
type ApiWorkspace = { id: string; name: string };
type ApiUser = {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role?: string; // "Org Admin" | "Admin" | "User" | "" | undefined
    roles?: string[]; // sometimes present in other screens
    workspaces: ApiWorkspace[] | null;
    createdAt: string;
};
type RolesResponse = {
    roles: { id: string; name: string }[];
};
type UsersResponse = {
    users: ApiUser[];
};

// ===== Internal View Model to keep UI predictable =====
type ViewUser = {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
    rows: Array<{
        // each row = a workspace membership line
        key: string; // synthetic (userId:workspaceId)
        workspaceId: string;
        workspaceName: string;
        roleLabel: string; // “Org Admin” | “Admin” | “User” | “” (label)
    }>;
};

// ===== Helpers =====
const norm = (s?: string) => (s || '').trim().toLowerCase();

const displayRoleName = (name?: string) => {
    const n = norm(name);
    return n === 'org admin' ? 'Account Owner' : name || '';
};

const roleBadgeClass = (label: string) => {
    const n = norm(label);
    if (n === 'org admin') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (n === 'admin') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (n === 'user') return 'bg-gray-50 text-gray-700 border-gray-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
};

const RoleIcon = ({ label }: { label: string }) => {
    const n = norm(label);
    if (n === 'org admin') return <Crown className="w-4 h-4 text-amber-500" />;
    if (n === 'admin') return <UserCog className="w-4 h-4 text-blue-500" />;
    return null;
};

const initials = (first?: string, last?: string, email?: string) => {
    const f = (first || '').trim();
    const l = (last || '').trim();
    if (f || l) return (f[0] || '') + (l[0] || '');
    if (email) return email.slice(0, 2);
    return 'U';
};

// ======================================================

export default function UserManagement() {
    const { toast } = useToast();

    // Data
    const { data: usersResp, isLoading: isLoadingUsers, refetch } = useQuery<UsersResponse>({
        queryKey: ['userList'],
        queryFn: getUserList,
    });

    const { data: rolesResp, isLoading: isLoadingRoles } = useQuery<RolesResponse>({
        queryKey: ['userRoles'],
        queryFn: getUserRoles,
    });

    const roles = rolesResp?.roles ?? [];

    // Mutations
    const { mutateAsync: mutateUpdateRole, isPending: isUpdating } = useMutation({
        mutationFn: updateUserRole, // ({ userId, workspaceId, roleId })
        onSuccess: () => {
            toast({ title: 'Success', description: 'Role updated successfully!' });
            refetch();
        },
        onError: (e: any) =>
            toast({
                title: 'Error',
                description: e?.message || 'Failed to update role',
                variant: 'destructive',
            }),
    });

    const { mutateAsync: mutateRemove, isPending: isRemoving } = useMutation({
        mutationFn: removeUserFromWorkspace, // ({ userId, workspaceId })
        onSuccess: () => {
            toast({ title: 'Removed', description: 'User removed from workspace.' });
            refetch();
        },
        onError: (e: any) =>
            toast({
                title: 'Error',
                description: e?.message || 'Failed to remove user',
                variant: 'destructive',
            }),
    });

    // Transform API -> View model
    const users: ViewUser[] = useMemo(() => {
        const arr = usersResp?.users ?? [];
        return arr.map((u) => {
            // role could be in .role (string) or .roles[0]
            const userRole =
                (typeof u.role === 'string' && u.role) ||
                (Array.isArray(u.roles) && u.roles[0]) ||
                '';

            const rows =
                (u.workspaces ?? []).map((w) => ({
                    key: `${u.id}:${w.id}`,
                    workspaceId: w.id,
                    workspaceName: w.name,
                    roleLabel: userRole,
                })) || [];

            // If no workspace, still show the user with a single row “No Workspace”
            if (rows.length === 0) {
                rows.push({
                    key: `${u.id}:noworkspace`,
                    workspaceId: '',
                    workspaceName: 'No Workspace',
                    roleLabel: userRole,
                });
            }

            return {
                id: u.id,
                fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
                email: u.email,
                createdAt: u.createdAt,
                rows,
            };
        });
    }, [usersResp]);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | string>('all');
    const [workspaceFilter, setWorkspaceFilter] = useState<'all' | string>('all');

    // Build filter options from data
    const workspaceOptions = useMemo(() => {
        const m = new Map<string, string>();
        users.forEach((u) =>
            u.rows.forEach((r) => {
                if (r.workspaceId) m.set(r.workspaceId, r.workspaceName);
            })
        );
        return Array.from(m, ([id, name]) => ({ id, name }));
    }, [users]);

    const roleOptions = useMemo(() => {
        // Use backend roles (preferred), but also include any extra labels that slipped in API
        const presentLabels = new Set<string>();
        users.forEach((u) => u.rows.forEach((r) => r.roleLabel && presentLabels.add(r.roleLabel)));
        const extra = Array.from(presentLabels).filter(
            (lbl) => !roles.some((rr) => norm(rr.name) === norm(lbl))
        );
        return [...roles, ...extra.map((x) => ({ id: `__lbl__${x}`, name: x }))];
    }, [roles, users]);

    // Apply filters + search
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users
            .map((u) => {
                const nameMatch =
                    !q ||
                    u.fullName.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q);

                if (!nameMatch) return null;

                const rows = u.rows.filter((r) => {
                    const wf =
                        workspaceFilter === 'all' || r.workspaceId === workspaceFilter;
                    const rf =
                        roleFilter === 'all' ||
                        norm(r.roleLabel) === norm(
                            roles.find((rr) => rr.id === roleFilter)?.name || roleFilter
                        );
                    return wf && rf;
                });

                return rows.length ? { ...u, rows } : null;
            })
            .filter(Boolean) as ViewUser[];
    }, [users, search, roleFilter, workspaceFilter, roles]);

    // Handlers
    const handleChangeRole = async (userId: string, workspaceId: string, newRoleId: string) => {
        if (!newRoleId) return;
        await mutateUpdateRole({ userId, workspaceId, roleId: newRoleId });
    };

    const handleRemove = async (userId: string, workspaceId: string) => {
        if (!workspaceId) return; // can't remove from "No Workspace" row
        if (!confirm('Remove this user from the workspace?')) return;
        await mutateRemove({ userId, workspaceId });
    };

    // UI
    if (isLoadingUsers) {
        return (
            <div className="p-6 border rounded-lg text-gray-500">
                Loading users…
            </div>
        );
    }

    return (
        <div className="border bg-white rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-1">Team Members {filtered?.length}</h2>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        className="pl-9"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="All workspaces" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All workspaces</SelectItem>
                        {workspaceOptions.map((ws) => (
                            <SelectItem key={ws.id} value={ws.id}>
                                {ws.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        {roleOptions.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                                {displayRoleName(r.name)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-gray-500 text-sm py-8 text-center border rounded-lg">
                        No users match the current filters.
                    </div>
                ) : (
                    filtered.map((u) => (
                        <div key={u.id} className="border rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                                    {initials(u.fullName.split(' ')[0], u.fullName.split(' ')[1], u.email)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{u.fullName}</div>
                                    <div className="text-sm text-gray-600 truncate">{u.email}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {u.rows.map((r) => (
                                    <div
                                        key={r.key}
                                        className="flex items-center justify-between gap-3 border rounded-md p-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {r.workspaceName}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <RoleIcon label={r.roleLabel} />
                                                <span>{displayRoleName(r.roleLabel)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Change role */}
                                            <Select
                                                onValueChange={(newRoleId) =>
                                                    handleChangeRole(u.id, r.workspaceId, newRoleId)
                                                }
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Change role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {isLoadingRoles ? (
                                                        <SelectItem value="loading" disabled>
                                                            Loading…
                                                        </SelectItem>
                                                    ) : roles.length === 0 ? (
                                                        <SelectItem value="no-roles" disabled>
                                                            No roles
                                                        </SelectItem>
                                                    ) : (
                                                        roles.map((role) => (
                                                            <SelectItem key={role.id} value={role.id}>
                                                                {displayRoleName(role.name)}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            {/* Remove from workspace */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                disabled={!r.workspaceId || isRemoving || isUpdating}
                                                onClick={() => handleRemove(u.id, r.workspaceId)}
                                                title={r.workspaceId ? 'Remove from workspace' : 'No workspace'}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
