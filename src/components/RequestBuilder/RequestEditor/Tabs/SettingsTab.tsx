import React from 'react';
import { Input } from '@/components/ui/input';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useRequestEditor } from '../context/RequestEditorContext';

const SettingsTab = React.memo(() => {
  const { settings, setSettings } = useRequestEditor();

  const handleFollowRedirectsChange = React.useCallback(
    (checked: boolean) => {
      setSettings((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          followRedirects: checked,
        },
      }));
    },
    [setSettings],
  );

  const handleTimeoutChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettings((prev) => ({
        ...prev,
        timeout: Number(e.target.value) || 0,
      }));
    },
    [setSettings],
  );

  return (
    <div className='space-y-5'>
      <h4 className='text-sm sm:text-lg font-medium text-gray-900 dark:text-white'>
        Request Settings
      </h4>

      <div className='space-y-4'>
        <ToggleSwitch
          id='followRedirects'
          checked={settings.options.followRedirects}
          onChange={handleFollowRedirectsChange}
          label='Follow Redirects'
          description='Automatically follow HTTP redirects'
        />
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Request Timeout (ms)
          </label>
          <Input
            type='number'
            min='0'
            value={settings.timeout}
            onChange={handleTimeoutChange}
            className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2
             hover:border-blue-400 focus:ring-2 focus:ring-blue-500
             focus:border-blue-500 focus:outline-none focus:bg-blue-50
             dark:focus:bg-blue-900/20 transition-all duration-150
             bg-white dark:bg-gray-800 text-sm'
          />

          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            Time in milliseconds to wait for a response before timing out
          </p>
        </div>
      </div>

      <div className='mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-md'>
        <h4 className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
          Request Settings Info
        </h4>
        <p className='text-xs text-yellow-700 dark:text-yellow-300 mt-1'>
          These settings only apply to this specific request. Global settings
          can be configured in the application settings.
        </p>
      </div>
    </div>
  );
});

SettingsTab.displayName = 'SettingsTab';

export default SettingsTab;
