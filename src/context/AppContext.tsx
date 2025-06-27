import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Workspace, RequestChain, AuthToken, ExecutionLog } from '../shared/types/chainRequestTypes';

interface AppState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  requestChains: RequestChain[];
  authTokens: AuthToken[];
  executionLogs: ExecutionLog[];
  isExecuting: boolean;
}

type AppAction =
  | { type: 'SET_WORKSPACE'; payload: Workspace }
  | { type: 'ADD_WORKSPACE'; payload: Workspace }
  | { type: 'UPDATE_WORKSPACE'; payload: Workspace }
  | { type: 'DELETE_WORKSPACE'; payload: string }
  | { type: 'SET_REQUEST_CHAINS'; payload: RequestChain[] }
  | { type: 'ADD_REQUEST_CHAIN'; payload: RequestChain }
  | { type: 'UPDATE_REQUEST_CHAIN'; payload: RequestChain }
  | { type: 'DELETE_REQUEST_CHAIN'; payload: string }
  | { type: 'ADD_AUTH_TOKEN'; payload: AuthToken }
  | { type: 'UPDATE_AUTH_TOKEN'; payload: AuthToken }
  | { type: 'DELETE_AUTH_TOKEN'; payload: string }
  | { type: 'ADD_EXECUTION_LOG'; payload: ExecutionLog }
  | { type: 'SET_EXECUTING'; payload: boolean };

const initialState: AppState = {
  currentWorkspace: null,
  workspaces: [
    {
      id: '1',
      name: 'My First Workspace',
      description: 'Default workspace for API automation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  requestChains: [],
  authTokens: [],
  executionLogs: [],
  isExecuting: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_WORKSPACE':
      return { ...state, currentWorkspace: action.payload };
    case 'ADD_WORKSPACE':
      return { ...state, workspaces: [...state.workspaces, action.payload] };
    case 'UPDATE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.map(w => 
          w.id === action.payload.id ? action.payload : w
        ),
        currentWorkspace: state.currentWorkspace?.id === action.payload.id 
          ? action.payload 
          : state.currentWorkspace
      };
    case 'DELETE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.filter(w => w.id !== action.payload),
        currentWorkspace: state.currentWorkspace?.id === action.payload 
          ? null 
          : state.currentWorkspace
      };
    case 'SET_REQUEST_CHAINS':
      return { ...state, requestChains: action.payload };
    case 'ADD_REQUEST_CHAIN':
      return { ...state, requestChains: [...state.requestChains, action.payload] };
    case 'UPDATE_REQUEST_CHAIN':
      return {
        ...state,
        requestChains: state.requestChains.map(chain => 
          chain.id === action.payload.id ? action.payload : chain
        )
      };
    case 'DELETE_REQUEST_CHAIN':
      return {
        ...state,
        requestChains: state.requestChains.filter(chain => chain.id !== action.payload)
      };
    case 'ADD_AUTH_TOKEN':
      return { ...state, authTokens: [...state.authTokens, action.payload] };
    case 'UPDATE_AUTH_TOKEN':
      return {
        ...state,
        authTokens: state.authTokens.map(token => 
          token.id === action.payload.id ? action.payload : token
        )
      };
    case 'DELETE_AUTH_TOKEN':
      return {
        ...state,
        authTokens: state.authTokens.filter(token => token.id !== action.payload)
      };
    case 'ADD_EXECUTION_LOG':
      return { ...state, executionLogs: [action.payload, ...state.executionLogs] };
    case 'SET_EXECUTING':
      return { ...state, isExecuting: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}