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
import NotificationBell from "./Notifications/NotificationBell";
import { HelpModal } from "../HelpModal/HelpModal";

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
  const [showHelpModal, setShowHelpModal] = useState(false);
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
        `Error ${workspaceModalState.mode === "add" ? "creating" : "updating"
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
    <header className="border-b bg-white dark:bg-gray-900 px-2 sm:px-6 py-2 sm:py-4">
      <div className="flex items-center justify-end gap-4 sm:gap-6  mx-auto">
        <div className="flex items-center gap-1 sm:gap-4 min-w-0">
           <WorkspaceDropdown
            setWorkspaceModalState={setWorkspaceModalState}
            handleDeleteWorkspace={handleDeleteWorkspace}
          />
          {/* <WorkspaceDropdown
            setWorkspaceModalState={setWorkspaceModalState}
            handleDeleteWorkspace={handleDeleteWorkspace}
          /> */}
          <div className=" xs:block">
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer">
                  <AvatarImage src={(user as any)?.profileImageUrl} />
                  <AvatarFallback>
                    {getInitials(
                      (user as any)?.firstName || "Test",
                      (user as any)?.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-blue-800 font-medium">
                      {getInitials(
                        (user as any)?.firstName || "Test",
                        (user as any)?.lastName
                      )}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {(user as any)?.firstName || "Test"}{" "}
                      {(user as any)?.lastName || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(user as any)?.email || "user@example.com"}
                    </p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleRedirect("/settings/account")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
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
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </header>
  );
}
