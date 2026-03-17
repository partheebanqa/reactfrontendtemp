import { Switch, Route, Redirect } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import React, { Suspense, lazy } from 'react';

const AppLayout = lazy(() => import('@/components/AppLayout'));
import { Loader } from '@/components/Loader';

const Landing = lazy(() => import('@/pages/Landing'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPolicy'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const FaqPageNew = lazy(() => import('@/pages/FaqPageNew'));
const PilotProgram = lazy(
  () => import('@/components/PilotProgram/PilotProgram'),
);

const JWTValidator = lazy(() =>
  import('@/pages/JWTValidator').then((m) => ({ default: m.JWTValidator })),
);
const URLEncoder = lazy(() =>
  import('@/pages/URLEncoder').then((m) => ({ default: m.URLEncoder })),
);
const JsonParser = lazy(() => import('@/pages/JsonParser'));
const SwaggerParser = lazy(() => import('@/pages/SwaggerParser'));
const SwaggerParserNew = lazy(
  () => import('@/components/SwaggerParse/ImprovedSwaggerParser'),
);
const JsonViewer = lazy(() => import('@/pages/JsonViewer'));
const UTFEncoderDecoder = lazy(() => import('@/pages/UTFEncoderDecoder'));
const BS64EncoderDecoder = lazy(() => import('@/pages/BS64EncoderDecoder'));

const SignIn = lazy(() => import('@/pages/SignIn'));
const SignUp = lazy(() => import('@/pages/SignUp'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const FAQ = lazy(() => import('@/pages/FAQ'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const RequestBuilderPage = lazy(() => import('@/pages/RequestBuilderPage'));
const RequestChains = lazy(() => import('@/pages/RequestChains'));
const RequestChainsList = lazy(
  () => import('@/components/RequestChains/RequestChainList'),
);
const RequestChainCreate = lazy(() => import('@/pages/RequestChainCreate'));
const RequestChainEdit = lazy(() => import('@/pages/RequestChainEdit'));
const TestSuites = lazy(() => import('@/pages/TestSuites'));
const TestSuiteList = lazy(
  () => import('@/components/TestSuit/TestSuiteListNew'),
);

const CreateTestSuit = lazy(
  () => import('@/components/TestSuitNew/CreateTestSuit'),
);
const EditTestSuite = lazy(() => import('@/pages/EditTestSuite'));
const Scheduler = lazy(() => import('@/pages/Scheduler'));
const CiCdIntegration = lazy(() => import('@/pages/CiCdIntegration'));
const CICDConfiguration = lazy(() => import('@/pages/CICDConfiguration'));
const DataManagement = lazy(() => import('@/pages/DataManaement'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const AccountSettingsPage = lazy(() => import('@/pages/AccountSettingsPage'));
const Profile = lazy(() => import('@/pages/Profile'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Executions = lazy(() => import('@/pages/Executions'));
const ExecutionReportsPage = lazy(() => import('@/pages/ExecutionReportsPage'));
const ExecutionReportPage = lazy(
  () => import('@/components/Executions/ExecutionReportPage'),
);
const RequestChainReport = lazy(() => import('@/pages/RequestChainReport'));
const TestSuiteReport = lazy(() => import('@/pages/TestSuiteReport'));
const Plan = lazy(() => import('@/components/Plan/Plan'));
const NotFound = lazy(() => import('@/pages/not-found'));

function PageLoader() {
  return <Loader message='Loading' />;
}

export default function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader message='Loading' />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path='/' component={Landing} />
        <Route path='/pricing' component={Pricing} />
        <Route path='/terms' component={TermsPage} />
        <Route path='/faq' component={FaqPageNew} />
        <Route path='/pilot-program' component={PilotProgram} />
        <Route path='/jwt-validator' component={JWTValidator} />
        <Route path='/url-encoder' component={URLEncoder} />
        <Route path='/json-parser' component={JsonParser} />
        <Route path='/swagger-parser' component={SwaggerParser} />
        <Route path='/swagger-parser-new' component={SwaggerParserNew} />
        <Route path='/json-viewer' component={JsonViewer} />
        <Route path='/utf-encoder-decoder' component={UTFEncoderDecoder} />
        <Route path='/bs64-encoder-decoder' component={BS64EncoderDecoder} />
        <Route path='/privacy' component={PrivacyPage} />
        <Route path='/contact-us' component={ContactPage} />

        {!isAuthenticated ? (
          <>
            <Route path='/signin' component={SignIn} />
            <Route path='/signup' component={SignUp} />
            <Route path='/forgot-password' component={ForgotPassword} />
            <Route path='/reset-password' component={ResetPassword} />
            <Route path='/help-document' component={FAQ} />
          </>
        ) : (
          <AppLayout>
            <Route path='/dashboard' component={Dashboard} />
            <Route path='/request-builder' component={RequestBuilderPage} />
            <Route path='/request-chains' component={RequestChains} />
            <Route path='/request-chains-list' component={RequestChainsList} />
            <Route
              path='/request-chains/create'
              component={RequestChainCreate}
            />
            <Route
              path='/request-chains/:id/edit'
              component={RequestChainEdit}
            />
            <Route path='/test-suites' component={TestSuites} />
            <Route path='/test-suites-list' component={TestSuiteList} />
            <Route path='/test-suites/:id/edit' component={CreateTestSuit} />
            <Route path='/test-suites/creates' component={EditTestSuite} />
            <Route path='test-suites/create-new' component={CreateTestSuit} />
            <Route path='/test-suites/:id' component={CreateTestSuit} />
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
            <Route path='/executions/report' component={Executions} />
            <Route
              path='/executions-reports'
              component={ExecutionReportsPage}
            />
            <Route
              path='/executions/report/:type/:entityId'
              component={ExecutionReportPage}
            />
            <Route
              path='/request-chain-reports'
              component={RequestChainReport}
            />
            <Route path='/test-suite-reports' component={TestSuiteReport} />
            <Route path='/help-support' component={FAQ} />
          </AppLayout>
        )}

        <Route path='*' component={NotFound} />
      </Switch>
    </Suspense>
  );
}
