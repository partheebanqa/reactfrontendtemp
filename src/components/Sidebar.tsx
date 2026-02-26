import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  Link2,
  Layers,
  CalendarClock,
  Database,
  FileText,
  ChartColumn,
  HelpCircle,
  Wrench,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Crown,
  LayoutDashboard,
  Settings,
  Workflow,
  CirclePlay,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { HelpModal } from './HelpModal/HelpModal';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from '../assests/images/FavIcon.jpg';
import LogoFull from '../assests/images/OptraLogo.png';
import { useCurrentPlan } from '@/context/CurrentPlanContext';

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
  | 'jwt_validator'
  | 'settings'
  | 'notifications'
  | 'faqs';

type MenuItem = {
  label: string;
  path?: string;
  icon: React.ComponentType<any>;
  feature: FeatureKey;
  upcoming?: boolean;
  newTab?: boolean;
};

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    feature: 'dashboard',
  },
  {
    label: 'Request Builder',
    path: '/request-builder',
    icon: Settings,
    feature: 'request_builder',
  },
  {
    label: 'Test Suites',
    path: '/test-suites',
    icon: Layers,
    feature: 'test_suites',
  },
  {
    label: 'Request Chains',
    path: '/request-chains',
    icon: Link2,
    feature: 'request_chains',
  },
  {
    label: 'Variables',
    path: '/data-management',
    icon: Database,
    feature: 'test_suites',
  },
  {
    label: 'Scheduler',
    path: '/scheduler',
    icon: CalendarClock,
    feature: 'scheduler',
  },
  {
    label: 'CI/CD',
    path: '/cicd-configuration',
    icon: Workflow,
    feature: 'cicd_integrations',
  },
  // { label: 'Reports', icon: FileText, feature: 'reports' },
  {
    label: 'Executions',
    path: '/executions',
    icon: CirclePlay,
    feature: 'executions',
  },
  // { label: 'FAQ', path: '/faq', icon: HelpCircle, feature: 'faqs' },
];

const utilsItems: MenuItem[] = [
  {
    label: 'Swagger Parser',
    path: '/swagger-parser',
    icon: Zap,
    feature: 'swagger_parser',
    newTab: true,
  },
  {
    label: 'JSON Parser',
    path: '/json-parser',
    icon: Code,
    feature: 'json_parser',
    newTab: true,
  },
  {
    label: 'JWT Validator',
    path: '/jwt-validator',
    icon: FileText,
    feature: 'jwt_validator',
    newTab: true,
  },
];

