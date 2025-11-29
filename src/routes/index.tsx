import { Switch, Route, Redirect } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

// Pages
import Landing from '@/pages/Landing';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ForgotPassword from '@/pages/ForgotPassword';
import NotFound from '@/pages/not-found';

// Layout
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';
import RequestBuilderPage from '@/pages/RequestBuilderPage';
import TestSuites from '@/pages/TestSuites';
import RequestChains from '@/pages/RequestChains';
import Scheduler from '@/pages/Scheduler';
import Executions from '@/pages/Executions';
import CiCdIntegration from '@/pages/CiCdIntegration';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import DataManagement from '@/pages/DataManaement';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import SwaggerParser from '@/pages/SwaggerParser';
import JsonParser from '@/pages/JsonParser';
import EditTestSuite from '@/pages/EditTestSuite';
import Pricing from '@/pages/Pricing';
import Plan from '@/components/Plan/Plan';
import CICDConfiguration from '@/pages/CICDConfiguration';
import AccountSettingsPage from '@/pages/AccountSettingsPage';
import ExecutionsNew from '@/pages/ExecutionsNew';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPolicy';
import ContactPage from '@/pages/ContactPage';
import ExecutionReportsPage from '@/pages/ExecutionReportsPage';
import RequestChainReport from '@/pages/RequestChainReport';
import TestSuiteReport from '@/pages/TestSuiteReport';
import { ExecutionDetailsDialog } from '@/components/Executions/ExecutionDetailsDialog';
import ExecutionReportPage from '@/components/Executions/ExecutionReportPage';
import FAQ from '@/pages/FAQ';
import ResetPassword from '@/pages/ResetPassword';
import RequestChainCreate from '@/pages/RequestChainCreate';
import RequestChainEdit from '@/pages/RequestChainEdit';
import { Loader } from '@/components/Loader';
import CreateTestSuit from '@/components/TestSuitNew/CreateTestSuit';

export default function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <>
        <Loader message='Loading ' />
      </>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path='/' component={Landing} />
          <Route path='/signin' component={SignIn} />
          <Route path='/signup' component={SignUp} />
          <Route path='/forgot-password' component={ForgotPassword} />
          <Route path='/reset-password' component={ResetPassword} />
        </>
      ) : (
        <AppLayout>
          <Route path='/' children={<Redirect to='/dashboard' />} />
          <Route path='/dashboard' component={Dashboard} />
          <Route path='/json-parser' component={JsonParser} />
          <Route path='/swagger-parser' component={SwaggerParser} />
          <Route path='/request-builder' component={RequestBuilderPage} />
          <Route path='/request-chains' component={RequestChains} />
          <Route path='/request-chains/create' component={RequestChainCreate} />
          <Route path='/request-chains/:id/edit' component={RequestChainEdit} />
          <Route path='/test-suites' component={TestSuites} />
          <Route path='/test-suites/:id/edit' component={EditTestSuite} />
          <Route path='/test-suites/create' component={EditTestSuite} />
          <Route path='/create-test-suite' component={CreateTestSuit} />
          <Route path="/test-suites/:id" component={CreateTestSuit} />
          <Route path='/scheduler' component={Scheduler} />
          <Route path='/cicd' component={CiCdIntegration} />
          <Route path='/data-management' component={DataManagement} />
          <Route path='/reports' component={Reports} />
          <Route path='/settings' component={Settings} />
          <Route path='/profile' component={Profile} />
          <Route path='/notifications' component={Notifications} />
          <Route path='/settings/account' component={AccountSettingsPage} />
          <Route path='/cicd-configuration' component={CICDConfiguration} />
          <Route path='/executions' component={Executions} />
          <Route path='/executions-reports' component={ExecutionReportsPage} />
          <Route
            path='/executions/report/:type/:entityId'
            component={ExecutionReportPage}
          />
          <Route path='/request-chain-reports' component={RequestChainReport} />
          <Route path='/test-suite-reports' component={TestSuiteReport} />
          <Route path='/faq' component={FAQ} />
        </AppLayout>
      )}
      <Route path='/pricing' component={Pricing} />
      <Route path='/terms' component={TermsPage} />
      <Route path='/privacy' component={PrivacyPage} />
      <Route path='/contact-us' component={ContactPage} />
      <Route path='*' component={NotFound} />
    </Switch>
  );
}
