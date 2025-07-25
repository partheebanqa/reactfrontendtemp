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
import { Environment as BaseEnvironment } from "@/shared/types/datamanagement";
import { useDataManagement } from "@/hooks/useDataManagement";

// Extend the Environment type for our UI needs
interface Environment extends BaseEnvironment {
  type?: "production" | "development" | "staging" | "testing" | "custom";
  color?: string;
}



interface EnvironmentDropdownProps {
  setEnvironmentModalState: (state: {
    isOpen: boolean;
    mode: "add" | "edit" | "duplicate" | "manage";
    environment: Environment | null;
  }) => void;
  handleDeleteEnvironment: (environmentId: string) => void;
}

// Mock data for environments (normally would come from a hook or context)
const mockEnvironments: Environment[] = [
  {
    id: "1",
    name: "Production",
    description: "Production environment",
    baseUrl: "https://api.example.com",
    variables: {
      "API_URL": "https://api.example.com",
      "API_KEY": "prod-key-xxx"
    },
    isDefault: false,
    createdAt: new Date().toISOString(),
    type: "production" as any,
    color: "#16a34a" // green-600
  },
  {
    id: "2",
    name: "Development",
    description: "Development environment",
    baseUrl: "https://dev-api.example.com",
    variables: {
      "API_URL": "https://dev-api.example.com",
      "API_KEY": "dev-key-xxx"
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    type: "development" as any,
    color: "#2563eb" // blue-600
  },
  {
    id: "3",
    name: "Staging",
    description: "Staging environment",
    baseUrl: "https://staging-api.example.com",
    variables: {
      "API_URL": "https://staging-api.example.com",
      "API_KEY": "staging-key-xxx"
    },
    isDefault: false,
    createdAt: new Date().toISOString(),
    type: "staging" as any,
    color: "#ca8a04" // yellow-600
  },
  {
    id: "4",
    name: "Testing",
    description: "Testing environment",
    baseUrl: "https://test-api.example.com",
    variables: {
      "API_URL": "https://test-api.example.com",
      "API_KEY": "test-key-xxx"
    },
    isDefault: false,
    createdAt: new Date().toISOString(),
    type: "testing" as any,
    color: "#9333ea" // purple-600
  }
];

export default function EnvironmentDropdown({
  setEnvironmentModalState,
  handleDeleteEnvironment
}: EnvironmentDropdownProps): ReactElement {
  const {environments,activeEnvironment} = useDataManagement();
  console.log("🚀 ~ environments:", environments,activeEnvironment)
  // In a real app, you'd use a hook or context for this state
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment | null>(mockEnvironments[1]); // Default to Development
  // const environments = mockEnvironments;

  // Get appropriate icon based on environment type
  const getEnvironmentIcon = (type: Environment['type']) => {
    switch (type) {
      case 'production':
        return <Globe className="h-3.5 w-3.5 mr-2" />;
      case 'development':
        return <Server className="h-3.5 w-3.5 mr-2" />;
      case 'staging':
        return <Database className="h-3.5 w-3.5 mr-2" />;
      case 'testing':
        return <Cloud className="h-3.5 w-3.5 mr-2" />;
      default:
        return <Settings className="h-3.5 w-3.5 mr-2" />;
    }
  };

  // Get badge color based on environment type
  const getEnvironmentColor = (environment: Environment) => {
    if (environment.color) return environment.color;

    switch (environment.type) {
      case 'production':
        return '#16a34a'; // green-600
      case 'development':
        return '#2563eb'; // blue-600 
      case 'staging':
        return '#ca8a04'; // yellow-600
      case 'testing':
        return '#9333ea'; // purple-600
      default:
        return '#64748b'; // slate-500
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
                {currentEnvironment ? (
                  <>
                    <div
                      className="h-3.5 w-3.5 rounded-full flex-shrink-0 ring-1 ring-opacity-25 ring-gray-400"
                      style={{ backgroundColor: getEnvironmentColor(currentEnvironment) }}
                    />
                    <span className="truncate text-xs sm:text-sm font-semibold">{currentEnvironment.name}</span>
                  </>
                ) : (
                  <>
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm font-medium">No Environment</span>
                  </>
                )}
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Switch between environments</p>
          </TooltipContent>

          <DropdownMenuContent className="w-64 sm:w-72 max-h-[60vh] overflow-y-auto custom-scrollbar p-2 shadow-md rounded-md border border-gray-200">
            <div className="mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-sm text-gray-800 font-semibold mb-1">Environments</h3>
              <p className="text-xs text-gray-500">Select environment to use variables</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <DropdownMenuItem
                onClick={() =>
                  setEnvironmentModalState({
                    isOpen: true,
                    mode: "add",
                    environment: null,
                  })
                }
                className="text-blue-600 font-medium text-xs sm:text-sm py-2 hover:bg-blue-50 rounded-md border border-gray-100 shadow-sm"
              >
                <PlusCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                New
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  setEnvironmentModalState({
                    isOpen: true,
                    mode: "manage",
                    environment: null,
                  })
                }
                className="text-gray-600 font-medium text-xs sm:text-sm py-2 hover:bg-gray-50 rounded-md border border-gray-100 shadow-sm"
              >
                <Settings className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Manage
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={() => setCurrentEnvironment(null)}
              className={`justify-between text-xs sm:text-sm py-2 rounded-md mb-1 ${!currentEnvironment
                  ? "bg-gray-50 text-gray-800 border border-gray-200"
                  : "hover:bg-gray-50 border border-transparent hover:border-gray-100"
                }`}
            >
              <div className="flex items-center">
                <Settings className="h-3.5 w-3.5 mr-2 text-gray-500" />
                <span className="font-medium truncate mr-2">No Environment</span>
                {!currentEnvironment && (
                  <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                )}
              </div>
            </DropdownMenuItem>

            {environments.length === 0 ? (
              <p className="text-xs text-gray-500 p-2 italic">No environments available</p>
            ) : (
              <div className="space-y-1">
                {environments.map((environment) => {
                  const isSelected = currentEnvironment?.id === environment.id;
                  return (
                    <DropdownMenuItem
                      key={environment.id}
                      onClick={() => setCurrentEnvironment(environment)}
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
                        {isSelected && (
                          <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-blue-100"
                          title="Edit environment"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent dropdown item
                            setEnvironmentModalState({
                              isOpen: true,
                              mode: "edit",
                              environment,
                            });
                          }}
                        >
                          <Edit className="h-3 w-3 text-blue-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-blue-100"
                          title="Duplicate environment"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEnvironmentModalState({
                              isOpen: true,
                              mode: "duplicate",
                              environment,
                            });
                          }}
                        >
                          <PlusCircle className="h-3 w-3 text-blue-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-red-100"
                          title="Delete environment"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnvironment(environment.id);
                          }}
                        >
                          <Trash className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}

            <DropdownMenuSeparator className="my-3" />

            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <Database className="h-3 w-3 mr-1 text-gray-500" />
                Environment Variables
              </h3>
              {currentEnvironment ? (
                <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {Object.entries(currentEnvironment.variables).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-100 last:border-0">
                      <span className="font-mono text-gray-700 font-medium">{key}</span>
                      <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {key.includes("KEY") || key.includes("SECRET") || key.includes("PASSWORD") ? "••••••••" : value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Select an environment to see variables</p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
