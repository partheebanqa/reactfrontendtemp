import React, { useEffect, useState } from 'react';
import {
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Code,
  AlertCircle,
  CheckCircle,
  Calendar,
  Workflow,
  Check,
  Link2,
  CheckCheck,
  Layers,
} from 'lucide-react';
import HelpLink from '@/components/HelpModal/HelpLink';
import BreadCum from '@/components/BreadCum/Breadcum';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  createWorkSpaceToken,
  getWorkSpaceToken,
} from '@/services/cicdconfiguration.service';
import { toast } from '@/hooks/use-toast';

interface TokenResponse {
  ID: string;
  WorkspaceID: string;
  Key: string;
  IsActive: boolean;
  ExpiresAt: string;
  LastUsedAt: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export default function CICDConfiguration() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [exampleCode, setExampleCode] =
    useState(`curl -X POST "https://apibackenddev.onrender.com/test-suites/execute" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID" \\
  -d '{
    "testSuiteId": "TEST_SUITE_ID"
  }'`);

  const [requestChainCode, setRequestChainCode] =
    useState(`curl -X POST "https://apibackenddev.onrender.com/request-chains/execute" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID" \\
  -d '{
    "requestChainId": "REQUEST_CHAIN_ID"
  }`);

  const [requestChainGet, setRequestChainGet] =
    useState(`curl -X GET "https://apibackenddev.onrender.com/cicd/request-chains/REQUEST_CHAIN_ID/executionstatus" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID" \\
  -d '{}'`);

  const [testSuitGet, settestSuitGet] =
    useState(`curl -X GET "https://apibackenddev.onrender.com/cicd/test-suites/TEST_SUITE_ID/executionstatus" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID" \\
  -d '{}'`);

