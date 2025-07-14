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
          <Button variant="outline" className="flex items-center space-x-2">
            {currentWorkspace?.name || "Select Workspace"}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {workspaces.map((workspace) => {
            return (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => setCurrentWorkspace(workspace)}
                className={`${
                  currentWorkspace?.id === workspace.id ? "bg-gray-100" : ""
                } justify-between`}
              >
                <span className="font-medium">{workspace.name}</span>
                {currentWorkspace?.id === workspace.id && (
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent dropdown item
                        setWorkspaceModalState({
                          isOpen: true,
                          mode: "edit",
                          workspace,
                        });
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={(e) => handleDeleteWorkspace(workspace.id)}
                    >
                      <Trash className="h-3 w-3 " />
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
            className="text-blue-600 font-medium"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
