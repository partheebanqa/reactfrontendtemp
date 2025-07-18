import React, { useState } from 'react';
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Code, 
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';

export default function CICDConfiguration() {
  const [apiKey, setApiKey] = useState('api_test_12345abcdef67890ghijklmn');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isKeyExpired, setIsKeyExpired] = useState(true);
  const [exampleCode, setExampleCode] = useState(`curl -X POST https://api-tester.example.com/api/execute-schedule \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"scheduleId": 1, "environmentId": 1}'`);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exampleCode);
  };

  const handleRegenerateKey = () => {
    const newKey = 'api_test_' + Math.random().toString(36).substring(2, 20);
    setApiKey(newKey);
    setIsKeyExpired(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">CI/CD Integration</h2>
        <p className="text-gray-600 mt-2">Connect with your CI/CD pipeline for automated testing</p>
      </div>

      {/* API Key Required Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex items-start space-x-3">
          <Key className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">API Key Required</h3>
            <p className="text-blue-800">Generate an API key to use for CI/CD integrations</p>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="w-6 h-6 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                API Key
                <span className="ml-2 text-xs text-gray-500">
                  Use this key to authenticate API requests from your CI/CD pipeline
                </span>
              </label>
              <div className="flex items-center space-x-2">
                {isKeyExpired ? (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>Expired</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Active</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm pr-24"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCopyApiKey}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={handleRegenerateKey}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Valid until: 3/15/2025</div>
                <div className="text-xs text-gray-600">
                  {isKeyExpired ? 'This key has expired and needs to be regenerated' : 'Your API key is currently active'}
                </div>
              </div>
            </div>
            {isKeyExpired && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Expired
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Example Usage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Code className="w-6 h-6 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Example Usage</h3>
          </div>
          <button
            onClick={handleCopyCode}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors flex items-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm font-mono">
            <code>{exampleCode}</code>
          </pre>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Integration Steps:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Copy the API key from above</li>
            <li>Replace YOUR_API_KEY in your CI/CD pipeline configuration</li>
            <li>Use the API endpoint in your automated test scripts</li>
            <li>Monitor test results in your pipeline dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}