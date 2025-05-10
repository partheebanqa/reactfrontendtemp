import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { User, Shield, Key, CreditCard, Share2, Settings, Link, Palette } from 'lucide-react';

const AccountSettingsPage: React.FC = () => {
  const menuItems = [
    { icon: User, label: 'Profile', path: 'profile' },
    { icon: Shield, label: 'Account', path: 'account' },
    { icon: Key, label: 'Security', path: 'security' },
    { icon: CreditCard, label: 'Billing', path: 'billing' },
    { icon: Share2, label: 'Referrals', path: 'referrals' },
    { icon: Settings, label: 'Preferences', path: 'preferences' },
    { icon: Link, label: 'Connected Services', path: 'connected-services' },
    { icon: Palette, label: 'Themes', path: 'themes' },
  ];

  return (
    <div className="flex-1 bg-gray-50 h-full">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Account Settings</h1>
        
        <div className="flex gap-6">
          {/* Navigation Sidebar */}
          <nav className="w-64 bg-white rounded-lg shadow">
            <ul className="py-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center px-4 py-2 text-sm
                      ${isActive 
                        ? 'text-blue-600 bg-blue-50 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;