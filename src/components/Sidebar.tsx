import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  BarChart3,
  Hammer,
  Link as LinkIcon,
  FlaskConical,
  Calendar,
  Play,
  Database,
  FileText,
  Settings,
  Bell,
  Infinity,
  User,
  Clock,
  Crown,
  Receipt,
} from 'lucide-react';
import FeatureGate from './FeatureGate';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: BarChart3,
    feature: 'dashboard',
  },
  {
    label: 'Request Builder',
    path: '/request-builder',
    icon: Hammer,
    feature: 'request_builder',
  },
  {
    label: 'Request Chains',
    path: '/request-chains',
    icon: LinkIcon,
    feature: 'request_chains',
  },
  {
    label: 'Test Suites',
    path: '/test-suites',
    icon: FlaskConical,
    feature: 'test_suites',
  },
  {
    label: 'Scheduler',
    path: '/scheduler',
    icon: Calendar,
    feature: 'scheduler',
  },
  {
    label: 'Data Management',
    path: '/data-management',
    icon: Database,
    feature: 'test_suites',
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: FileText,
    feature: 'reports',
  },
  {
    label: 'Plan & Billing',
    path: '/plan-billing',
    icon: Receipt,
    feature: 'plan_billing',
  },
];

const proFeatures = [
  {
    label: 'Executions',
    path: '/executions',
    icon: Play,
    feature: 'executions',
  },

  // {
  //   label: "Reports",
  //   path: "/reports",
  //   icon: FileText,
  //   feature: "reports",
  // },
  // {
  //   label: "Data Management",
  //   path: "/data-management",
  //   icon: Database,
  //   feature: "data_management",
  // },
];

const enterpriseFeatures = [
  {
    label: 'CI/CD Integration',
    path: '/cicd',
    icon: Infinity,
    feature: 'cicd_integrations',
  },
];

const generalItems = [
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    feature: 'settings',
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    feature: 'notifications',
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
    feature: 'profile',
  },
];

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { hasFeatureAccess, subscriptionPlan } = useFeatureGate();

  const NavItem: React.FC<{
    item: (typeof menuItems)[0];
    isActive: boolean;
    featureType?: 'free' | 'pro' | 'enterprise';
  }> = ({ item, isActive, featureType }) => {
    const hasAccess = hasFeatureAccess(item.feature);
    const Icon = item.icon;

    return (
      <Link href={item.path}>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={`w-full justify-start relative ${
            !hasAccess ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={!hasAccess}
        >
          <Icon className='w-4 h-4 mr-3' />
          <span className='flex-1 text-left'>{item.label}</span>
          {!hasAccess && featureType === 'pro' && (
            <Badge
              variant='outline'
              className='ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200'
            >
              PRO
            </Badge>
          )}
          {!hasAccess && featureType === 'enterprise' && (
            <Badge
              variant='outline'
              className='ml-2 text-xs bg-purple-50 text-purple-700 border-purple-200'
            >
              ENT
            </Badge>
          )}
          {!hasAccess && !featureType && (
            <Crown className='w-3 h-3 ml-auto text-yellow-500' />
          )}
        </Button>
      </Link>
    );
  };

  return (
    <aside className='w-64 bg-white shadow-lg flex flex-col border-r'>
      {/* Logo Section */}
      <div className='p-6 border-b'>
        <div className='flex items-center space-x-3'>
          <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
            <Code className='w-4 h-4 text-primary-foreground' />
          </div>
          <div>
            <h1 className='text-xl font-bold'>Optraflow</h1>
            <Badge variant='secondary' className='text-xs'>
              {subscriptionPlan === 'free'
                ? 'Free'
                : subscriptionPlan === 'pro'
                ? 'Pro'
                : 'Enterprise'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Trial Banner */}
      {/* {subscriptionPlan === "free" && trialDaysLeft > 0 && (
        <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Trial: {trialDaysLeft} days left
              </p>
              <Link href="/pricing">
                <Button variant="link" className="text-xs p-0 h-auto text-primary">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )} */}

      {/* Navigation */}
      <nav className='flex-1 px-4 py-6 space-y-2 overflow-y-auto'>
        {/* Core Features */}
        <div className='space-y-1'>
          {menuItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={location === item.path}
              featureType='free'
            />
          ))}
        </div>

        {/* Pro Features */}
        <div className='pt-4 border-t'>
          <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
            Pro Features
          </p>
          <div className='space-y-1'>
            {proFeatures.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location === item.path}
                featureType='pro'
              />
            ))}
          </div>
        </div>

        {/* Enterprise Features */}
        <div className='pt-4 border-t'>
          <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
            Enterprise
          </p>
          <div className='space-y-1'>
            {enterpriseFeatures.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location === item.path}
                featureType='enterprise'
              />
            ))}
          </div>
        </div>

        {/* General Items */}
        <div className='pt-4 border-t'>
          <div className='space-y-1'>
            {generalItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location === item.path}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className='p-4 border-t'>
        <div className='flex items-center space-x-3'>
          <Avatar className='w-10 h-10'>
            {/* <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} /> */}
            <AvatarFallback>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium truncate'>
              {user?.firstName} {user?.lastName}
            </p>
            <p className='text-xs text-muted-foreground truncate'>
              {currentWorkspace?.name}
            </p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => logoutMutation.mutate()}
            title='Logout'
          >
            <Settings className='w-4 h-4' />
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
