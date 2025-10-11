import AnalyticsReport from "@/components/Reports/Components/Analistics";
import DetailedTestResults from "@/components/Reports/Components/DetailedTestResults";
import TestCategoryCard from "@/components/Reports/Components/TestCategoryCard";
import ReportsHeader from "@/components/Reports/ReportsHeader";
import { FileCode, Settings2, Shield, ShieldCheck, Zap } from "lucide-react";


const testCategories = [
  {
    name: 'Functional Tests',
    icon: <Settings2 className="w-4 h-4 text-blue-600" />,
    testCount: 12,
    tests: [
      {
        name: 'Login Response Schema Validation',
        method: 'POST',
        endpoint: '/api/auth/login',
        duration: '45ms',
        statusCode: 200,
        status: 'success',
      },
      {
        name: 'User Profile Schema Validation',
        method: 'GET',
        endpoint: '/api/users/profile',
        duration: '38ms',
        statusCode: 200,
        status: 'success',
      },
    ],
  },
  {
    name: 'Schema Tests',
    icon: <FileCode className="w-4 h-4 text-purple-600" />,
    testCount: 6,
    tests: [
      {
        name: 'Login Response Schema Validation',
        method: 'POST',
        endpoint: '/api/auth/login',
        duration: '45ms',
        statusCode: 200,
        status: 'success',
      },
      {
        name: 'User Profile Schema Validation',
        method: 'GET',
        endpoint: '/api/users/profile',
        duration: '38ms',
        statusCode: 200,
        status: 'success',
      },
    ],
  },
  {
    name: 'Performance Tests',
    icon: <Zap className="w-4 h-4 text-yellow-600" />,
    testCount: 4,
    tests: [
      {
        name: 'Login Endpoint Response Time',
        method: 'POST',
        endpoint: '/api/auth/login',
        duration: '145ms',
        statusCode: 200,
        status: 'success',
      },
    ],
  },
  {
    name: 'Security Tests',
    icon: <Shield className="w-4 h-4 text-red-600" />,
    testCount: 2,
    tests: [
      {
        name: 'Login Response Schema Validation',
        method: 'POST',
        endpoint: '/api/auth/login',
        duration: '45ms',
        statusCode: 200,
        status: 'success',
      },
      {
        name: 'User Profile Schema Validation',
        method: 'GET',
        endpoint: '/api/users/profile',
        duration: '38ms',
        statusCode: 200,
        status: 'success',
      },
    ],
  },
];


const TestSuiteReport = () => {
  return (
    <div className="px-1 py-1">
      <ReportsHeader
        title="Test Suite Reports"
        subtitle="View and export execution metrics"
        onExport={() => console.log("Exporting...")}
        onGenerateReport={() => console.log("Generating report...")}
      />
      <AnalyticsReport
        title="User Authentication API Test Suite"
        description="Comprehensive testing of user authentication endpoints including login, registration, password reset, and profile management."
        successRate="83%"
        meta={{
          environment: 'Staging',
          executedAt: '3/15/2024',
          duration: '4s',
          executedBy: 'Jane Smith',
        }}
        stats={[
          {
            value: '6',
            label: 'Total Requests',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
          },
          {
            value: '5',
            label: 'Successful',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
          },
          {
            value: '1',
            label: 'Failed',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700',
          },
          {
            value: '0',
            label: 'Skipped',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700',
          },
        ]}
      />
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-5">
        <TestCategoryCard
          icon={<Settings2 className="w-5 h-5" />}
          title="Functional Tests"
          total={12}
          passed={10}
          failed={1}
          warning={1}
          borderColor="border border-blue-200"
        />
        <TestCategoryCard
          icon={<FileCode className="w-5 h-5 text-purple-600" />}
          title="Schema Tests"
          total={6}
          passed={6}
          failed={0}
          warning={0}
        />
        <TestCategoryCard
          icon={<Zap className="w-5 h-5 text-yellow-600" />}
          title="Performance Tests"
          total={4}
          passed={3}
          failed={0}
          warning={1}
          bgColor="bg-yellow-50"
          borderColor="border border-yellow-200"
        />
        <TestCategoryCard
          icon={<ShieldCheck className="w-5 h-5 text-red-600" />}
          title="Security Tests"
          total={2}
          passed={1}
          failed={1}
          warning={0}
          bgColor="bg-red-50"
          borderColor="border border-red-200"
        />
      </div> */}

      <DetailedTestResults categories={testCategories} />
    </div>
  );
};

export default TestSuiteReport;
