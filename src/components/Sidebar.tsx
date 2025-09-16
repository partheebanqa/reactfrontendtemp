import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { Button } from '@/components/ui/button';
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
  Wrench,
  Infinity,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  X,
  Crown,
  LayoutDashboard,
  Settings,
  Link2,
  Layers,
  CalendarClock,
  ChartColumn,
  Workflow,
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
import Logo from '../assests/images/FavIcon.jpg';
import LogoFull from '../assests/images/OptraLogo.png';

// -------------------------------
// Menu config
// -------------------------------

type FeatureKey =
  | 'dashboard'
  | 'request_builder'
  | 'request_chains'
  | 'test_suites'
  | 'scheduler'
  | 'reports'
  | 'executions'
  | 'cicd_configuration'
  | 'cicd_integrations'
  | 'swagger_parser'
  | 'json_parser'
  | 'settings'
  | 'notifications'
  | 'faqs';

type MenuItem = {
  label: string;
  path?: string; // optional if upcoming
  icon: React.ComponentType<any>;
  feature: FeatureKey;
  upcoming?: boolean; // 🚀 new flag
};

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    feature: 'dashboard',
    upcoming: true, // 🚀 mark as upcoming
  },
  {
    label: 'Request Builder',
    path: '/request-builder',
    icon: Settings,
    feature: 'request_builder',
  },
  {
    label: 'Request Chains',
    path: '/request-chains',
    icon: Link2,
    feature: 'request_chains',
  },
  {
    label: 'Test Suites',
    path: '/test-suites',
    icon: Layers,
    feature: 'test_suites',
  },
  {
    label: 'Scheduler',
    path: '/scheduler',
    icon: CalendarClock,
    feature: 'scheduler',
    // upcoming: true, // 🚀 mark as upcoming
  },
  {
    label: 'Data Management',
    path: '/data-management',
    icon: Database,
    feature: 'test_suites',
  },
  {
    label: 'Reports',
    icon: FileText,
    feature: 'reports',
    upcoming: true, // 🚀 mark as upcoming
  },
  {
    label: 'Executions',
    path: '/executions',
    icon: ChartColumn,
    feature: 'executions',
  }, // PRO-gated
  { label: 'FAQ', path: '/faq', icon: HelpCircle, feature: 'faqs' },
  {
    label: 'CI/CD Integration',
    path: '/cicd-configuration',
    icon: Workflow,
    feature: 'cicd_integrations',
  }, // PRO-gated
];

const utilsItems: MenuItem[] = [
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

// Only these features are PRO-gated
const PRO_FEATURES = new Set<FeatureKey>(['executions', 'cicd_integrationss']);

// -------------------------------
// Component
// -------------------------------

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { hasFeatureAccess, subscriptionPlan } = useFeatureGate();

  const [utilsExpanded, setUtilsExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // -------------------------------
  // Nav Item
  // -------------------------------
  const NavItem: React.FC<{ item: MenuItem; isActive: boolean }> = ({
    item,
    isActive,
  }) => {
    const isPro = PRO_FEATURES.has(item.feature);
    const locked = isPro ? !hasFeatureAccess(item.feature) : false;

    const Icon = item.icon;
    const isMobile = useIsMobile();

    useEffect(() => {
      if (isMobile) setCollapsed(true);
    }, [isMobile]);

    const Content = (
      <Button
        variant={isActive ? 'active' : 'ghost'}
        className={`w-full ${
          collapsed ? 'p-3 justify-center' : 'justify-start'
        } relative 
        ${
          locked || item.upcoming ? 'opacity-50 cursor-not-allowed' : ''
        } text-[15px]`}
        disabled={locked || item.upcoming}
      >
        <Icon className='w-10 h-10' />
        {!collapsed && (
          <span className='flex-1 text-left'>
            {item.label} {item.upcoming && '(Upcoming)'}
          </span>
        )}
        {!collapsed && locked && isPro && (
          <Crown className='w-4 h-4 text-yellow-500 ml-2' />
        )}
      </Button>
    );

    // If upcoming or locked → no link
    if (item.upcoming || locked) {
      return <div className='w-full'>{Content}</div>;
    }

    return <Link href={item.path!}>{Content}</Link>;
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
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex ${
          collapsed ? 'w-16' : 'w-64'
        } bg-white flex-col border-r transition-all duration-300 h-full`}
      >
        <div
          className={`${
            collapsed ? 'p-3' : 'p-2'
          } border-b flex justify-around items-center relative`}
        >
          {collapsed ? (
            <div className='w-8 h-8 flex items-center justify-center mx-auto'>
              <img
                src={Logo}
                alt='Optraflow logo'
                className='w-8 h-8 rounded'
              />
            </div>
          ) : (
            <div className='flex items-center space-x-3'>
              <Link to='/' className='flex items-center space-x-2'>
                <img
                  src={LogoFull}
                  alt='Optraflow'
                  style={{ width: '100%', height: '50px' }}
                />
              </Link>
            </div>
          )}

          <Button
            variant='ghost'
            size='sm'
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1 ${
              collapsed
                ? 'absolute left-[50px] top-1/2 transform -translate-y-1/2 bg-[#136fb0] rounded-full h-auto hover:bg-[#1e7bbf]'
                : ''
            }`}
          >
            {collapsed ? (
              <ChevronsRight size={10} color='white' />
            ) : (
              <ChevronsLeft size={16} />
            )}
          </Button>
        </div>

        {/* Content */}
        <div className='flex-1 flex flex-col'>
          <nav
            className={`flex-1 ${
              collapsed ? 'px-2' : 'px-4'
            } py-2 space-y-2 overflow-y-auto`}
          >
            <div className='space-y-1'>
              {menuItems.map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  isActive={location === item.path}
                />
              ))}

              {/* Utilities */}
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
                        <span className='flex-1 text-left text-md'>
                          Utilities
                        </span>
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
                  />
                ))
              )}
            </div>
          </nav>

          {/* Help bottom */}
          <div className={`${collapsed ? 'p-2' : 'p-4'} border-t`}>
            {collapsed ? (
              <TooltipProvider>
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
              </TooltipProvider>
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
        </div>

        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      </aside>

      {/* Mobile Sidebar */}
      <div className='block md:hidden'>
        <div className='flex items-center justify-between h-16 px-4 border-b border-primary-600'>
          <div className='flex items-center space-x-2'>
            <span className='text-lg font-semibold'>Optraflow</span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className='lg:hidden'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <nav
          className={`flex-1 ${
            collapsed ? 'px-2' : 'px-4'
          } py-6 space-y-2 overflow-y-auto`}
        >
          <div className='space-y-1'>
            {menuItems.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                isActive={location === item.path}
              />
            ))}

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
                      <span className='flex-1 text-left text-md'>
                        Utilities
                      </span>
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
                />
              ))
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
