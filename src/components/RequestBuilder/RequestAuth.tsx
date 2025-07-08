import { CollectionRequest } from '@/shared/types/collection';
import React from 'react';

interface RequestAuthProps {
  authorizationType: string;
  authorization: CollectionRequest['authorization'];
  onChange: (
    authType: CollectionRequest['authorizationType'], 
    auth: CollectionRequest['authorization']
  ) => void;
}

const RequestAuth: React.FC<RequestAuthProps> = ({ 
  authorizationType = 'none', 
  authorization = {}, 
  onChange 
}) => {
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as CollectionRequest['authorizationType'];
    // Reset auth data when changing types
    onChange(newType, {});
  };

  const handleAuthChange = (field: keyof CollectionRequest['authorization'], value: string) => {
    onChange(authorizationType, { ...authorization, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Authorization</h3>
        <select
          value={authorizationType}
          onChange={handleTypeChange}
          className="border-gray-200 w-full text-sm px-2 py-1.5 border rounded
          bg-[var(--bg-primary)] text-[var(--text-primary)]
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors"
        >
          <option value="none">No Auth</option>
          <option value="basic">Basic Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="apiKey">API Key</option>
        </select>
      </div>

      {authorizationType === 'basic' && (
        <div className="space-y-2">
          <input
            type="text"
            value={authorization.username || ''}
            onChange={e => handleAuthChange('username', e.target.value)}
            placeholder="Username"
            className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
          />
          <input
            type="password"
            value={authorization.password || ''}
            onChange={e => handleAuthChange('password', e.target.value)}
            placeholder="Password"
            className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
          />
        </div>
      )}

      {authorizationType === 'bearer' && (
        <input
          type="text"
          value={authorization.token || ''}
          onChange={e => handleAuthChange('token', e.target.value)}
          placeholder="Token"
          className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
        />
      )}

      {authorizationType === 'apiKey' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={authorization.key || ''}
              onChange={e => handleAuthChange('key', e.target.value)}
              placeholder="Key"
              className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
            />
            <input
              type="text"
              value={authorization.value || ''}
              onChange={e => handleAuthChange('value', e.target.value)}
              placeholder="Value"
              className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
            />
          </div>
          <select
            value={authorization.addTo || 'header'}
            onChange={e => handleAuthChange('addTo', e.target.value as 'header' | 'query')}
            className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
          >
            <option value="header">Add to Header</option>
            <option value="query">Add to Query</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default RequestAuth;
