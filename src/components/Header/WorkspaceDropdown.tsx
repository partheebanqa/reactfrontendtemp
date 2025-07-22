import { ReactElement } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ChevronDown, Edit, PlusCircle, Trash } from "lucide-react";

interface WorkspaceDropdownProps {
  setWorkspaceModalState: (state: {
    isOpen: boolean;
    mode: "add" | "edit";
    workspace: any;
  }) => void;
  handleDeleteWorkspace: (workspaceId: string) => void;
}

export default function WorkspaceDropdown({ setWorkspaceModalState, handleDeleteWorkspace }: WorkspaceDropdownProps): ReactElement {
    const {
        currentWorkspace,
        workspaces,
        setCurrentWorkspace,
      } = useWorkspace();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center space-x-1 sm:space-x-2 max-w-[120px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] h-9 px-2 py-1"
            size="sm"
          >
            <span className="truncate text-xs sm:text-sm">{currentWorkspace?.name || "Select Workspace"}</span>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 sm:w-56 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {workspaces.map((workspace) => {
            return (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => setCurrentWorkspace(workspace)}
                className={`${
                  currentWorkspace?.id === workspace.id ? "bg-gray-100" : ""
                } justify-between text-xs sm:text-sm py-1`}
              >
                <span className="font-medium truncate mr-2">{workspace.name}</span>
                {currentWorkspace?.id === workspace.id && (
                  <div className="flex-shrink-0 flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent dropdown item
                        setWorkspaceModalState({
                          isOpen: true,
                          mode: "edit",
                          workspace,
                        });
                      }}
                    >
                      <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent dropdown item
                        handleDeleteWorkspace(workspace.id);
                      }}
                    >
                      <Trash className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              setWorkspaceModalState({
                isOpen: true,
                mode: "add",
                workspace: null,
              })
            }
            className="text-blue-600 font-medium text-xs sm:text-sm py-1"
          >
            <PlusCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Add New Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
