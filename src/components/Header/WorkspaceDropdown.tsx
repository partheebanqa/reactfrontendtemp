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
import { ChevronDown, Edit, PlusCircle, Trash, Building, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center space-x-1 sm:space-x-2 max-w-[120px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] h-9 px-2 py-1 border-blue-100 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                size="sm"
                aria-label="Select workspace"
              >
                <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                <span className="truncate text-xs sm:text-sm font-medium">{currentWorkspace?.name || "Select Workspace"}</span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Switch between workspaces</p>
          </TooltipContent>
          
          <DropdownMenuContent className="w-56 sm:w-64 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
            <div className="mb-2 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700 font-medium">Workspaces</p>
              <p className="text-xs text-gray-500">Manage your project workspaces</p>
            </div>
            
            <DropdownMenuItem
              onClick={() =>
                setWorkspaceModalState({
                  isOpen: true,
                  mode: "add",
                  workspace: null,
                })
              }
              className="text-blue-600 font-medium text-xs sm:text-sm py-2 hover:bg-blue-50 rounded-md"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Add New Workspace
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2" />
            
            {workspaces.length === 0 ? (
              <p className="text-xs text-gray-500 p-2">No workspaces available</p>
            ) : (
              <div className="space-y-1">
                {workspaces.map((workspace) => {
                  const isSelected = currentWorkspace?.id === workspace.id;
                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => setCurrentWorkspace(workspace)}
                      className={`justify-between text-xs sm:text-sm py-2 rounded-md ${
                        isSelected 
                          ? "bg-blue-50 text-blue-700" 
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <Building className="h-3.5 w-3.5 mr-2 text-gray-500" />
                        <span className="font-medium truncate mr-2">
                          {workspace.name}
                        </span>
                        {isSelected && (
                          <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-blue-100"
                            title="Edit workspace"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent dropdown item
                              setWorkspaceModalState({
                                isOpen: true,
                                mode: "edit",
                                workspace,
                              });
                            }}
                          >
                            <Edit className="h-3 w-3 text-blue-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-red-100"
                            title="Delete workspace"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent dropdown item
                              handleDeleteWorkspace(workspace.id);
                            }}
                          >
                            <Trash className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