const PRO_FEATURES = new Set<FeatureKey>(['executions']);
type SidebarProps = {
  onNavigate?: () => void;
};
const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { hasFeatureAccess } = useFeatureGate();
  const { currentPlan } = useCurrentPlan();

  const [utilsExpanded, setUtilsExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (location === '/request-builder') {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [location]);

  const isEnterprisePlan = currentPlan?.PlanName === 'Enterprise';
  const isTrialPlan = currentPlan?.IsTrial === true;

  const NavItem: React.FC<{ item: MenuItem; isActive: boolean }> = ({
    item,
    isActive,
  }) => {
    const isPro = PRO_FEATURES.has(item.feature);
    const lockedByFeatureGate = isPro ? !hasFeatureAccess(item.feature) : false;

    const Icon = item.icon;
    const isMobile = useIsMobile();

    useEffect(() => {
      if (isMobile) setCollapsed(true);
    }, [isMobile]);

    const isEnterpriseOnlyFeature =
      item.feature === 'cicd_integrations' || item.feature === 'reports';
    const isDisabled =
      !isTrialPlan && isEnterpriseOnlyFeature && !isEnterprisePlan;

    const showEnterpriseBadge = !isTrialPlan && isEnterpriseOnlyFeature;

    const Content = (
      <Button
        variant={isActive ? 'active' : 'ghost'}
        className={`w-full ${collapsed ? 'p-4 justify-start' : 'justify-start'
          } relative 
          ${lockedByFeatureGate || item.upcoming || isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : ''
          } text-[13px]`}
        disabled={lockedByFeatureGate || item.upcoming || isDisabled}
        onClick={() => {
          setCollapsed(false);
          if (onNavigate) onNavigate();
        }}
      >
        <Icon className='w-10 h-10' />
        {!collapsed && (
          <span className='flex-1 text-left'>
            {item.label}{' '}
            <span className='text-[#ff0000] text-[11px]'>
              {showEnterpriseBadge && '(Enterprise)'}{' '}
            </span>
            {showEnterpriseBadge && (
              <Badge variant='secondary' className='ml-2'>
                Enterprise
              </Badge>
            )}
          </span>
        )}

        {collapsed && (
          <span className='flex-1 text-left block md:hidden'>
            {item.label}{' '}
            <span className='text-[#ff0000] text-[11px]'>
              {showEnterpriseBadge && '(Enterprise)'}{' '}
            </span>
            {showEnterpriseBadge && (
              <Badge variant='secondary' className='ml-2'>
                Enterprise
              </Badge>
            )}
          </span>
        )}
        {!collapsed && lockedByFeatureGate && isPro && (
          <Crown className='w-4 h-4 text-yellow-500 ml-2' />
        )}
      </Button>
    );

    const isToolItem = utilsItems.some((u) => u.path === item.path);

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {item.upcoming || lockedByFeatureGate || isDisabled ? (
                <div className='w-full'>{Content}</div>
              ) : isToolItem ? (
                <a
                  href={item.path}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-full'
                >
                  {Content}
                </a>
              ) : (
                <Link href={item.path!}>{Content}</Link>
              )}
            </TooltipTrigger>
            <TooltipContent side='right'>{item.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return item.upcoming || lockedByFeatureGate || isDisabled ? (
      <div className='w-full'>{Content}</div>
    ) : isToolItem ? (
      <a
        href={item.path}
        target='_blank'
        rel='noopener noreferrer'
        className='w-full'
      >
        {Content}
      </a>
    ) : (
      <Link href={item.path!}>{Content}</Link>
    );
  };

  return (
    <>
      <aside
        className={`hidden md:flex ${collapsed ? 'w-16' : 'w-48'
          } bg-white flex-col border-r transition-all duration-300 h-full`}
      >
        <div
          className={`${collapsed ? 'p-4' : 'p-1.5'
            } border-b flex justify-around items-center relative`}
        >
          {collapsed ? (
            <div className='w-8 h-8 flex items-center justify-center mx-auto'>
              <Link to='/' className='flex items-center space-x-2'>
                <img
                  src={Logo}
                  alt='Optraflow logo'
                  className='w-8 h-8 rounded'
                />
              </Link>
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
            className={`p-1 ${collapsed
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

        <div className='flex-1 flex flex-col'>
          <nav
            className={`flex-1 ${collapsed ? 'px-2' : 'px-4'
              } py-2 space-y-2 overflow-y-auto scrollbar-thin`}
          >
            <div className='space-y-1'>
              {menuItems.map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  isActive={
                    location === item.path ||
                    location.startsWith(item.path + '/')
                  }
                />
              ))}

              {!collapsed ? (
                <div className='w-full'>
                  <Button
                    variant='ghost'
                    className='w-full justify-start relative group'
                    onClick={() => setUtilsExpanded(!utilsExpanded)}
                  >
                    <Wrench className='w-4 h-4 mr-3' />
                    <span className='flex-1 text-left text-md'>Tools</span>
                    {utilsExpanded ? (
                      <ChevronDown className='w-4 h-4' />
                    ) : (
                      <ChevronRight className='w-4 h-4' />
                    )}
                  </Button>

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

          <div className={`${collapsed ? 'p-2' : 'p-4'} border-t`}>
            {collapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href='/help-support'
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Button
                        variant='outline'
                        size='icon'
                        className='w-full h-10'
                      >
                        <HelpCircle className='h-5 w-5' />
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side='right'>Help</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <a href='/help-support' target='_blank' rel='noopener noreferrer'>
                <Button variant='outline' className='w-full justify-start'>
                  <HelpCircle className='mr-2 h-4 w-4' />
                  Help
                </Button>
              </a>
            )}
          </div>
        </div>

        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      </aside>

      <div className='block md:hidden'>
        {/* <div className='flex items-center justify-between h-16 px-4 border-b border-primary-600'>
          <div className='flex items-center space-x-2'>
            <span className='text-lg font-semibold'>Optraflow</span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className='lg:hidden'
          >
            <X className='h-6 w-6' />
          </button>
        </div> */}

        <nav
          className={`flex-1 ${collapsed ? 'px-2' : 'px-4'
            } py-3 space-y-2 overflow-y-auto scrollbar-thin`}
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
