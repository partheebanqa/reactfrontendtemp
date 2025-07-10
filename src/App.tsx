import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { FeatureGateProvider } from '@/contexts/FeatureGateContext';
import AppLayout from '@/components/AppLayout';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import RequestChains from '@/pages/RequestChains';
import TestSuites from '@/pages/TestSuites';
import EditTestSuite from '@/pages/EditTestSuite';
import TestSuiteOverView from '@/pages/TestSuiteOverView';
import Scheduler from '@/pages/Scheduler';
import CiCdIntegration from '@/pages/CiCdIntegration';
import Executions from '@/pages/Executions';
import DataManagement from '@/pages/DataManagement';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import Pricing from '@/pages/Pricing';
import TrialDashboard from '@/pages/TrialDashboard';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ForgotPassword from '@/pages/ForgotPassword';
import NotFound from '@/pages/not-found';
import RequestBuilderPage from './pages/RequestBuilderPage';
import { ContextWrapper } from './contexts/ContextWrapper';

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  console.log('🚀 ~ Router ~ isAuthenticated:', isAuthenticated);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path='/' component={Landing} />
        <Route path='/signin' component={SignIn} />
        <Route path='/signup' component={SignUp} />
        <Route path='/forgot-password' component={ForgotPassword} />
        <Route path='/pricing' component={Pricing} />
        <Route path='/terms' component={Terms} />
        <Route path='/privacy' component={Privacy} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <ContextWrapper>
      <AppLayout>
        <Switch>
          <Route path='/' component={Dashboard} />
          <Route path='/dashboard' component={Dashboard} />
          <Route path='/request-builder' component={RequestBuilderPage} />
          <Route path='/request-chains' component={RequestChains} />
          <Route path='/test-suites' component={TestSuites} />
          <Route path='/test-suites/create' component={EditTestSuite} />
          <Route path='/test-suites/:id/edit' component={EditTestSuite} />
          <Route
            path='/test-suites/:id/overview'
            component={TestSuiteOverView}
          />
          <Route path='/scheduler' component={Scheduler} />
          <Route path='/cicd' component={CiCdIntegration} />
          <Route path='/executions' component={Executions} />
          <Route path='/data-management' component={DataManagement} />
          <Route path='/reports' component={Reports} />
          <Route path='/settings' component={Settings} />
          <Route path='/profile' component={Profile} />
          <Route path='/notifications' component={Notifications} />
          <Route path='/pricing' component={Pricing} />
          <Route path='/terms' component={Terms} />
          <Route path='/privacy' component={Privacy} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </ContextWrapper>
  );
}

function App() {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App error:', error);
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Optraflow</h1>
          <p className='text-gray-600 mb-4'>Application failed to load</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
}

export default App;
