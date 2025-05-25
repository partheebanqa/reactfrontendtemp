import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, PlusCircle, Layers, Activity, ShieldAlert } from 'lucide-react';
import DraggableTestList from './DraggableTestList';
import { TestCase } from '../../shared/types/testSuitesTypes';

const CreateTestSuite: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState('functional');
  const [selectedTests, setSelectedTests] = useState<TestCase[]>([]);

  // Sample test cases
  const testCases = {
    functional: [
      { id: 'f1', name: 'User Login Success', category: 'functional', description: 'Verify successful user login with valid credentials' },
      { id: 'f2', name: 'User Login Failure', category: 'functional', description: 'Verify login failure with invalid credentials' },
      { id: 'f3', name: 'User Registration', category: 'functional', description: 'Test user registration process' },
      { id: 'f4', name: 'Password Reset', category: 'functional', description: 'Test password reset functionality' },
      { id: 'f5', name: 'User Logout', category: 'functional', description: 'Verify user logout process' },
      { id: 'f6', name: 'Get User Profile', category: 'functional', description: 'Retrieve user profile information' },
      { id: 'f7', name: 'Update User Profile', category: 'functional', description: 'Test updating user profile data' },
      { id: 'f8', name: 'Delete User Account', category: 'functional', description: 'Test user account deletion' },
    ],
    performance: [
      { id: 'p1', name: 'API Response Time', category: 'performance', description: 'Measure API endpoint response times' },
      { id: 'p2', name: 'Concurrent Users', category: 'performance', description: 'Test with multiple concurrent user requests' },
      { id: 'p3', name: 'Load Testing', category: 'performance', description: 'Test system under heavy load' },
      { id: 'p4', name: 'Stress Testing', category: 'performance', description: 'Test system beyond normal operational capacity' },
      { id: 'p5', name: 'Endurance Testing', category: 'performance', description: 'Test system under sustained load over time' },
    ],
    security: [
      { id: 's1', name: 'Authentication Check', category: 'security', description: 'Test API authentication mechanisms' },
      { id: 's2', name: 'Authorization Check', category: 'security', description: 'Verify proper user authorization controls' },
      { id: 's3', name: 'SQL Injection', category: 'security', description: 'Test for SQL injection vulnerabilities' },
      { id: 's4', name: 'XSS Protection', category: 'security', description: 'Test for cross-site scripting vulnerabilities' },
      { id: 's5', name: 'CSRF Protection', category: 'security', description: 'Test for cross-site request forgery vulnerabilities' },
      { id: 's6', name: 'Rate Limiting', category: 'security', description: 'Test API rate limiting functionality' },
    ]
  };

  const handleAddTest = (test: TestCase) => {
    if (!selectedTests.some(t => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(test => test.id !== testId));
  };

  const handleReorderTests = (reorderedTests: TestCase[]) => {
    setSelectedTests(reorderedTests);
  };

  const handleSelectAllTests = (category: 'functional' | 'security') => {
    const currentTests = testCases[category];
    const newTests = currentTests.filter(test => !selectedTests.some(t => t.id === test.id));
    setSelectedTests([...selectedTests, ...newTests]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create test suite object
    const testSuite = {
      id: Date.now(), // Use timestamp as a simple unique ID
      name,
      description,
      tests: selectedTests,
      createdAt: new Date().toISOString(),
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

  return (
    <div className="space-y-6 py-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Test Suite</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Basic Information */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Test Suite Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="e.g., User Authentication API Tests"
                  required
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
          
          {/* Test Selection */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Test Cases</h2>
            
            <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-6 lg:space-y-0">
              {/* Available Tests */}
              <div className="flex-1">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Available Tests</h3>
                  
                  <div className="mb-4">
                    <div className="flex space-x-1 border-b border-gray-200">
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'functional' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('functional')}
                      >
                        <div className="flex items-center">
                          <Layers className="h-4 w-4 mr-1" />
                          Functional
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'performance' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('performance')}
                      >
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-1" />
                          Performance
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'security' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('security')}
                      >
                        <div className="flex items-center">
                          <ShieldAlert className="h-4 w-4 mr-1" />
                          Security
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Select All Button */}
                  {(activeTab === 'functional' || activeTab === 'security') && (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => handleSelectAllTests(activeTab as 'functional' | 'security')}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-500 bg-primary-50 rounded-md hover:bg-primary-100"
                      >
                        Select All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tests
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {testCases[activeTab as keyof typeof testCases].map(test => (
                      <div key={test.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all">
                        <div>
                          <h4 className="font-medium text-gray-900">{test.name}</h4>
                          <p className="text-sm text-gray-500">{test.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddTest(test)}
                          className="ml-2 p-1 text-blue-500 hover:text-primary-800 rounded-full hover:bg-primary-50"
                          title="Add to test suite"
                        >
                          <PlusCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Selected Tests */}
              <div className="flex-1">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Tests</h3>
                  
                  {selectedTests.length === 0 ? (
                    <div className="bg-white p-6 rounded border border-dashed border-gray-300 text-center">
                      <p className="text-gray-500">No tests selected yet. Add tests from the available tests section.</p>
                    </div>
                  ) : (
                    <DraggableTestList 
                      tests={selectedTests} 
                      onRemove={handleRemoveTest}
                      onReorder={handleReorderTests}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/test-suites')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 bg-blue-500 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={!name || selectedTests.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Test Suite
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateTestSuite;