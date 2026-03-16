import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type {
  BodyType,
  Header,
  Param,
  PendingSubstitution,
  RequestMethod,
  SelectedVariable,
} from '@/shared/types/request';
import type { KeyValuePairWithFile } from '@/components/ui/KeyValueEditorWithFileUpload';
import { RequestSettings } from '@/lib/requestBreadCrumb';

// Define the context type
interface RequestEditorContextType {
  // URL and Method
  url: string;
  setUrl: (url: string) => void;
  method: RequestMethod;
  setMethod: (method: RequestMethod) => void;

  // Params
  params: Param[];
  setParams: React.Dispatch<React.SetStateAction<Param[]>>;
  addParam: () => void;
  updateParam: (index: number, updates: Partial<Param>) => void;
  removeParam: (index: number) => void;

  // Headers
  headers: Header[];
  setHeaders: React.Dispatch<React.SetStateAction<Header[]>>;
  addHeader: () => void;
  updateHeader: (index: number, updates: Partial<Header>) => void;
  removeHeader: (index: number) => void;

  // Body
  bodyType: BodyType;
  setBodyType: (type: BodyType) => void;
  bodyContent: string;
  setBodyContent: (content: string) => void;
  formFields: KeyValuePairWithFile[];
  setFormFields: React.Dispatch<React.SetStateAction<KeyValuePairWithFile[]>>;
  urlEncodedFields: Param[];
  setUrlEncodedFields: React.Dispatch<React.SetStateAction<Param[]>>;

  // Auth
  authType: 'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth1' | 'oauth2';
  setAuthType: (
    type: 'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth1' | 'oauth2',
  ) => void;
  token: string;
  setToken: (token: string) => void;
  authData: {
    username: string;
    password: string;
    token: string;
    key: string;
    value: string;
    addTo: 'header' | 'query';
    oauth1: {
      consumerKey: string;
      consumerSecret: string;
      token: string;
      tokenSecret: string;
      signatureMethod: string;
      version: string;
      realm: string;
      nonce: string;
      timestamp: string;
    };
    oauth2: {
      clientId: string;
      clientSecret: string;
      accessToken: string;
      tokenType: string;
      refreshToken: string;
      scope: string;
      grantType:
        | 'authorization_code'
        | 'client_credentials'
        | 'password'
        | 'refresh_token';
      redirectUri: string;
    };
  };
  setAuthData: React.Dispatch<
    React.SetStateAction<RequestEditorContextType['authData']>
  >;

  // Settings
  settings: RequestSettings;
  setSettings: React.Dispatch<React.SetStateAction<RequestSettings>>;

  // Variables
  selectedVariable: SelectedVariable[];
  setSelectedVariable: React.Dispatch<React.SetStateAction<SelectedVariable[]>>;
  pendingSubstitutions: PendingSubstitution[];
  setPendingSubstitutions: React.Dispatch<
    React.SetStateAction<PendingSubstitution[]>
  >;
  dynamicVarTrigger: number;
  setDynamicVarTrigger: (value: number) => void;

  // Active Request ID for marking changes
  activeRequestId?: string;
}

// Create the context
const RequestEditorContext = createContext<RequestEditorContextType | null>(
  null,
);

// Provider props
interface RequestEditorProviderProps {
  children: React.ReactNode;
  activeRequestId?: string;
  initialUrl?: string;
  initialMethod?: RequestMethod;
  initialParams?: Param[];
  initialHeaders?: Header[];
  initialBodyType?: BodyType;
  initialBodyContent?: string;
  initialAuthType?:
    | 'none'
    | 'basic'
    | 'bearer'
    | 'apiKey'
    | 'oauth1'
    | 'oauth2';
  initialSettings?: RequestSettings;
  onStateChange?: () => void;
  initialAuthData?: RequestEditorContextType['authData'];
}

