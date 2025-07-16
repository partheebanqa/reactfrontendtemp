import React from 'react';
import { Link, useLocation } from 'wouter';
import { User, Shield, Key, CreditCard, Share2, Settings, Link as LinkIcon, Palette } from 'lucide-react';

const AccountSettingsPage: React.FC = () => {
  const [location] = useLocation();
  
  const menuItems = [
    { icon: User, label: 'Profile', path: '/settings/profile' },
    { icon: Shield, label: 'Account', path: '/settings/account' },
    { icon: Key, label: 'Security', path: '/settings/security' },
    { icon: CreditCard, label: 'Billing', path: '/settings/billing' },
    { icon: Share2, label: 'Referrals', path: '/settings/referrals' },
    { icon: Settings, label: 'Preferences', path: '/settings/preferences' },
    { icon: LinkIcon, label: 'Connected Services', path: '/settings/connected-services' },
    { icon: Palette, label: 'Themes', path: '/settings/themes' },
  ];

  return (
    <div className="flex-1 bg-gray-50 h-full">
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Account Settings</h1>
        
        <div className="flex gap-6">
          {/* Navigation Sidebar */}
          <nav className="w-64 bg-white rounded-lg shadow">
            <ul className="py-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className={`
                      flex items-center px-4 py-2 text-sm
                      ${location === item.path 
                        ? 'text-blue-600 bg-blue-50 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Please select an option from the sidebar to view settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;