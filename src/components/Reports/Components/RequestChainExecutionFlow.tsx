import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

interface ExtractedVariable {
  key: string;
  value: string | number;
}

interface RequestStep {
  step: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  name: string;
  url: string;
  statusCode: number;
  responseSize: string;
  duration: string;
  extractedVars: ExtractedVariable[];
  status: 'success' | 'fail';
  errorMessage?: string;
}

interface Props {
  steps: RequestStep[];
}

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800',
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

export default function RequestChainExecutionFlow({ steps }: Props) {
  const [openStep, setOpenStep] = useState<number | null>(1);

  const toggleStep = (step: number) => {
    setOpenStep(openStep === step ? null : step);
  };

  return (
    <div className='mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden'>
      <h2 className='px-6 py-4 text-lg font-semibold text-gray-900 border-b'>
        Request Chain Execution Flow
      </h2>

      {steps.map((step) => {
        const isOpen = openStep === step.step;
        const StatusIcon = step.status === 'success' ? CheckCircle : XCircle;

        return (
          <div key={step.step} className='rounded bg-[#FAFAFA] p-1 m-3'>
            {/* Step Header */}
            <button
              onClick={() => toggleStep(step.step)}
              className='w-full flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition'
            >
              <div className='flex items-center space-x-4'>
                <div
                  className={`w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center ${
                    step.status === 'success' ? 'bg-green-600' : 'bg-red-500'
                  }`}
                >
                  {step.step}
                </div>
                <StatusIcon
                  className={`w-5 h-5 ${
                    step.status === 'success'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                />
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    methodColors[step.method]
                  }`}
                >
                  {step.method}
                </span>
                <span className='text-gray-800 font-medium'>{step.name}</span>
              </div>

              <div className='flex items-center space-x-2 text-sm text-gray-500'>
                <span>{step.duration}</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {/* Expanded Details */}
            {isOpen && (
              <div className='bg-gray-50 px-6 pb-5 pt-1 text-sm text-gray-800'>
                <div className='flex flex-col md:flex-row gap-6'>
                  {/* Request Details */}
                  <div className='flex-1'>
                    <h4 className='font-semibold mb-2'>Request Details</h4>
                    <p>
                      <strong className='text-gray-700'>URL:</strong> {step.url}
                    </p>
                    <p>
                      <strong className='text-gray-700'>Status Code:</strong>{' '}
                      {step.statusCode}
                    </p>
                    <p>
                      <strong className='text-gray-700'>Response Size:</strong>{' '}
                      {step.responseSize}
                    </p>
                  </div>

                  {/* Extracted Variables */}
                  <div className='flex-1'>
                    <h4 className='font-semibold mb-2'>Extracted Variables</h4>
                    {step.extractedVars.map((v, i) => (
                      <div
                        key={i}
                        className='flex justify-between bg-green-50 rounded px-3 py-1 mb-1 text-sm'
                      >
                        <span className='font-medium text-gray-700'>
                          {v.key}
                        </span>
                        <span>{v.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Error Message */}
                {step.status === 'fail' && step.errorMessage && (
                  <div className='mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded'>
                    {step.errorMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
