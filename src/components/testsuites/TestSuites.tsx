import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Play, Edit, Trash2, Copy, Calendar } from 'lucide-react';
import Badge from '../../shared/ui/Badge';

const TestSuites: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [testSuites, setTestSuites] = useState<any[]>([]);
  
  // Load test suites from localStorage on component mount
  useEffect(() => {
    const savedTestSuites = JSON.parse(localStorage.getItem('testSuites') || '[]');
    setTestSuites([...savedTestSuites]);
  }, []);

  const handleDeleteTestSuite = (id: number) => {
    const updatedTestSuites = testSuites.filter(suite => suite.id !== id);
    setTestSuites(updatedTestSuites);
    localStorage.setItem('testSuites', JSON.stringify(updatedTestSuites));
  };

  const handleDuplicateTestSuite = (suite: any) => {
    const newSuite = {
      ...suite,
      id: Date.now(),
      name: `${suite.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedTestSuites = [...testSuites, newSuite];
    setTestSuites(updatedTestSuites);
    localStorage.setItem('testSuites', JSON.stringify(updatedTestSuites));
  };

  const formatScheduledDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  
  const filteredTestSuites = testSuites.filter(suite => {
    const matchesSearch = suite.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         suite.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || suite.status?.toLowerCase() === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Test Suites</h1>
        <div className="mt-3 sm:mt-0 bg-blue-600 rounded-md">
          <Link
            to="/test-suites/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Test Suite
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search test suites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="block border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Play className="h-4 w-4 mr-2" />
            Run All Suites
          </button>
        </div>
      </div>
      
      {/* Test Suites List */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {filteredTestSuites.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No test suites found matching your criteria.</p>
          </div>
        ) : (
          filteredTestSuites.map((suite) => (
            <div key={suite.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link to={`/test-suites/${suite.id}`} className="hover:text-blue-500">
                        {suite.name}
                      </Link>
                    </h3>
                    {suite.status && (
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        suite.status === 'Passed' ? 'bg-green-100 text-green-800' : 
                        suite.status === 'Failed' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {suite.status}
                      </span>
                    )}
                    {suite.scheduledRun && (
                      <span className="ml-2 flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Scheduled: {formatScheduledDate(suite.scheduledRun)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{suite.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Created: {new Date(suite.createdAt).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <div className="flex space-x-2">
                      <Badge color="blue" text={`${suite.tests.filter((t: any) => t.category === 'functional').length} Functional`} />
                      <Badge color="purple" text={`${suite.tests.filter((t: any) => t.category === 'performance').length} Performance`} />
                      <Badge color="orange" text={`${suite.tests.filter((t: any) => t.category === 'security').length} Security`} />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <button
                    className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
                    title="Run test suite"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                  <Link
                    to={`/test-suites/${suite.id}/edit`}
                    className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
                    title="Edit test suite"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDuplicateTestSuite(suite)}
                    className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
                    title="Duplicate test suite"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTestSuite(suite.id)}
                    className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                    title="Delete test suite"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TestSuites;