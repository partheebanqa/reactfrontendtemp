import { ReactElement, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown, Edit, PlusCircle, Trash, Settings, Cloud, Server, CheckCircle, Globe, Database } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "../ui/badge";
import { Environment } from "@/shared/types/datamanagement";
import { useDataManagement } from "@/hooks/useDataManagement";
import { useLocation } from "wouter";

interface EnvironmentDropdownProps {
  setEnvironmentModalState: (state: {
    isOpen: boolean;
    mode: "add" | "edit" | "duplicate" | "manage";
    environment: Environment | null;
  }) => void;
  handleDeleteEnvironment: (environmentId: string) => void;
}

export default function EnvironmentDropdown({
  setEnvironmentModalState,
  handleDeleteEnvironment
}: EnvironmentDropdownProps): ReactElement {
  const { environments, activeEnvironment, setActiveEnvironment ,variables} = useDataManagement();
  const [_, setLocation] = useLocation()

  const getEnvironmentColor = (environment: Environment) => {
    const env = environment.name.toLowerCase();
    if (env.includes('prod')) {
      return '#16a34a';
    } else if (env.includes('dev')) {
      return '#2563eb';
    } else if (env.includes('stage')) {
      return '#ca8a04';
    } else if (env.includes('test')) {
      return '#9333ea';
    } else {
      return '#64748b';
    }
  };
  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center space-x-1 sm:space-x-2 max-w-[120px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] h-9 px-2 py-1 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-md shadow-sm"
                size="sm"
                aria-label="Select environment"
              >
                {activeEnvironment && (
                  <>
                    <div
                      className="h-3.5 w-3.5 rounded-full flex-shrink-0 ring-1 ring-opacity-25 ring-gray-400"
                      style={{ backgroundColor: getEnvironmentColor(activeEnvironment) }}
                    />
                    <span className="truncate text-xs sm:text-sm font-semibold">{activeEnvironment.name}</span>
                  </>
                ) }
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Switch between environments</p>
          </TooltipContent>

          <DropdownMenuContent className="w-72 sm:w-80 max-h-[60vh] overflow-y-auto custom-scrollbar p-2 shadow-md rounded-md border border-gray-200">
            <div className="mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-sm text-gray-800 font-semibold mb-1">Environments</h3>
              <p className="text-xs text-gray-500">Select environment to use variables</p>
            </div>

            <div className="mb-3">
              <DropdownMenuItem
                onClick={() =>
                  setLocation('/settings/account?tab=environments')
                }
                className="text-gray-600 font-medium text-xs sm:text-sm py-2 hover:bg-gray-50 rounded-md border border-gray-100 shadow-sm"
              >
                <Settings className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Manage Environments
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="my-2" />

            {environments.length === 0 ? (
              <p className="text-xs text-gray-500 p-2 italic">No environments available</p>
            ) : (
              <div className="space-y-1">
                {environments.map((environment) => {
                  const isSelected = activeEnvironment?.id === environment.id;
                  return (
                    <DropdownMenuItem
                      key={environment.id}
                      onClick={() => setActiveEnvironment(environment)}
                      className={`justify-between text-xs sm:text-sm py-2 rounded-md ${isSelected
                        ? "bg-gray-50 text-gray-800 border border-gray-200 shadow-sm"
                        : "hover:bg-gray-50 border border-transparent hover:border-gray-100"
                        }`}
                    >
                      <div className="flex items-center">
                        <div
                          className="h-3 w-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: getEnvironmentColor(environment) }}
                        />
                        <span className="font-medium truncate mr-2">{environment.name}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}

            {/* <DropdownMenuSeparator className="my-3" />

            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <Database className="h-3 w-3 mr-1 text-gray-500" />
                Environment Variables
              </h3>
              {activeEnvironment ? (
                <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {variables.map((value,key) => (
                    <div key={key} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-100 last:border-0">
                      <span className="font-mono text-gray-700 font-medium">{value.name}</span>
                      <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {value.initialValue}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Select an environment to see variables</p>
              )}
            </div> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