// Provider component
export const RequestEditorProvider: React.FC<RequestEditorProviderProps> = ({
  children,
  activeRequestId,
  initialUrl = '',
  initialMethod = 'GET',
  initialParams = [],
  initialHeaders = [],
  initialBodyType = 'raw',
  initialBodyContent = '{}',
  initialAuthType = 'bearer',
  initialSettings,
  onStateChange,
  initialAuthData,
}) => {
  // Core request state
  const [url, setUrl] = useState(initialUrl);
  const [method, setMethod] = useState<RequestMethod>(initialMethod);
  const [params, setParams] = useState<Param[]>(initialParams);
  const [headers, setHeaders] = useState<Header[]>(initialHeaders);

  console.log('initialAuthData123:', initialAuthData);

  // Body state
  const [bodyType, setBodyType] = useState<BodyType>(initialBodyType);
  const [bodyContent, setBodyContent] = useState(initialBodyContent);
  const [formFields, setFormFields] = useState<KeyValuePairWithFile[]>([]);
  const [urlEncodedFields, setUrlEncodedFields] = useState<Param[]>([]);

  // Auth state
  const [authType, setAuthType] = useState<
    'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth1' | 'oauth2'
  >(initialAuthType);
  const [token, setToken] = useState('');
  const [authData, setAuthData] = useState(
    initialAuthData ?? {
      username: '',
      password: '',
      token: '',
      key: '',
      value: '',
      addTo: 'header' as 'header' | 'query',
      oauth1: {
        consumerKey: '',
        consumerSecret: '',
        token: '',
        tokenSecret: '',
        signatureMethod: 'HMAC-SHA1',
        version: '1.0',
        realm: '',
        nonce: '',
        timestamp: '',
      },
      oauth2: {
        clientId: '',
        clientSecret: '',
        accessToken: '',
        tokenType: 'Bearer',
        refreshToken: '',
        scope: '',
        grantType: 'authorization_code' as
          | 'authorization_code'
          | 'client_credentials'
          | 'password'
          | 'refresh_token',
        redirectUri: '',
      },
    },
  );

  // Settings state
  const [settings, setSettings] = useState<RequestSettings>(
    initialSettings || {
      options: {
        followRedirects: true,
        stopOnError: false,
        saveResponses: false,
      },
      timeout: 30000,
      validateSSL: true,
      proxy: { enabled: false, url: '' },
      performanceTest: {
        numRequests: 1,
        concurrency: 1,
        delay: 0,
        timeout: 1000,
      },
      rateLimit: {
        enabled: false,
        requestsPerPeriod: 10,
        periodInSeconds: 60,
        type: 'fixed',
      },
    },
  );
  // Variable state
  const [selectedVariable, setSelectedVariable] = useState<SelectedVariable[]>(
    [],
  );
  const [pendingSubstitutions, setPendingSubstitutions] = useState<
    PendingSubstitution[]
  >([]);
  const [dynamicVarTrigger, setDynamicVarTrigger] = useState(0);

  // Memoized helper functions for params
  const addParam = useCallback(() => {
    setParams((prev) => [...prev, { key: '', value: '', enabled: true }]);
    onStateChange?.();
  }, [onStateChange]);

  const updateParam = useCallback(
    (index: number, updates: Partial<Param>) => {
      setParams((prev) => {
        const newParams = [...prev];
        newParams[index] = { ...newParams[index], ...updates };
        return newParams;
      });
      onStateChange?.();
    },
    [onStateChange],
  );

  const removeParam = useCallback(
    (index: number) => {
      setParams((prev) => prev.filter((_, i) => i !== index));
      onStateChange?.();
    },
    [onStateChange],
  );

  // Memoized helper functions for headers
  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { key: '', value: '', enabled: true }]);
    onStateChange?.();
  }, [onStateChange]);

  const updateHeader = useCallback(
    (index: number, updates: Partial<Header>) => {
      setHeaders((prev) => {
        const newHeaders = [...prev];
        newHeaders[index] = { ...newHeaders[index], ...updates };
        return newHeaders;
      });
      onStateChange?.();
    },
    [onStateChange],
  );

  const removeHeader = useCallback(
    (index: number) => {
      setHeaders((prev) => prev.filter((_, i) => i !== index));
      onStateChange?.();
    },
    [onStateChange],
  );

  // After all the useState declarations, add these sync effects:

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    setMethod(initialMethod);
  }, [initialMethod]);

  useEffect(() => {
    setParams(initialParams);
  }, [initialParams]);

  useEffect(() => {
    setHeaders(initialHeaders);
  }, [initialHeaders]);

  useEffect(() => {
    setBodyType(initialBodyType);
  }, [initialBodyType]);

  useEffect(() => {
    setBodyContent(initialBodyContent);
  }, [initialBodyContent]);

  useEffect(() => {
    setAuthType(initialAuthType);
  }, [initialAuthType]);

  useEffect(() => {
    if (initialAuthData) {
      setAuthData(initialAuthData);
    }
  }, [initialAuthData]);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const value = useMemo<RequestEditorContextType>(
    () => ({
      url,
      setUrl,
      method,
      setMethod,

      params,
      setParams,
      addParam,
      updateParam,
      removeParam,

      headers,
      setHeaders,
      addHeader,
      updateHeader,
      removeHeader,

      bodyType,
      setBodyType,
      bodyContent,
      setBodyContent,
      formFields,
      setFormFields,
      urlEncodedFields,
      setUrlEncodedFields,

      // Auth
      authType,
      setAuthType,
      token,
      setToken,
      authData,
      setAuthData,

      // Settings
      settings,
      setSettings,

      // Variables
      selectedVariable,
      setSelectedVariable,
      pendingSubstitutions,
      setPendingSubstitutions,
      dynamicVarTrigger,
      setDynamicVarTrigger,

      // Active request ID
      activeRequestId,
    }),
    [
      url,
      method,
      params,
      headers,
      bodyType,
      bodyContent,
      formFields,
      urlEncodedFields,
      authType,
      token,
      authData,
      settings,
      selectedVariable,
      pendingSubstitutions,
      dynamicVarTrigger,
      activeRequestId,
      addParam,
      updateParam,
      removeParam,
      addHeader,
      updateHeader,
      removeHeader,
    ],
  );

  return (
    <RequestEditorContext.Provider value={value}>
      {children}
    </RequestEditorContext.Provider>
  );
};

// Custom hook to use the context
export const useRequestEditor = () => {
  const context = useContext(RequestEditorContext);
  if (!context) {
    throw new Error(
      'useRequestEditor must be used within RequestEditorProvider',
    );
  }
  return context;
};

// Export context for testing purposes
export { RequestEditorContext };
