import { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Ghost,
  Palette,
  HelpCircle,
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
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useLocation } from "wouter";
import WorkspaceModal from "../WorkspaceModal";
import WorkspaceDropdown from "./WorkspaceDropdown";
import { useToast } from "@/hooks/useToast";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("light");
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    refreshWorkspaces,
    createWorkspaceMutation,
    updateWorkspaceMutation,
    deleteWorkspaceMutation,
  } = useWorkspace();
  const [workspaceModalState, setWorkspaceModalState] = useState({
    isOpen: false,
    mode: "add" as "add" | "edit",
    workspace: null as any,
  });
  const [_, setLocation] = useLocation();
  const { success } = useToast();

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
        createWorkspaceMutation.mutate(workspaceData, {
          onSuccess: (response) => {
            const currWorkspace = workspaces.find(
              (ws) => ws.id === response?.workspaceId
            );
            if (currWorkspace) {
              setCurrentWorkspace(currWorkspace);
            }
            success("Workspace created successfully.");
          },
        });
      } else {
        updateWorkspaceMutation.mutate(workspaceData, {
          onSuccess: (data) => {
            const currWorkspace = workspaces.find(
              (ws) => ws.id === workspaceData.id
            );
            setCurrentWorkspace(currWorkspace || null);
            success("Workspace updated successfully.");
          },
        });
      }
      setWorkspaceModalState({ ...workspaceModalState, isOpen: false });
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
      deleteWorkspaceMutation.mutate(currentWorkspace.id, {
        onSuccess: () => {
          if (workspaces.length > 0) {
            setCurrentWorkspace(workspaces[0]);
          } else {
            setCurrentWorkspace(null);
          }
        },
      });
    } catch (error) {
      console.error("Error deleting workspace:", error);
    }
  };

  const themes = [
    { id: "light", icon: Sun, tooltip: "Light Theme" },
    { id: "dark", icon: Moon, tooltip: "Dark Theme" },
    { id: "neutral", icon: Ghost, tooltip: "Neutral Blue Theme" },
    { id: "custom", icon: Palette, tooltip: "Purple Theme" },
  ];

  const handleRedirect = (path: string) => {
    setLocation(path);
  };

  return (
    <header className="border-b bg-white dark:bg-gray-900 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <WorkspaceDropdown
            setWorkspaceModalState={setWorkspaceModalState}
            handleDeleteWorkspace={handleDeleteWorkspace}
          />
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
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
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
                      (user as any)?.firstName || "Test",
                      (user as any)?.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium">
                    {(user as any)?.firstName || "Test"}{" "}
                    {(user as any)?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(user as any)?.role}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-blue-800 font-medium">U</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      John Doe
                    </p>
                    <p className="text-xs text-gray-500">
                      john.doe@example.com
                    </p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-gray-500 mb-2 pl-2">
                  Theme
                </p>
                <div className="flex items-center justify-between gap-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                  {themes.map((themeOption) => (
                    <div
                      key={themeOption.id}
                      className="relative group"
                      data-tooltip-id={`theme-tooltip-${themeOption.id}`}
                    >
                      <button
                        onClick={() => setTheme(themeOption.id as any)}
                        className={`p-2 rounded-md transition-all duration-200 ${
                          theme === themeOption.id
                            ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        aria-label={themeOption.tooltip}
                      >
                        <themeOption.icon size={18} />
                      </button>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {themeOption.tooltip}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleRedirect("/settings/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Your Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRedirect("/settings/account")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRedirect("/settings/help")}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
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
