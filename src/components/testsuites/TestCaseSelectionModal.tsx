import React, { useState } from 'react';
import { X, Plus, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface TestCaseOption {
  id: string;
  name: string;
  category: 'functional' | 'performance' | 'security';
  description: string;
  tags?: string[];
}

interface TestCaseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestName: string;
  onSave: (selectedTestCases: TestCaseOption[]) => void;
  initialSelectedTestCases?: TestCaseOption[];
}

const TestCaseSelectionModal: React.FC<TestCaseSelectionModalProps> = ({
  isOpen,
  onClose,
  requestName,
  onSave,
  initialSelectedTestCases = []
}) => {
  const [activeTab, setActiveTab] = useState<'functional' | 'performance' | 'security'>('functional');
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(
    new Set(initialSelectedTestCases.map(tc => tc.id))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['functional', 'performance', 'security']));

  // Expanded test case templates with more options
  const testCaseOptions: TestCaseOption[] = [
    // Functional Test Cases
    { id: 'func_success', name: 'Successful Response', category: 'functional', description: 'Verify the request returns a successful response (2xx status code)', tags: ['basic', 'response'] },
    { id: 'func_validation', name: 'Input Validation', category: 'functional', description: 'Test request with invalid input parameters', tags: ['validation', 'error'] },
    { id: 'func_auth', name: 'Authentication Required', category: 'functional', description: 'Verify request fails without proper authentication', tags: ['auth', 'security'] },
    { id: 'func_not_found', name: 'Resource Not Found', category: 'functional', description: 'Test request with non-existent resource ID', tags: ['error', '404'] },
    { id: 'func_method_not_allowed', name: 'Method Not Allowed', category: 'functional', description: 'Test with unsupported HTTP method', tags: ['error', '405'] },
    { id: 'func_content_type', name: 'Content Type Validation', category: 'functional', description: 'Test with incorrect content-type header', tags: ['headers', 'validation'] },
    { id: 'func_login_failure', name: 'User Login Failure', category: 'functional', description: 'Verify login failure with invalid credentials', tags: ['auth', 'login'] },
    { id: 'func_registration', name: 'User Registration', category: 'functional', description: 'Test user registration process', tags: ['auth', 'registration'] },
    { id: 'func_password_reset', name: 'Password Reset', category: 'functional', description: 'Test password reset functionality', tags: ['auth', 'password'] },
    { id: 'func_logout', name: 'User Logout', category: 'functional', description: 'Verify user logout process', tags: ['auth', 'logout'] },
    { id: 'func_data_format', name: 'Response Data Format', category: 'functional', description: 'Verify response data structure and format', tags: ['response', 'format'] },
    { id: 'func_pagination', name: 'Pagination Testing', category: 'functional', description: 'Test pagination parameters and responses', tags: ['pagination', 'data'] },
    { id: 'func_sorting', name: 'Sorting Functionality', category: 'functional', description: 'Test sorting parameters and order', tags: ['sorting', 'data'] },
    { id: 'func_filtering', name: 'Data Filtering', category: 'functional', description: 'Test filtering capabilities and parameters', tags: ['filtering', 'data'] },
    { id: 'func_boundary', name: 'Boundary Value Testing', category: 'functional', description: 'Test with boundary values and edge cases', tags: ['boundary', 'edge-case'] },
    
    // Performance Test Cases
    { id: 'perf_response_time', name: 'Response Time', category: 'performance', description: 'Verify response time is within acceptable limits', tags: ['timing', 'sla'] },
    { id: 'perf_concurrent', name: 'Concurrent Requests', category: 'performance', description: 'Test multiple simultaneous requests', tags: ['concurrency', 'load'] },
    { id: 'perf_load', name: 'Load Testing', category: 'performance', description: 'Test under high request volume', tags: ['load', 'volume'] },
    { id: 'perf_memory', name: 'Memory Usage', category: 'performance', description: 'Monitor memory consumption during request processing', tags: ['memory', 'resources'] },
    { id: 'perf_throughput', name: 'Throughput Testing', category: 'performance', description: 'Measure requests per second capacity', tags: ['throughput', 'capacity'] },
    { id: 'perf_stress', name: 'Stress Testing', category: 'performance', description: 'Test beyond normal operational capacity', tags: ['stress', 'limits'] },
    { id: 'perf_spike', name: 'Spike Testing', category: 'performance', description: 'Test sudden increases in load', tags: ['spike', 'burst'] },
    { id: 'perf_endurance', name: 'Endurance Testing', category: 'performance', description: 'Test sustained load over extended periods', tags: ['endurance', 'stability'] },
    { id: 'perf_scalability', name: 'Scalability Testing', category: 'performance', description: 'Test system scaling capabilities', tags: ['scalability', 'growth'] },
    { id: 'perf_resource', name: 'Resource Utilization', category: 'performance', description: 'Monitor CPU, memory, and network usage', tags: ['resources', 'monitoring'] },
    
    // Security Test Cases
    { id: 'sec_sql_injection', name: 'SQL Injection', category: 'security', description: 'Test for SQL injection vulnerabilities', tags: ['injection', 'database'] },
    { id: 'sec_xss', name: 'XSS Protection', category: 'security', description: 'Test for cross-site scripting vulnerabilities', tags: ['xss', 'injection'] },
    { id: 'sec_csrf', name: 'CSRF Protection', category: 'security', description: 'Test for cross-site request forgery protection', tags: ['csrf', 'tokens'] },
    { id: 'sec_rate_limit', name: 'Rate Limiting', category: 'security', description: 'Test API rate limiting functionality', tags: ['rate-limit', 'throttling'] },
    { id: 'sec_authorization', name: 'Authorization Check', category: 'security', description: 'Verify proper user authorization controls', tags: ['authorization', 'permissions'] },
    { id: 'sec_data_exposure', name: 'Data Exposure', category: 'security', description: 'Check for sensitive data exposure in responses', tags: ['data-leak', 'privacy'] },
    { id: 'sec_input_sanitization', name: 'Input Sanitization', category: 'security', description: 'Test input sanitization and validation', tags: ['sanitization', 'validation'] },
    { id: 'sec_session_management', name: 'Session Management', category: 'security', description: 'Test session handling and security', tags: ['session', 'tokens'] },
    { id: 'sec_encryption', name: 'Data Encryption', category: 'security', description: 'Verify data encryption in transit and at rest', tags: ['encryption', 'tls'] },
    { id: 'sec_access_control', name: 'Access Control', category: 'security', description: 'Test role-based access controls', tags: ['access-control', 'rbac'] },
    { id: 'sec_audit_logging', name: 'Audit Logging', category: 'security', description: 'Verify security event logging', tags: ['logging', 'audit'] },
    { id: 'sec_vulnerability_scan', name: 'Vulnerability Scanning', category: 'security', description: 'Automated vulnerability detection', tags: ['vulnerability', 'scanning'] },
  ];

  const toggleTestCase = (testCaseId: string) => {
    const newSelected = new Set(selectedTestCases);
    if (newSelected.has(testCaseId)) {
      newSelected.delete(testCaseId);
    } else {
      newSelected.add(testCaseId);
    }
    setSelectedTestCases(newSelected);
  };

  const selectAllInCategory = (category: 'functional' | 'performance' | 'security') => {
    const categoryTestCases = getFilteredTestCases().filter(tc => tc.category === category);
    const newSelected = new Set(selectedTestCases);
    const allSelected = categoryTestCases.every(tc => newSelected.has(tc.id));
    
    if (allSelected) {
      categoryTestCases.forEach(tc => newSelected.delete(tc.id));
    } else {
      categoryTestCases.forEach(tc => newSelected.add(tc.id));
    }
    setSelectedTestCases(newSelected);
  };

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getFilteredTestCases = () => {
    return testCaseOptions.filter(tc => {
      const matchesSearch = searchTerm === '' || 
        tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || tc.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  const handleSave = () => {
    const selectedOptions = testCaseOptions.filter(tc => selectedTestCases.has(tc.id));
    onSave(selectedOptions);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'functional': return '🔧';
      case 'performance': return '⚡';
      case 'security': return '🛡️';
      default: return '📋';
    }
  };

  const getTabColor = (category: string, isActive: boolean) => {
    if (!isActive) return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    
    switch (category) {
      case 'functional': return 'border-blue-500 text-blue-600';
      case 'performance': return 'border-purple-500 text-purple-600';
      case 'security': return 'border-orange-500 text-orange-600';
      default: return 'border-primary-500 text-primary-600';
    }
  };

  const filteredTestCases = getFilteredTestCases();
  const selectedTestCasesList = testCaseOptions.filter(tc => selectedTestCases.has(tc.id));

  // Group test cases by category for better organization
  const groupedTestCases = filteredTestCases.reduce((acc, tc) => {
    if (!acc[tc.category]) {
      acc[tc.category] = [];
    }
    acc[tc.category].push(tc);
    return acc;
  }, {} as Record<string, TestCaseOption[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Select Test Cases</h3>
            <p className="text-sm text-gray-500 mt-1">Choose test cases for: <span className="font-medium">{requestName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search test cases by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                <option value="functional">Functional</option>
                <option value="performance">Performance</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Available Tests Section */}
          <div className="flex-1 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium text-gray-900">Available Tests ({filteredTestCases.length})</h4>
              <div className="text-sm text-gray-500">
                {selectedTestCases.size} selected
              </div>
            </div>
            
            {filteredTestCases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No test cases match your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedTestCases).map(([category, testCases]) => (
                  <div key={category} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleCategoryExpansion(category)}
                          className="flex items-center text-left flex-1"
                        >
                          <div className="flex items-center">
                            {expandedCategories.has(category) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                            ) : (
                              <ChevronUp className="h-4 w-4 text-gray-500 mr-2" />
                            )}
                            <span className="mr-2">{getCategoryIcon(category)}</span>
                            <h5 className="text-sm font-medium text-gray-900 capitalize">{category}</h5>
                            <span className="ml-2 text-xs text-gray-500">({testCases.length})</span>
                          </div>
                        </button>
                        <button
                          onClick={() => selectAllInCategory(category as 'functional' | 'performance' | 'security')}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {testCases.every(tc => selectedTestCases.has(tc.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>

                    {expandedCategories.has(category) && (
                      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                        {testCases.map((testCase) => (
                          <div
                            key={testCase.id}
                            className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleTestCase(testCase.id)}
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                checked={selectedTestCases.has(testCase.id)}
                                onChange={() => toggleTestCase(testCase.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <h5 className="text-sm font-medium text-gray-900">{testCase.name}</h5>
                              <p className="text-xs text-gray-500 mt-1">{testCase.description}</p>
                              {testCase.tags && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {testCase.tags.map(tag => (
                                    <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTestCase(testCase.id);
                              }}
                              className="ml-2 p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Tests Section */}
          <div className="w-1/3 p-6 bg-gray-50 overflow-y-auto">
            <h4 className="text-base font-medium text-gray-900 mb-4">Selected Tests ({selectedTestCases.size})</h4>
            
            {selectedTestCasesList.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">No tests selected yet. Choose tests from the available tests section.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTestCasesList.map((testCase) => (
                  <div
                    key={testCase.id}
                    className="flex items-start p-3 bg-white border border-blue-200 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="mr-2">{getCategoryIcon(testCase.category)}</span>
                        <h5 className="text-sm font-medium text-gray-900">{testCase.name}</h5>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{testCase.description}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        testCase.category === 'functional' ? 'bg-blue-100 text-blue-800' :
                        testCase.category === 'performance' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {testCase.category.charAt(0).toUpperCase() + testCase.category.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleTestCase(testCase.id)}
                      className="ml-2 p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedTestCases.size} test case{selectedTestCases.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Test Cases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCaseSelectionModal;