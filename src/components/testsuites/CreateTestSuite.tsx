import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Download, Info, AlertCircle } from 'lucide-react';
import ImportCollectionModal from './ImportCollectionModal';
import TestCaseSelectionModal from './TestCaseSelectionModal';
import ImportedRequestItem from './ImportedRequestItem';

interface ImportedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  description?: string;
  testCases: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
}

const CreateTestSuite: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [importedRequests, setImportedRequests] = useState<ImportedRequest[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ImportedRequest | null>(null);
  const [showCicdInfo, setShowCicdInfo] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Generate UUID for the test suite
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const [testSuiteUUID] = useState(generateUUID());

  const handleImportRequests = (requests: any[]) => {
    const newImportedRequests = requests.map(request => ({
      ...request,
      testCases: []
    }));
    setImportedRequests([...importedRequests, ...newImportedRequests]);
  };

  const handleConfigureTestCases = (request: ImportedRequest) => {
    setCurrentRequest(request);
    setShowTestCaseModal(true);
  };

  const handleSaveTestCases = (selectedTestCases: any[]) => {
    if (currentRequest) {
      const updatedRequests = importedRequests.map(req => 
        req.id === currentRequest.id 
          ? { ...req, testCases: selectedTestCases }
          : req
      );
      setImportedRequests(updatedRequests);
    }
  };

  const handleRemoveRequest = (requestId: string) => {
    setImportedRequests(importedRequests.filter(req => req.id !== requestId));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Test Suite Name is required');
    }
    
    if (importedRequests.length === 0) {
      errors.push('At least one request must be imported');
    }
    
    const totalTestCases = importedRequests.reduce((acc, req) => acc + req.testCases.length, 0);
    if (totalTestCases === 0) {
      errors.push('At least one test case must be configured');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Convert imported requests to test cases
    const requestTestCases = importedRequests.flatMap(request => 
      request.testCases.map(testCase => ({
        id: `${request.id}_${testCase.id}`,
        name: `${request.name} - ${testCase.name}`,
        category: testCase.category,
        description: testCase.description,
        requestId: request.id,
        requestName: request.name,
        requestMethod: request.method,
        requestUrl: request.url
      }))
    );

    // Create test suite object
    const testSuite = {
      id: Date.now(),
      uuid: testSuiteUUID,
      name,
      description,
      tests: requestTestCases,
      importedRequests,
      createdAt: new Date().toISOString(),
      status: 'Not Run',
      successRate: 0,
      lastRun: 'Never',
      testsCount: {
        functional: requestTestCases.filter(t => t.category === 'functional').length,
        performance: requestTestCases.filter(t => t.category === 'performance').length,
        security: requestTestCases.filter(t => t.category === 'security').length,
      },
      testCases: requestTestCases,
      history: [],
      environment: 'Development',
      baseUrl: 'https://api.example.com'
    };

    // Get existing test suites from localStorage
    const existingTestSuites = JSON.parse(localStorage.getItem('testSuites') || '[]');
    
    // Add new test suite
    const updatedTestSuites = [...existingTestSuites, testSuite];
    
    // Save to localStorage
    localStorage.setItem('testSuites', JSON.stringify(updatedTestSuites));
    
    // Navigate to the test suites list
    navigate('/test-suites');
  };

  // Calculate total test cases from imported requests
  const totalImportedTestCases = importedRequests.reduce((acc, req) => acc + req.testCases.length, 0);

  return (
    <div className="py-6 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Test Suite</h1>
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Test Suite ID:</span>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs font-mono">{testSuiteUUID}</code>
            </div>
            <button
              onClick={() => setShowCicdInfo(true)}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Info className="h-4 w-4 mr-1" />
              CICD Integration
            </button>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Basic Information */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Test Suite Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    validationErrors.some(error => error.includes('Test Suite Name')) 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., User Authentication API Tests"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Describe the purpose of this test suite"
                />
              </div>
            </div>
          </div>

          {/* Import from Collection */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Import Requests & Configure Test Cases <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">Import API requests from collections and configure test cases for each request</p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Import Requests
              </button>
            </div>

            {importedRequests.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <span className="text-blue-700 font-medium">
                    {importedRequests.length} request{importedRequests.length !== 1 ? 's' : ''} imported
                  </span>
                  <span className="font-medium text-blue-900">
                    {totalImportedTestCases} test case{totalImportedTestCases !== 1 ? 's' : ''} configured
                  </span>
                </div>
                {importedRequests.map(request => (
                  <ImportedRequestItem
                    key={request.id}
                    request={request}
                    onConfigureTestCases={handleConfigureTestCases}
                    onRemove={handleRemoveRequest}
                  />
                ))}
              </div>
            ) : (
              <div className={`p-8 rounded-lg border border-dashed text-center ${
                validationErrors.some(error => error.includes('request')) 
                  ? 'bg-red-50 border-red-300' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="max-w-md mx-auto">
                  <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests imported yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start by importing API requests from your collections. You can then configure specific test cases for each request.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Import Your First Request
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Submit */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <div className="space-y-1">
                <div>Imported requests: {importedRequests.length}</div>
                <div className="font-medium">Total test cases: {totalImportedTestCases}</div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/test-suites')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Test Suite
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Import Collection Modal */}
      <ImportCollectionModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportRequests}
      />

      {/* Test Case Selection Modal */}
      <TestCaseSelectionModal
        isOpen={showTestCaseModal}
        onClose={() => setShowTestCaseModal(false)}
        requestName={currentRequest?.name || ''}
        onSave={handleSaveTestCases}
        initialSelectedTestCases={currentRequest?.testCases || []}
      />

      {/* CICD Info Modal */}
      {showCicdInfo && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 h-3/4 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">CICD Integration Guide</h3>
              <button
                onClick={() => setShowCicdInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Test Suite ID</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <code className="text-sm font-mono text-gray-800">{testSuiteUUID}</code>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Use this unique identifier to reference this test suite in your CICD pipeline</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">API Endpoint</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <code className="text-sm font-mono text-gray-800">POST /api/test-suites/{testSuiteUUID}/run</code>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Example CICD Configuration</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
                    <div className="space-y-2">
                      <div className="text-green-400"># GitHub Actions Example</div>
                      <div>- name: Run API Tests</div>
                      <div className="ml-2">run: |</div>
                      <div className="ml-4">curl -X POST \</div>
                      <div className="ml-6">-H "Authorization: Bearer $API_TOKEN" \</div>
                      <div className="ml-6">-H "Content-Type: application/json" \</div>
                      <div className="ml-6">https://api.testsphere.com/test-suites/{testSuiteUUID}/run</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Jenkins Pipeline Example</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
                    <div className="space-y-2">
                      <div>stage('API Tests') {'{'}</div>
                      <div className="ml-2">steps {'{'}</div>
                      <div className="ml-4">sh '''</div>
                      <div className="ml-6">curl -X POST \</div>
                      <div className="ml-8">-H "Authorization: Bearer ${'{'}API_TOKEN{'}'}" \</div>
                      <div className="ml-8">-H "Content-Type: application/json" \</div>
                      <div className="ml-8">https://api.testsphere.com/test-suites/{testSuiteUUID}/run</div>
                      <div className="ml-4">'''</div>
                      <div className="ml-2">{'}'}</div>
                      <div>{'}'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-blue-900">Important Notes</h5>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        <li>• You'll need an API token to authenticate requests</li>
                        <li>• The test suite must be saved before it can be executed via API</li>
                        <li>• Results will be available via webhook or polling the results endpoint</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowCicdInfo(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTestSuite;