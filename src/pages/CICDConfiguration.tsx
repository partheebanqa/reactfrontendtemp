import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import HelpLink from "@/components/HelpModal/HelpLink";
import BreadCum from "@/components/BreadCum/Breadcum";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  createWorkSpaceToken,
  getWorkSpaceToken,
} from "@/services/cicdconfiguration.service";
import { toast } from "@/hooks/use-toast";

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
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const [exampleCode, setExampleCode] =
    useState(`curl -X POST https://api-tester.example.com/api/execute-schedule \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"scheduleId": 1, "environmentId": 1}'`);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Token copied successfully!",
      duration: 3000,
      type: "success",
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exampleCode);
  };

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const workspaceName = currentWorkspace?.name;

  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // console.log(workspaceId, "workspaceid");

  const getToken = async () => {
    try {
      const response = await getWorkSpaceToken(workspaceId || "");
      setApiKey(response.Key);
      setTokenData(response);
    } catch (err) {
      console.log(err, "err");
    }
  };

  const generateToken = async () => {
    setIsLoading(true);
    try {
      const response = await createWorkSpaceToken(workspaceId || "");
      const newKey = response.keyinfo?.Key;
      setApiKey(newKey);
      setTokenData(response.keyinfo);

      toast({
        title: "Token generated successfully!",
        duration: 3000,
        type: "success",
      });

      // No need to call getToken()
    } catch (err) {
      console.log(err, "err");
      toast({
        title: "Failed to generate token.",
        duration: 3000,
        type: "error",
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
        title="CI/CD Integration"
        subtitle="Connect with your CI/CD pipeline for automated testing"
        showCreateButton={false}
        buttonTitle="Run Execution"
        onClickCreateNew={() => console.log("Create execution")}
        icon={Workflow}
        iconBgClass="bg-orange-100"
        iconColor="#f97316"
        iconSize={40}
      />
      <div className="flex-1 overflow-y-auto mt-3">
        {/* API Key Required Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Key className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                API Key Required
              </h3>
              <p className="text-blue-800">
                Generate an API key to use for CI/CD integrations
              </p>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-3">
          <div className="flex items-center space-x-3 mb-6">
            <Key className="w-6 h-6 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">
              API Configuration - {workspaceName}
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  API Key
                  <span className="ml-2 text-xs text-gray-500">
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

              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm pr-24"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
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
                  onClick={generateToken}
                  className="bg-[#136fb0] hover:bg-[#136fb0] text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>{isLoading ? "Generating..." : "Regenerate"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Valid until:{" "}
                    {tokenData?.ExpiresAt
                      ? new Date(tokenData.ExpiresAt).toLocaleString()
                      : "N/A"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {!tokenData?.IsActive
                      ? "This key has expired and needs to be regenerated"
                      : "Your API key is currently active"}
                  </div>
                </div>
              </div>

              {!tokenData?.IsActive ? (
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
        </div>

        {/* Example Usage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Code className="w-6 h-6 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">
                Example Usage
              </h3>
            </div>
            <button
              onClick={handleCopyCode}
              className="text-[#136fb0] hover:text-blue-700 font-medium text-sm transition-colors flex items-center space-x-2"
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
            <h4 className="font-medium text-blue-900 mb-2">
              Integration Steps:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Copy the API key from above</li>
              <li>Replace YOUR_API_KEY in your CI/CD pipeline configuration</li>
              <li>Use the API endpoint in your automated test scripts</li>
              <li>Monitor test results in your pipeline dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
