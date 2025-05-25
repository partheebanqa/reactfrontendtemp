import React, { useState } from 'react';
import { Save, Bell, Lock, Globe, Mail, Copy, RefreshCw } from 'lucide-react';
import { showSnackbar } from '../../shared/services/snackbarService';

const Settings: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [apiKey, setApiKey] = useState('sk_test_51ABC...');
  const [baseUrl, setBaseUrl] = useState('https://api.example.com');
  const [keyExpiry] = useState('2025-03-15'); // This would come from your backend

  const handleRegenerateKey = () => {
    // This would typically make an API call to generate a new key
    const newKey = 'sk_test_' + Math.random().toString(36).substring(2);
    setApiKey(newKey);
    showSnackbar('API key regenerated successfully', 'success');
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    showSnackbar('API key copied to clipboard', 'success');
  };

  const isKeyExpired = new Date(keyExpiry) < new Date();

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Save settings logic would go here
    showSnackbar('Settings saved successfully', 'success');
  };

  return (
    <div className="space-y-6 py-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <form onSubmit={handleSaveSettings}>
        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {/* Notifications */}
          <div className="p-6">
            <div className="flex items-center">
              <Bell className="h-6 w-6 text-gray-400" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">Notifications</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="email-notifications" className="font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive email notifications for test results</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`${
                    emailNotifications ? 'bg-blue-500' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="push-notifications" className="font-medium text-gray-700">
                    Push Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive browser push notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`${
                    pushNotifications ? 'bg-blue-500' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      pushNotifications ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="p-6">
            <div className="flex items-center">
              <Lock className="h-6 w-6 text-gray-400" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">API Configuration</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    id="api-key"
                    value={apiKey}
                    readOnly
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pr-24"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-2">
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy API key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Regenerate API key"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <p className="text-sm text-gray-500">
                    Valid until: {new Date(keyExpiry).toLocaleDateString()}
                  </p>
                  {isKeyExpired && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Expired
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Environment Settings */}
          <div className="p-6">
            <div className="flex items-center">
              <Globe className="h-6 w-6 text-gray-400" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">Environment Settings</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="base-url" className="block text-sm font-medium text-gray-700">
                  Base URL
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="base-url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">The base URL for your API endpoints</p>
              </div>
              <div>
                <label htmlFor="environment" className="block text-sm font-medium text-gray-700">
                  Environment
                </label>
                <select
                  id="environment"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option>Development</option>
                  <option>Staging</option>
                  <option>Production</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;