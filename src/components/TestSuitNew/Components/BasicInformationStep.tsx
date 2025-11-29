import { TestSuite } from '@/types';
import { FileText, Tag, Globe } from 'lucide-react';


interface BasicInformationStepProps {
  testSuite: Partial<TestSuite>;
  onUpdate: (data: Partial<TestSuite>) => void;
}

const environments = [
  { value: '', label: 'No Environment' },
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
  { value: 'qa', label: 'QA' },
  { value: 'custom', label: 'Custom' },
];

export function BasicInformationStep({ testSuite, onUpdate }: BasicInformationStepProps) {
  const handleCustomEnvironment = (value: string) => {
    if (value && value !== 'custom') {
      onUpdate({ ...testSuite, environment: value });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Basic Information
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Provide essential details about your test suite
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="suite-name" className="block text-sm font-semibold text-gray-900 mb-2">
            Test Suite Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              id="suite-name"
              type="text"
              value={testSuite.name || ''}
              onChange={(e) => onUpdate({ ...testSuite, name: e.target.value })}
              placeholder="e.g., User Management API Tests"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Give your test suite a descriptive name to identify it later
          </p>
        </div>

        <div>
          <label htmlFor="suite-description" className="block text-sm font-semibold text-gray-900 mb-2">
            Description <span className="text-gray-400 text-sm font-normal">(optional)</span>
          </label>
          <textarea
            id="suite-description"
            value={testSuite.description || ''}
            onChange={(e) => onUpdate({ ...testSuite, description: e.target.value })}
            placeholder="e.g., Comprehensive test suite for all user management endpoints including authentication, profile management, and user preferences."
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Add context about what this test suite covers
          </p>
        </div>

        <div>
          <label htmlFor="environment" className="block text-sm font-semibold text-gray-900 mb-2">
            Environment <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              id="environment"
              value={testSuite.environment || ''}
              onChange={(e) => handleCustomEnvironment(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {environments.map((env) => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Select the target environment for these tests
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">Development</p>
            <p className="text-xs text-blue-800">Local and development environments</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-900 mb-1">Staging</p>
            <p className="text-xs text-yellow-800">Pre-production testing</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-900 mb-1">Production</p>
            <p className="text-xs text-red-800">Live environment testing</p>
          </div>
        </div>

        {testSuite.name && testSuite.environment && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">Ready to proceed</p>
              <p className="text-xs text-green-800 mt-0.5">
                All required information has been filled in
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
