import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Building, Users, Settings, Eye, CreditCard, Wrench, Database, UserMinus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';

// Import individual setting components
import { AccountInfo } from '@/components/settings/AccountInfo';
import { LoginInfo } from '@/components/settings/LoginInfo';
import { WorkspaceManagement } from '@/components/settings/WorkspaceManagement';
import { PeopleManagement } from '@/components/settings/PeopleManagement';
import { EnvironmentManagement } from '@/components/settings/EnvironmentManagement';
import { PrivacyPreferences } from '@/components/settings/PrivacyPreferences';
import { PlanManagement } from '@/components/settings/PlanManagement';
import { ExternalTools } from '@/components/settings/ExternalTools';
import { DataPurgeConfig } from '@/components/settings/DataPurgeConfig';
import { AccountDeactivation } from '@/components/settings/AccountDeactivation';
import { useLocation } from 'wouter';

export default function AccountSettings() {
  // Get the search params from the window location
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'account-info');
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  // Function to update both the active tab and URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    // Update the URL without causing a full page reload
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('tab', tabId);
    setLocation(`/settings/account?${newParams.toString()}`, { replace: true });
  };

  useEffect(() => {
    // Update active tab when URL query parameter changes
    const tabFromURL = searchParams.get('tab');
    if (tabFromURL && settingsSections.some(section => section.id === tabFromURL)) {
      setActiveTab(tabFromURL);
    }
  }, [location]);

  const settingsSections = [
    { id: 'account-info', label: 'Account Info', icon: User, component: AccountInfo },
    { id: 'login-info', label: 'Login & Recovery', icon: Shield, component: LoginInfo },
    { id: 'workspaces', label: 'Manage Workspaces', icon: Building, component: WorkspaceManagement },
    { id: 'people', label: 'Manage People', icon: Users, component: PeopleManagement },
    { id: 'environments', label: 'Manage Environments', icon: Settings, component: EnvironmentManagement },
    { id: 'privacy', label: 'Privacy Preferences', icon: Eye, component: PrivacyPreferences },
    { id: 'plan', label: 'Your Plan', icon: CreditCard, component: PlanManagement },
    { id: 'external-tools', label: 'External Tools', icon: Wrench, component: ExternalTools },
    { id: 'data-purge', label: 'Purge Old Data', icon: Database, component: DataPurgeConfig },
    { id: 'deactivate', label: 'Deactivate Account', icon: UserMinus, component: AccountDeactivation }
  ];

  return (
    <div className="flex-1 bg-gray-50 h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View and update your account details, profile and more.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-3">
        <h2 className="text-2xl font-bold mb-2">
          Hello, {user?.firstName} {user?.lastName}!
        </h2>
        <p className="opacity-90">
          Welcome to your account settings. Here you can manage your login information and security preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Settings Navigation */}
        <div className="lg:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <nav className="flex gap-2 p-2">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleTabChange(section.id)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${activeTab === section.id
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-center leading-tight">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Settings Navigation */}
        <div className="hidden lg:block lg:w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleTabChange(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${activeTab === section.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6">
            {settingsSections.map((section) => {
              const Component = section.component;
              return (
                <div
                  key={section.id}
                  className={activeTab === section.id ? 'block' : 'hidden'}
                >
                  <Component />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}