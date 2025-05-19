import React from 'react';
import { Request } from '../types';

interface RequestAuthProps {
  auth: Request['auth'];
  onChange: (auth: Request['auth']) => void;
}

const RequestAuth: React.FC<RequestAuthProps> = ({ auth = { type: 'none' }, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Authorization</h3>
        <select
          value={auth.type}
          onChange={(e) => onChange({ type: e.target.value as Request['auth']['type'] })}
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

      {auth.type === 'basic' && (
        <div className="space-y-2">
          <input
            type="text"
            value={auth.username || ''}
            onChange={(e) => onChange({ ...auth, username: e.target.value })}
            className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
            placeholder="Username"
          />
          <input
            type="password"
            value={auth.password || ''}
            onChange={(e) => onChange({ ...auth, password: e.target.value })}
            className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
            placeholder="Password"
          />
        </div>
      )}

      {auth.type === 'bearer' && (
        <input
          type="text"
          value={auth.token || ''}
          onChange={(e) => onChange({ ...auth, token: e.target.value })}
          className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
          placeholder="Token"
        />
      )}

      {auth.type === 'apiKey' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={auth.key || ''}
              onChange={(e) => onChange({ ...auth, key: e.target.value })}
              className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
              placeholder="Key"
            />
            <input
              type="text"
              value={auth.value || ''}
              onChange={(e) => onChange({ ...auth, value: e.target.value })}
              className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
              placeholder="Value"
            />
          </div>
          <select
            value={auth.addTo || 'header'}
            onChange={(e) => onChange({ ...auth, addTo: e.target.value as 'header' | 'query' })}
            className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
          >
            <option value="header">Add to Header</option>
            <option value="query">Add to Query</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default RequestAuth;