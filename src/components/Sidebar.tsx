import React, { useEffect, useState } from 'react';
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
  Zap,
  ChevronDown,
  ChevronRight,
  Wrench,
  ChevronsLeft,
  ChevronsRight,
  Workflow,
  HelpCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { HelpModal } from './HelpModal/HelpModal';
import { useIsMobile } from '@/hooks/use-mobile';
import TooltipContainer from './ui/tooltip-container';

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
  // {
  //   label: 'Executions',
  //   path: '/executions',
  //   icon: Play,
  //   feature: 'executions',
  // },
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
    label: 'Execution Reports',
    path: '/executions-reports',
    icon: FileText,
    feature: 'reports',
  },
  // {
  //   label: 'CI/CD Configuration',
  //   path: '/cicd-configuration',
  //   icon: Workflow,
  //   feature: 'cicd_configuration',
  // },
];

const utilsItems = [
  {
    label: 'Swagger Parser',
    path: '/swagger-parser',
    icon: Zap,
    feature: 'swagger_parser',
  },
  {
    label: 'JSON Parser',
    path: '/json-parser',
    icon: Code,
    feature: 'json_parser',
  },
];

const proFeatures = [
  {
    label: 'Executions',
    path: '/executions',
    icon: Play,
    feature: 'executions',
  },
  {
    label: 'CI/CD Configuration',
    path: '/cicd-configuration',
    icon: Workflow,
    feature: 'cicd_configuration',
  },
  // {
  //   label: "Data Management",
  //   path: "/data-management",
  //   icon: Database,
  //   feature: "data_management",
  // },
];

const enterpriseFeatures = [
  {
    label: 'CI/CD Configuration',
    path: '/cicd-configuration',
    icon: Workflow,
    feature: 'cicd_configuration',
  },
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
  const [utilsExpanded, setUtilsExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const NavItem: React.FC<{
    item: (typeof menuItems)[0];
    isActive: boolean;
    featureType?: 'free' | 'pro' | 'enterprise';
  }> = ({ item, isActive, featureType }) => {
    const hasAccess = hasFeatureAccess(item.feature);
    const Icon = item.icon;
    const isMobile = useIsMobile();

    useEffect(() => {
      if (isMobile) {
        setCollapsed(true); // Collapse sidebar on mobile
      }
    }, [isMobile]);

    if (collapsed) {
      return (
        <Link href={item.path}>
          <div className='relative group'>
            <TooltipContainer
              text={item.label}
              position='right'
              children={
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full p-3 flex justify-center ${
                    !hasAccess ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!hasAccess}
                >
                  <Icon className='w-5 h-5' />
                </Button>
              }
            />

            <div className='absolute left-full ml-2 hidden  bg-white shadow-md rounded p-2 z-50 whitespace-nowrap'>
              {item.label}
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
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link href={item.path}>
        <TooltipContainer
          text={item.label}
          position='right'
          children={
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
          }
        />
      </Link>
    );
  };

  const CategoryHeader: React.FC<{ title: string }> = ({ title }) => {
    if (collapsed) return null;

    return (
      <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
        {title}
      </p>
    );
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-white shadow-lg flex flex-col border-r transition-all duration-300`}
    >
      {/* Logo Section */}
      <div
        className={`${
          collapsed ? 'p-3' : 'p-6'
        } border-b flex justify-between items-center relative`}
      >
        {collapsed ? (
          <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto'>
            <Code className='w-4 h-4 text-primary-foreground' />
          </div>
        ) : (
          <div className='flex items-center space-x-3'>
            <Link
              to='/'
              className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'
            >
              <Code className='w-4 h-4 text-primary-foreground' />
            </Link>
            <Link to='/'>
              <h1 className='text-xl font-bold'>Optraflow</h1>
              <Badge variant='secondary' className='text-xs'>
                {subscriptionPlan === 'free'
                  ? 'Free'
                  : subscriptionPlan === 'pro'
                  ? 'Pro'
                  : 'Enterprise'}
              </Badge>
            </Link>
          </div>
        )}
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 ${
            collapsed
              ? 'absolute left-[50px] top-1/2 transform -translate-y-1/2 bg-[#2094f3] rounded-full h-auto hover:bg-[#1e7bbf]'
              : ''
          }`}
        >
          {collapsed ? <ChevronsRight size={10} /> : <ChevronsLeft size={16} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 ${
          collapsed ? 'px-2' : 'px-4'
        } py-6 space-y-2 overflow-y-auto`}
      >
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

          {/* Utils Dropdown */}
          {!collapsed ? (
            <div className='w-full'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    className='w-full justify-start relative group'
                    onClick={() => setUtilsExpanded(!utilsExpanded)}
                  >
                    <Wrench className='w-4 h-4 mr-3' />
                    <span className='flex-1 text-left'>Utilities</span>
                    {utilsExpanded ? (
                      <ChevronDown className='w-4 h-4' />
                    ) : (
                      <ChevronRight className='w-4 h-4' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Utilities</TooltipContent>
              </Tooltip>

              {utilsExpanded && (
                <div className='pl-3 space-y-1 mt-1'>
                  {utilsItems.map((item) => (
                    <NavItem
                      key={item.path}
                      item={item}
                      isActive={location === item.path}
                      featureType='free'
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            utilsItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location === item.path}
                featureType='free'
              />
            ))
          )}
        </div>

        {/* Pro Features */}
        <div className='pt-4 border-t'>
          <CategoryHeader title='Pro Features' />
          <div className='space-y-1'>
            {proFeatures.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location === item.path}
                featureType='free'
              />
            ))}
          </div>
        </div>

        {/* Enterprise Features */}
        {/* <div className='pt-4 border-t'>
          <CategoryHeader title='Enterprise' />
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
        </div> */}

        {/* General Items */}
        {/* <div className='pt-4 border-t'>
          <div className='space-y-1'>
            {generalItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location === item.path}
              />
            ))}
          </div>
        </div> */}
      </nav>

      {/* Help & Support */}
      <div className={`${collapsed ? 'p-2' : 'p-4'} border-t`}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='w-full h-10'
                onClick={() => setShowHelpModal(true)}
              >
                <HelpCircle className='h-5 w-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='right'>Help & Support</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle className='mr-2 h-4 w-4' />
            Help & Support
          </Button>
        )}
      </div>
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </aside>
  );
};

export default Sidebar;
