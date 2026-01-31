import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';




type TestCase = {
  id?: string;
  testSuiteId?: string;
  requestId?: string;
  name: string;
  description: string;
  testcase_id: string;
  validation_type: string;
  severity: string;
  category: string;
  order: number;
  method: string;
  url: string;
  bodyType: string;
  bodyFormData: any;
  bodyRawContent: string;
  authorizationType: string;
  authorization: any;
  headers: any;
  params: any[];
  expectedResponse: any;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  tags: string[];
  subCategory: string;
};

interface EditTestCaseModalProps {
  testCase: TestCase;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, name: string, expectedResponseCode: number) => Promise<void>;
}

export default function EditTestCaseModal({
  testCase,
  isOpen,
  onClose,
  onSave,
}: EditTestCaseModalProps) {
  const [name, setName] = useState(testCase.name);
  const [expectedResponseCode, setExpectedResponseCode] = useState(testCase.expectedResponse?.status);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(testCase.name);
    setExpectedResponseCode(testCase.expectedResponse?.status);
  }, [testCase]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(testCase?.id || "", name, expectedResponseCode);
      onClose();
    } catch (error) {
      console.error('Error saving test case:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const commonStatusCodes = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Test Case</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label
              htmlFor="testcase-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Test Case Name
            </label>
            <Input
              id="testcase-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              // className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter test case name"
            />
          </div>

          <div>
            <label
              htmlFor="response-code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Expected Response Code
            </label>
            <div className="flex gap-2">
              <Input
                id="response-code"
                type="number"
                value={expectedResponseCode}
                onChange={(e) => setExpectedResponseCode(parseInt(e.target.value) || 200)}
                className="w-32"
                min="100"
                max="599"
              />
              <div className="flex flex-wrap gap-1">
                {commonStatusCodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => setExpectedResponseCode(code)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${expectedResponseCode === code
                      ? 'bg-[#136fb0] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select a common code or enter a custom value
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}

          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
