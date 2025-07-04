import { Switch, Route } from "wouter";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/Landing";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/modules/dashboard/DashboardPage";
import RequestBuilder from "@/modules/requestbuilder/RequestbuilderPage";
import TestSuites from "@/modules/testsuites/TestsuitesPage";
import RequestChains from "@/modules/requestchains/RequestchainsPage";
import Scheduler from "@/modules/scheduler/SchedulerPage";
import Executions from "@/modules/executions/ExecutionsPage";
import CicdIntegration from "@/modules/cicd/CicdIntegrationPage";
import Profile from "@/modules/profile/ProfilePage";
import Settings from "@/modules/settings/SettingsPage";
import DataManagement from "@/modules/datamanagement/DataManagementPage";
import Utilities from "@/modules/utilities/UtilitiesPage";
import Reports from "@/modules/reports/ReportsPage";
import Notifications from "@/modules/notifications/NotificationsPage";
import NotFound from "@/pages/not-found";

// Layout
import AppLayout from "@/components/AppLayout";

export default function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/signin" component={SignIn} />
          <Route path="/signup" component={SignUp} />
          <Route path="/forgot-password" component={ForgotPassword} />
        </>
      ) : (
        <AppLayout>
          <Route path="/" component={Dashboard} />
          <Route path="/request-builder" component={RequestBuilder} />
          <Route path="/test-suites" component={TestSuites} />
          <Route path="/request-chains" component={RequestChains} />
          <Route path="/scheduler" component={Scheduler} />
          <Route path="/executions" component={Executions} />
          <Route path="/cicd" component={CicdIntegration} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="/data-management" component={DataManagement} />
          <Route path="/utilities" component={Utilities} />
          <Route path="/reports" component={Reports} />
          <Route path="/notifications" component={Notifications} />
        </AppLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}