import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  Calendar,
  Play,
  Edit,
  Copy,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { TestCaseItem } from './TestCaseItem';

const TestSuiteOverView = () => {
  const [activeTab, setActiveTab] = useState('Test Cases');

  const tabs = ['Test Cases', 'Run History', 'Settings'];

  const testCases = [
    {
      title: 'Get User Profile - Successful Response',
      description:
        'Verify the request returns a successful response (2xx status code)',
      type: 'Functional',
      expanded: true,
    },
    {
      title: 'Get User Profile - Input Validation',
      description: 'Test request with invalid input parameters',
      type: 'Functional',
      expanded: false,
    },
    {
      title: 'Get User Profile - Authentication Required',
      description: '',
      type: 'Functional',
      expanded: false,
    },
  ];

  return (
    <div className='flex flex-col h-full'>
      {/* Test Suite Header */}
      <div className='bg-white px-8 py-6 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-3xl font-bold text-gray-900'>test</h2>
        </div>

        <div className='text-sm text-gray-600 mb-6'>
          <span className='font-medium'>Test Suite ID:</span>{' '}
          4f67da18-fd98-460f-aaac-d636390790c41
          <span className='ml-4 text-blue-600'>🔗 CI/CD Integration</span>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-3 gap-8'>
          <div className='flex items-center space-x-3'>
            <Clock className='text-gray-400' size={24} />
            <div>
              <div className='text-sm text-gray-600'>Last Run</div>
              <div className='font-semibold text-gray-900'>Never</div>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <AlertTriangle className='text-orange-500' size={24} />
            <div>
              <div className='text-sm text-gray-600'>Status</div>
              <div className='font-semibold text-orange-600'>Not Run</div>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <CheckCircle className='text-green-500' size={24} />
            <div>
              <div className='text-sm text-gray-600'>Success Rate</div>
              <div className='font-semibold text-gray-900'>0%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='bg-white px-8 border-b border-gray-200'>
        <div className='flex space-x-8'>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Test Cases Content */}
      <div className='flex-1 bg-gray-50 p-8'>
        {/* Test Type Filters */}
        <div className='flex items-center space-x-4 mb-6'>
          <button className='flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm'>
            <span>🔧</span>
            <span>4 Functional</span>
          </button>
          <button className='flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm'>
            <span>⚡</span>
            <span>10 Performance</span>
          </button>
          <button className='flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm'>
            <span>🔒</span>
            <span>0 Security</span>
          </button>
        </div>

        {/* Test Cases */}
        <div className='space-y-4'>
          {testCases.map((testCase, index) => (
            <TestCaseItem key={index} {...testCase} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestSuiteOverView;
