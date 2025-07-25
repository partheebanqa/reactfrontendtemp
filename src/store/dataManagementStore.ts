import { DataManagementState } from "@/shared/types/datamanagement";
import { Store, useStore } from "@tanstack/react-store";


// Initial state for data management
export const initialDataManagementState: DataManagementState = {
  environments: [],
  activeEnvironment: null,
  isLoading: false,
};


// Create the store
export const dataManagementStore = new Store<DataManagementState>(
  initialDataManagementState
);

// Define actions to update the store
export const dataManagementActions = {
  setEnvironments: (environments: DataManagementState['environments']) => {
    dataManagementStore.setState((state) => ({
      ...state,
      environments,
    }));
  },

  setActiveEnvironment: (environment: DataManagementState['activeEnvironment']) => {
    dataManagementStore.setState((state) => ({
      ...state,
      activeEnvironment: environment,
    }));
  }
  
};

// Hook to use the data management store
export const useDataManagementStore = () => {
  return useStore(dataManagementStore);
};
