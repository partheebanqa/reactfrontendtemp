import React, { useState, useEffect, useCallback } from 'react';
import { NotificationPreference } from '../../../store/notificationStore';
import { X, CheckCircle, Bell, Server, CreditCard } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { useNotification } from '@/hooks/useNotification';

type NotificationPreferencesProps = {
  show: boolean;
  handleClose: () => void;
};

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ show, handleClose }) => {
  const { preferences, updatePreferences } = useNotification();
  const [formData, setFormData] = useState<NotificationPreference[]>(preferences);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(preferences);
  }, [preferences]);

  const handleChange = useCallback((index: number, field: string) => (value: boolean) => {
    setFormData(prevData => {
      const newFormData = [...prevData];
      newFormData[index] = {
        ...newFormData[index],
        enabled: value
      };
      return newFormData;
    });
  }, []);

  const handleSave = useCallback(async () => {
    await updatePreferences(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }, [formData, updatePreferences]);

  const onRequestClose = useCallback(() => {
    setFormData(preferences);
    setSaveSuccess(false);
    handleClose();
  }, [preferences, handleClose]);

  const renderNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'system':
        return <Bell className="h-5 w-5" />;
      case 'activity':
        return <Server className="h-5 w-5" />;
      case 'mentions':
        return <Bell className="h-5 w-5" />;
      case 'marketing':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  }, []);

  return (
    <Dialog.Root open={show} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[500px] max-w-[90vw] bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center border-b p-5">
            <Dialog.Title className="text-xl font-semibold">
              Notification Preferences
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="space-y-6 p-5">
            {/* Notification Types */}
            <div>
              <h3 className="text-lg font-medium mb-4">Notification Types</h3>
              {formData.map((pref, index) => (
                <div key={pref.type} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">
                      {renderNotificationIcon(pref.type)}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{pref.type} Notifications</div>
                      <div className="text-sm text-gray-500">{pref.description}</div>
                    </div>
                  </div>
                  <Switch.Root
                    checked={pref.enabled}
                    onCheckedChange={(checked) => handleChange(index, 'enabled')(checked)}
                    className="w-11 h-6 bg-gray-300 rounded-full data-[state=checked]:bg-blue-600 transition-colors"
                  >
                    <Switch.Thumb className="block h-4 w-4 bg-white rounded-full transition-transform duration-100 translate-x-1 data-[state=checked]:translate-x-6" />
                  </Switch.Root>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 pb-4">
            {saveSuccess && (
              <div className="text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Preferences saved successfully
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <button 
                onClick={onRequestClose} 
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default React.memo(NotificationPreferences);