  const [sampleResonpse, setSampleResponse] = useState(`{
    "name": "PostMethodTesting",
    "executionId": "0457e632-4c8e-43a9-95fd-939d2895b964",
    "dateTime": "2025-09-19T08:56:14.463754Z",
    "environmentName": "",
    "status": "completed"
}
`);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: 'Token copied successfully!',
      duration: 3000,
      // type: "success",
    });
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workspaceId || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Workspace ID copied successfully!',
        duration: 3000,
        // type: "success",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exampleCode);
    toast({
      title: 'Curl copied successfully!',
      duration: 3000,
      // type: "success",
    });
  };

  const handleCopyRequest = () => {
    navigator.clipboard.writeText(requestChainCode);
    toast({
      title: 'Curl copied successfully!',
      duration: 3000,
      // type: "success",
    });
  };

  const handleCopyRequestGet = () => {
    navigator.clipboard.writeText(requestChainGet);
    toast({
      title: 'Curl copied successfully!',
      duration: 3000,
      // type: "success",
    });
  };

  const handleCopyTestSuitGet = () => {
    navigator.clipboard.writeText(testSuitGet);
    toast({
      title: 'Curl copied successfully!',
      duration: 3000,
      // type: "success",
    });
  };

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const workspaceName = currentWorkspace?.name;

  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // console.log(workspaceId, "workspaceid");

  const getToken = async () => {
    try {
      const response = await getWorkSpaceToken(workspaceId || '');
      setApiKey(response.Key);
      setTokenData(response);
    } catch (err) {
      console.log(err, 'err');
    }
  };

  const generateToken = async () => {
    setIsLoading(true);
    try {
      const response = await createWorkSpaceToken(workspaceId || '');
      const newKey = response.keyinfo?.Key;
      setApiKey(newKey);
      setTokenData(response.keyinfo);

      toast({
        title: 'Token generated successfully!',
        duration: 3000,
        // type: "success",
      });

      // No need to call getToken()
    } catch (err) {
      console.log(err, 'err');
      toast({
        title: 'Failed to generate token.',
        duration: 3000,
        // type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      getToken();
    }
  }, [workspaceId]);

  return (
    <>
      <BreadCum
        title='CI/CD Integration'
        subtitle='Connect with your CI/CD pipeline for automated testing'
        showCreateButton={false}
        buttonTitle='Run Execution'
        onClickCreateNew={() => console.log('Create execution')}
        icon={Workflow}
        iconBgClass='bg-orange-100'
        iconColor='#f97316'
        iconSize={40}
        quickGuideTitle='🚀 Guided Onboarding: Integrating with CI/CD'
        quickGuideContent={
          <div>
            <p className='mb-4 text-base font-medium mt-4'>
              Here’s how to integrate with your CI/CD pipeline:
            </p>
            <ul className='list-none pl-5 space-y-4 text-sm leading-relaxed'>
              <li>
                🟩{' '}
                <b className='text-[#000000]'>
                  Step 1: Validate Your Workspace API Key
                </b>{' '}
                – Location: “Regenerate” button.
                <span className='block mt-1'>
                  Ensure your API key is active. If expired, click{' '}
                  <b>Regenerate</b> to generate a new one. This key is required
                  to authenticate CI/CD requests.
                </span>
              </li>

              <li>
                🟨{' '}
                <b className='text-[#000000]'>
                  Step 2: Retrieve Your Workspace ID
                </b>{' '}
                – Location: next to the workspace name.
                <span className='block mt-1'>
                  Locate the <b>Workspace ID</b>. You’ll need this for request
                  configuration.
                </span>
              </li>

              <li>
                🟦{' '}
                <b className='text-[#000000]'>
                  Step 3: Select the Target ID (Test Suite / Request Chain)
                </b>{' '}
                – Location: list view.
                <span className='block mt-1'>
                  From the respective list view, copy the <b>Test Suite ID</b>{' '}
                  or <b>Request Chain ID</b> that you want to configure for
                  CI/CD execution.
                </span>
              </li>

              <li>
                🟪{' '}
                <b className='text-[#000000]'>Step 4: Configure Your Request</b>{' '}
                – Update your request with the following values:
                <ul className='list-disc pl-6 mt-2 space-y-1'>
                  <li>
                    Replace <code>YOUR_API_KEY</code> in the request header
                  </li>
                  <li>
                    Replace <code>YOUR_WORKSPACE_ID</code> in the request header
                  </li>
                  <li>
                    Replace <code>TEST_SUITE_ID</code> or{' '}
                    <code>REQUEST_CHAIN_ID</code> in the request body
                  </li>
                </ul>
                <span className='block mt-2'>
                  Use the updated API endpoint in your automated test scripts.
                </span>
              </li>

              <li>
                🟧{' '}
                <b className='text-[#000000]'>
                  Step 5: Trigger CI/CD Execution
                </b>{' '}
                – Initiate the request via your pipeline, <b>cURL</b>, or{' '}
                <b>Postman</b>.
              </li>

              <li>
                ✅{' '}
                <b className='text-[#000000]'>
                  Final Step: Review Execution Results
                </b>{' '}
                – Location: Executions page.
                <span className='block mt-1'>
                  Navigate to the <b>Executions</b> page to view:
                </span>
                <ul className='list-disc pl-6 mt-2 space-y-1'>
                  <li>Detailed logs</li>
                  <li>Status codes</li>
                  <li>Assertion results</li>
                  <li>Schema validations per test case</li>
                </ul>
                <i className='block mt-2 text-gray-600'>
                  You’ll soon be able to check execution status via API (coming
                  soon).
                </i>
              </li>
            </ul>
          </div>
        }
      />

      <div className='flex-1 overflow-y-auto scrollbar-thin mt-3'>
        {/* API Key Required Notice */}
        <div className='bg-blue-50 border border-blue-200 rounded-xl p-6'>
          <div className='flex items-start space-x-3'>
            <Key className='w-6 h-6 text-blue-600 mt-0.5' />
            <div>
              <h3 className='font-semibold text-blue-900 mb-2'>
                API Key Required
              </h3>
              <p className='text-blue-800'>
                Generate an API key to use for CI/CD integrations
              </p>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-3'>
          <div className='flex items-center space-x-3 mb-6'>
            <Key className='w-6 h-6 text-gray-700' />
            <h3 className='flex items-center text-lg font-semibold text-gray-900'>
              API Configuration - {workspaceName}
              <span className='flex items-center ml-2'>
                ({workspaceId})
                {copied ? (
                  <Check className='w-4 h-4 ml-1 text-green-600' />
                ) : (
                  <Copy
                    onClick={handleCopy}
                    className='w-4 h-4 ml-1 cursor-pointer text-gray-600 hover:text-gray-900'
                  />
                )}
              </span>
            </h3>
          </div>

          <div className='space-y-6'>
            <div>
              <div className='flex items-center justify-between mb-3'>
                <label className='block text-sm font-medium text-gray-700'>
                  API Key
                  <span className='ml-2 text-xs text-gray-500'>
                    Use this key to authenticate API requests from your CI/CD
                    pipeline
                  </span>
                </label>
                {/* <div className="flex items-center space-x-2">
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
                </div> */}
              </div>

              <div className='flex items-center space-x-3'>
                <div className='flex-1 relative'>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    readOnly
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm pr-24'
                  />
                  <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1'>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className='text-gray-500 hover:text-gray-700 p-1'
                    >
                      {showApiKey ? (
                        <EyeOff className='w-4 h-4' />
                      ) : (
                        <Eye className='w-4 h-4' />
                      )}
                    </button>
                    <button
                      onClick={handleCopyApiKey}
                      className='text-gray-500 hover:text-gray-700 p-1'
                    >
                      <Copy className='w-4 h-4' />
                    </button>
                  </div>
                </div>
                <button
                  onClick={generateToken}
                  className='bg-[#136fb0] hover:bg-[#136fb0] text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg
                      className='animate-spin w-4 h-4'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8v8H4z'
                      ></path>
                    </svg>
                  ) : (
                    <RefreshCw className='w-4 h-4' />
                  )}
                  <span>{isLoading ? 'Generating...' : 'Regenerate'}</span>
                </button>
              </div>
            </div>

            <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <Calendar className='w-5 h-5 text-gray-500' />
                <div>
                  <div className='text-sm font-medium text-gray-900'>
                    Valid until:{' '}
                    {tokenData?.ExpiresAt
                      ? new Date(tokenData.ExpiresAt).toLocaleString()
                      : 'N/A'}
                  </div>
                  <div className='text-xs text-gray-600'>
                    {!tokenData?.IsActive
                      ? 'This key has expired and needs to be regenerated'
                      : 'Your API key is currently active'}
                  </div>
                </div>
              </div>

              {!tokenData?.IsActive ? (
                <div className='flex items-center text-red-600 text-sm'>
                  <AlertCircle className='w-4 h-4 mr-1' />
                  <span>Expired</span>
                </div>
              ) : (
                <div className='flex items-center text-green-600 text-sm'>
                  <CheckCircle className='w-4 h-4 mr-1' />
                  <span>Active</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Example Usage */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-3'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center space-x-3'>
              <Layers className='w-6 h-6 text-gray-700' />
              <h3 className='text-lg font-semibold text-gray-900'>Test Suit</h3>
            </div>
            <button
              onClick={handleCopyCode}
              className='text-[#136fb0] hover:text-blue-700 font-medium text-sm transition-colors flex items-center space-x-2'
            >
              <Copy className='w-4 h-4' />
              <span>Copy</span>
            </button>
          </div>

          <div className='bg-gray-900 rounded-lg p-4 overflow-x-auto scrollbar-thin'>
            <pre className='text-green-400 text-sm font-mono'>
              <code>{exampleCode}</code>
            </pre>
          </div>

          <div className='flex items-center justify-between mb-3 mt-3'>
            <div className='flex items-center space-x-3'>
              <Link2 className='w-6 h-6 text-gray-700' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Request Chain
              </h3>
            </div>
            <button
              onClick={handleCopyRequest}
              className='text-[#136fb0] hover:text-blue-700 font-medium text-sm transition-colors flex items-center space-x-2'
            >
              <Copy className='w-4 h-4' />
              <span>Copy</span>
            </button>
          </div>

          <div className='bg-gray-900 rounded-lg p-4 overflow-x-auto scrollbar-thin'>
            <pre className='text-green-400 text-sm font-mono'>
              <code>{requestChainCode}</code>
            </pre>
          </div>

          <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
            <h4 className='font-medium text-blue-900 mb-2'>
              Integration Steps:
            </h4>
            <ol className='list-decimal list-inside space-y-1 text-sm text-blue-800'>
              <li>Copy the API key from above.</li>
              <li>
                Verify the Key validity, if expired, click on{' '}
                <strong>"Regenerate"</strong> button to generate new Key.
              </li>
              <li>
                Replace <code>YOUR_API_KEY</code> in request header
                configuration.
              </li>
              <li>Copy the workspace Id from the above.</li>
              <li>
                Replace <code>YOUR_WORKSPACE_ID</code> in request header
                configuration.
              </li>
              <li>
                Copy the Test suite id / Request chain id from respective list
                view.
              </li>
              <li>
                Replace{' '}
                <code>
                  <a
                    href='https://apiautomationnew.onrender.com/test-suites'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline'
                  >
                    TEST_SUITE_ID
                  </a>
                </code>{' '}
                /{' '}
                <code>
                  <a
                    href='https://apiautomationnew.onrender.com/request-chains'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline'
                  >
                    REQUEST_CHAIN_ID{' '}
                  </a>
                </code>
                in request body configuration.
              </li>
              <li>Use the API endpoint in your automated test scripts.</li>
              <li>
                Monitor test results in
                <a
                  href='https://apiautomationnew.onrender.com/executions'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline'
                >
                  {' '}
                  Executions dashboard
                </a>
                .
              </li>
              <li>
                You can hit the below APIs to get the latest CICD execution
                status.
              </li>
            </ol>
          </div>

          <div className='flex items-center justify-between mb-3 mt-3'>
            <div className='flex items-center space-x-3'>
              <Layers className='w-6 h-6 text-gray-700' />
              <h3 className='text-lg font-semibold text-gray-900'>Test Suit</h3>
            </div>
            <button
              onClick={handleCopyTestSuitGet}
              className='text-[#136fb0] hover:text-blue-700 font-medium text-sm transition-colors flex items-center space-x-2'
            >
              <Copy className='w-4 h-4' />
              <span>Copy</span>
            </button>
          </div>

          <div className='bg-gray-900 rounded-lg p-4 overflow-x-auto scrollbar-thin'>
            <pre className='text-green-400 text-sm font-mono'>
              <code>{testSuitGet}</code>
            </pre>
          </div>

          <div className='flex items-center justify-between mb-3 mt-3'>
            <div className='flex items-center space-x-3'>
              <Link2 className='w-6 h-6 text-gray-700' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Request Chain
              </h3>
            </div>
            <button
              onClick={handleCopyRequestGet}
              className='text-[#136fb0] hover:text-blue-700 font-medium text-sm transition-colors flex items-center space-x-2'
            >
              <Copy className='w-4 h-4' />
              <span>Copy</span>
            </button>
          </div>

          <div className='bg-gray-900 rounded-lg p-4 overflow-x-auto scrollbar-thin'>
            <pre className='text-green-400 text-sm font-mono'>
              <code>{requestChainGet}</code>
            </pre>
          </div>

          <div className='flex items-center justify-between mb-3 mt-3'>
            <div className='flex items-center space-x-3'>
              <Check className='w-6 h-6 text-gray-700' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Sample Response
              </h3>
            </div>
            {/* <button
             
              className="text-[#136fb0] hover:text-blue-700 font-medium text-sm transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button> */}
          </div>

          <div className='bg-gray-900 rounded-lg p-4 overflow-x-auto scrollbar-thin'>
            <pre className='text-green-400 text-sm font-mono'>
              <code>{sampleResonpse}</code>
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
