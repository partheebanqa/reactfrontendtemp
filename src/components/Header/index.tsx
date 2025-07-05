import { useState } from "react";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown,
  PlusCircle,
  Edit,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiRequest } from "@/lib/queryClient";
import { API_WORKSPACES } from "@/config/apiRoutes";
import { useLocation } from "wouter";
import { Workspace } from "@/shared/types/workspace";
import { create } from "domain";
import { createWorkspace, updateWorkspace } from "@/service/workspace.service";
import WorkspaceModal from "../WorkspaceModal";
import WorkspaceDropdown from "./WorkspaceDropdown";

export default function Header() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    refreshWorkspaces,
  } = useWorkspace();
  const [workspaceModalState, setWorkspaceModalState] = useState({
    isOpen: false,
    mode: "add" as "add" | "edit",
    workspace: null as any,
  });
  const [location, setLocation] = useLocation();

  if (isLoading || !user) {
    return null;
  }

  const handleLogout = async () => {
    logoutMutation.mutate();
    setLocation("/");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleSaveWorkspace = async (workspaceData: any) => {
    try {
      if (workspaceModalState.mode === "add") {
        const response = await createWorkspace(workspaceData);
        const currWorkspace = workspaces.find(
          (ws) => ws.id === response?.workspaceId
        );
        setCurrentWorkspace(currWorkspace as Workspace); // Set the newly created workspace as current
        console.log("Workspace created successfully:", response);
      } else {
        // Update existing workspace
        const response = await updateWorkspace(workspaceData);

        const data = await response.json();
        const currWorkspace = workspaces.find(
          (ws) => ws.id === workspaceData.id
        );
        setCurrentWorkspace(currWorkspace as Workspace); // Set the newly created workspace as current
        console.log("Workspace updated successfully:", data);
      }

      // Refresh the workspaces list
      refreshWorkspaces();

      return true;
    } catch (error) {
      console.error(
        `Error ${
          workspaceModalState.mode === "add" ? "creating" : "updating"
        } workspace:`,
        error
      );
      throw error;
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;
    try {
      await apiRequest("DELETE", `${API_WORKSPACES}/${currentWorkspace.id}`);
      setCurrentWorkspace(workspaces[0] || null); // Set to first workspace or null if none exist
      refreshWorkspaces();
    } catch (error) {
      console.error("Error deleting workspace:", error);
    }
  };

  return (
    <header className="border-b bg-white dark:bg-gray-900 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
            <WorkspaceDropdown setWorkspaceModalState={setWorkspaceModalState} handleDeleteWorkspace={handleDeleteWorkspace} />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tests, endpoints, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Right side - Workspace info & user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(user as any)?.profileImageUrl} />
                  <AvatarFallback>
                    {getInitials(
                      (user as any)?.firstName,
                      (user as any)?.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(user as any)?.role}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <WorkspaceModal
        isOpen={workspaceModalState.isOpen}
        onClose={() =>
          setWorkspaceModalState({ ...workspaceModalState, isOpen: false })
        }
        onSaveWorkspace={handleSaveWorkspace}
        workspace={workspaceModalState.workspace}
        mode={workspaceModalState.mode}
      />
    </header>
  );
}
