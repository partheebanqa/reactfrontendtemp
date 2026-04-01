import { Upload, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';
import { APIRequest } from '../types';

interface APISelectionStepProps {
  apis: APIRequest[];
  onImport: (apis: Partial<APIRequest>[]) => void;
  onToggleSelect: (id: string) => void;
  onToggleAuth: (id: string) => void;
  onDelete: (id: string) => void;
}

export function APISelectionStep({
  apis,
  onImport,
  onToggleSelect,
  onToggleAuth,
  onDelete,
}: APISelectionStepProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAPI, setNewAPI] = useState<Partial<APIRequest>>({
    name: '',
    method: 'GET',
    url: '',
    headers: {},
    body: {},
    requires_auth: false,
    selected: true,
  });

  const handleAddAPI = () => {
    if (!newAPI.name || !newAPI.url) {
      alert('Please fill in all required fields');
      return;
    }
    onImport([newAPI]);
    setNewAPI({
      name: '',
      method: 'GET',
      url: '',
      headers: {},
      body: {},
      requires_auth: false,
      selected: true,
    });
    setShowAddForm(false);
  };

  const selectedCount = apis.filter((api) => api.selected).length;

  return (
    <div className='space-y-4'>
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              API Requests
            </h3>
            <p className='text-sm text-gray-600 mt-1'>
              Import or add APIs to test. Select which ones require
              authentication.
            </p>
          </div>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowAddForm(true)}
              className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
            >
              <Plus className='w-4 h-4' />
              Add API
            </button>
            <button className='inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium'>
              <Upload className='w-4 h-4' />
              Import Collection
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className='mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
            <h4 className='font-semibold text-gray-900 mb-4'>Add New API</h4>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  API Name <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={newAPI.name || ''}
                  onChange={(e) =>
                    setNewAPI({ ...newAPI, name: e.target.value })
                  }
                  placeholder='e.g., Get User Profile'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Method
                  </label>
                  <select
                    value={newAPI.method || 'GET'}
                    onChange={(e) =>
                      setNewAPI({ ...newAPI, method: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='GET'>GET</option>
                    <option value='POST'>POST</option>
                    <option value='PUT'>PUT</option>
                    <option value='PATCH'>PATCH</option>
                    <option value='DELETE'>DELETE</option>
                  </select>
                </div>
                <div className='md:col-span-3'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    URL <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='url'
                    value={newAPI.url || ''}
                    onChange={(e) =>
                      setNewAPI({ ...newAPI, url: e.target.value })
                    }
                    placeholder='https://api.example.com/users/profile'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='requires-auth'
                  checked={newAPI.requires_auth || false}
                  onChange={(e) =>
                    setNewAPI({ ...newAPI, requires_auth: e.target.checked })
                  }
                  className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                <label
                  htmlFor='requires-auth'
                  className='text-sm text-gray-700'
                >
                  Requires Authentication
                </label>
              </div>
              <div className='flex justify-end gap-2 pt-2'>
                <button
                  onClick={() => setShowAddForm(false)}
                  className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm'
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAPI}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                >
                  Add API
                </button>
              </div>
            </div>
          </div>
        )}

        {apis.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <Upload className='w-12 h-12 mx-auto mb-3 text-gray-400' />
            <p>No APIs added yet. Import a collection or add APIs manually.</p>
          </div>
        ) : (
          <>
            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-800'>
                <span className='font-semibold'>{selectedCount}</span> of{' '}
                <span className='font-semibold'>{apis.length}</span> APIs
                selected for testing
              </p>
            </div>

            <div className='space-y-2'>
              {apis.map((api) => (
                <div
                  key={api.id}
                  className={`
                    border rounded-lg p-4 transition-all
                    ${api.selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
                  `}
                >
                  <div className='flex items-start gap-3'>
                    <button
                      onClick={() => onToggleSelect(api.id)}
                      className='mt-1 flex-shrink-0'
                    >
                      {api.selected ? (
                        <CheckSquare className='w-5 h-5 text-blue-600' />
                      ) : (
                        <Square className='w-5 h-5 text-gray-400' />
                      )}
                    </button>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <span
                              className={`
                                px-2 py-0.5 rounded text-xs font-semibold
                                ${api.method === 'GET' ? 'bg-green-100 text-green-700' : ''}
                                ${api.method === 'POST' ? 'bg-blue-100 text-blue-700' : ''}
                                ${api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' : ''}
                                ${api.method === 'PATCH' ? 'bg-purple-100 text-purple-700' : ''}
                                ${api.method === 'DELETE' ? 'bg-red-100 text-red-700' : ''}
                              `}
                            >
                              {api.method}
                            </span>
                            <h4 className='font-semibold text-gray-900'>
                              {api.name}
                            </h4>
                          </div>
                          <p className='text-sm text-gray-600 break-all'>
                            {api.url}
                          </p>
                        </div>
                        <button
                          onClick={() => onDelete(api.id)}
                          className='text-gray-400 hover:text-red-600 transition-colors'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>

                      <div className='mt-2'>
                        <label className='inline-flex items-center gap-2 cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={api.requires_auth}
                            onChange={() => onToggleAuth(api.id)}
                            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                          />
                          <span className='text-sm text-gray-700'>
                            Requires Authentication
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
