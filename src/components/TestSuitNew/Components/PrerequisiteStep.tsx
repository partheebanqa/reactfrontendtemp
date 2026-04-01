import { PreRequestAPI } from '@/types';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface PrerequisiteStepProps {
  preRequestAPI: PreRequestAPI | null;
  onSave: (data: Partial<PreRequestAPI>) => void;
  onDelete: () => void;
}

export function PrerequisiteStep({
  preRequestAPI,
  onSave,
  onDelete,
}: PrerequisiteStepProps) {
  const [showForm, setShowForm] = useState(!!preRequestAPI);
  const [formData, setFormData] = useState<Partial<PreRequestAPI>>(
    preRequestAPI || {
      name: '',
      method: 'POST',
      url: '',
      headers: { 'Content-Type': 'application/json' },
      body: {},
      token_path: 'token',
    },
  );

  const handleSave = () => {
    if (!formData.name || !formData.url) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(formData);
  };

  if (!showForm && !preRequestAPI) {
    return (
      <div className='bg-white border-2 border-dashed border-gray-300 rounded-lg p-8'>
        <div className='text-center'>
          <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-3' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Authentication Required?
          </h3>
          <p className='text-sm text-gray-600 mb-4 max-w-md mx-auto'>
            If your APIs require authentication, add a pre-request API to fetch
            the token. Skip this step if authentication is not needed.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className='inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='w-4 h-4' />
            Add Authentication API
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Pre-Request Authentication API
        </h3>
        {preRequestAPI && (
          <button
            onClick={onDelete}
            className='text-red-600 hover:text-red-700 transition-colors'
          >
            <Trash2 className='w-5 h-5' />
          </button>
        )}
      </div>

      <div className='space-y-4'>
        {/* Name */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            API Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder='e.g., Login API'
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        {/* Method + URL */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Method <span className='text-red-500'>*</span>
            </label>
            <select
              value={formData.method || 'POST'}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='GET'>GET</option>
              <option value='POST'>POST</option>
              <option value='PUT'>PUT</option>
              <option value='PATCH'>PATCH</option>
            </select>
          </div>

          <div className='md:col-span-3'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              URL <span className='text-red-500'>*</span>
            </label>
            <input
              type='url'
              value={formData.url || ''}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder='https://api.example.com/auth/login'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        {/* Body */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Request Body (JSON)
          </label>
          <textarea
            value={JSON.stringify(formData.body || {}, null, 2)}
            onChange={(e) => {
              try {
                setFormData({ ...formData, body: JSON.parse(e.target.value) });
              } catch {
                // ignore invalid JSON while typing
              }
            }}
            placeholder='{\n  "username": "user@example.com",\n  "password": "password123"\n}'
            rows={4}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm'
          />
        </div>

        {/* Token path */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Token Path in Response
          </label>
          <input
            type='text'
            value={formData.token_path || 'token'}
            onChange={(e) =>
              setFormData({ ...formData, token_path: e.target.value })
            }
            placeholder='e.g., token or data.accessToken'
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Specify the JSON path where the authentication token appears in the
            response
          </p>
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-3 pt-4'>
          {!preRequestAPI && (
            <button
              onClick={() => setShowForm(false)}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Save Authentication API
          </button>
        </div>
      </div>
    </div>
  );
}
