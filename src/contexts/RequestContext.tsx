import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSchema } from './SchemaContext';
import { RequestData, ResponseData, KeyValuePair } from '@/shared/types/request';

interface RequestContextProps {
  requestData: RequestData;
  responseData: ResponseData | null;
  updateRequestData: (data: Partial<RequestData>) => void;
  executeRequest: () => Promise<void>;
}

const RequestContext = createContext<RequestContextProps | undefined>(undefined);

export const RequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { validateResponseAgainstPrimarySchema } = useSchema();
  
  const [requestData, setRequestData] = useState<RequestData>({
    method: 'GET',
    url: '',
    params: [],
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: ''
  });
  
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  
  const updateRequestData = useCallback((data: Partial<RequestData>) => {
    setRequestData(prev => ({ ...prev, ...data }));
  }, []);
  
  const buildUrl = useCallback((url: string, params: KeyValuePair[]) => {
    const validParams = params.filter(p => p.key && p.value);
    if (validParams.length === 0) return url;
    
    const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
    validParams.forEach(param => {
      urlObj.searchParams.append(param.key, param.value);
    });
    
    return urlObj.toString();
  }, []);
  
  const executeRequest = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      requestData.headers
        .filter(h => h.key && h.value)
        .forEach(h => {
          headers[h.key] = h.value;
        });
      
      const url = buildUrl(requestData.url, requestData.params);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: requestData.method,
        headers,
        body: requestData.method !== 'GET' && requestData.body ? requestData.body : undefined
      });

      
      const endTime = Date.now();
      
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        // Try to parse as JSON anyway, as sometimes the Content-Type is incorrect
        try {
          data = JSON.parse(data);
        } catch (e) {
          // Keep as text if it can't be parsed as JSON
        }
      }
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      const responseObj: ResponseData = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        time: endTime - startTime
      };
      
      setResponseData(responseObj);
      
      // Validate against primary schema if it exists
      validateResponseAgainstPrimarySchema(data);
    } catch (error) {
      console.error('Error executing request:', error);
      setResponseData({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: { error: (error as Error).message },
        time: 0
      });
    }
  }, [requestData, buildUrl, validateResponseAgainstPrimarySchema]);
  
  return (
    <RequestContext.Provider
      value={{
        requestData,
        responseData,
        updateRequestData,
        executeRequest
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

export const useRequest = () => {
  const context = useContext(RequestContext);
  if (context === undefined) {
    throw new Error('useRequest must be used within a RequestProvider');
  }
  return context;
};