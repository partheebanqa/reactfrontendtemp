import { X } from 'lucide-react';

interface VariableHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VariableHelpDialog({
  open,
  onOpenChange,
}: VariableHelpDialogProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div
        className='absolute inset-0 bg-black bg-opacity-50'
        onClick={() => onOpenChange(false)}
      />

      <div className='relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden'>
        <div className='flex items-center justify-between p-6 border-b'>
          <h2 className='text-xl font-semibold'>🧩 Request Chain Help Guide</h2>
          <button
            onClick={() => onOpenChange(false)}
            className='p-1 hover:bg-gray-100 rounded-full transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto max-h-[calc(90vh-100px)]'>
          <div className='space-y-4 text-sm leading-relaxed text-gray-800'>
            <p>
              <strong>Using Variables in URL, Headers, and Body</strong>
            </p>
            <p>
              Request Chain lets you simulate real-world API workflows by
              passing data between requests. You can use variables to
              dynamically insert values into your request URL, headers, or body
              — making your tests flexible, reusable, and environment-agnostic.
            </p>

            <h3 className='font-semibold text-base mt-4'>
              🔑 Types of Variables
            </h3>
            <table className='w-full border text-sm border-gray-300'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='border p-2 text-left'>Variable Type</th>
                  <th className='border p-2 text-left'>Prefix</th>
                  <th className='border p-2 text-left'>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className='border p-2'>Extracted</td>
                  <td className='border p-2 font-mono'>E_</td>
                  <td className='border p-2'>
                    Pulled from a previous API response (e.g., token, ID)
                  </td>
                </tr>
                <tr>
                  <td className='border p-2'>Static</td>
                  <td className='border p-2 font-mono'>S_</td>
                  <td className='border p-2'>
                    Manually defined constants (e.g., true, admin, 123)
                  </td>
                </tr>
                <tr>
                  <td className='border p-2'>Dynamic</td>
                  <td className='border p-2 font-mono'>D_</td>
                  <td className='border p-2'>
                    Generated at runtime (e.g., random names, emails,
                    timestamps)
                  </td>
                </tr>
              </tbody>
            </table>

            <p className='text-gray-600 text-sm'>
              Note: Static and dynamic variables can be created and managed in
              the Variable Manager.
            </p>

            <h3 className='font-semibold text-base mt-6'>
              🧠 How to Use Variables
            </h3>
            <ul className='list-disc pl-5 space-y-1'>
              <li>
                ✅ Always wrap variables in double curly braces:{' '}
                <code className='bg-gray-100 px-1 rounded'>
                  {'{{VARIABLE_NAME}}'}
                </code>
              </li>
              <li>
                ✅ Strings must be enclosed in quotes:{' '}
                <code className='bg-gray-100 px-1 rounded'>
                  "{'{{D_EMAIL}}'}"
                </code>
              </li>
              <li>
                ✅ Booleans, numbers, or objects must NOT be quoted:{' '}
                <code className='bg-gray-100 px-1 rounded'>
                  {'{{S_ACCEPTEDTRUE}}'}
                </code>
              </li>
            </ul>

            <h3 className='font-semibold text-base mt-6'>
              🌐 Example: Using Variables in a URL
            </h3>
            <pre className='bg-gray-100 text-xs p-3 rounded overflow-x-auto'>
              {`Original URL:
https://apibackenddev.onrender.com/executor/execution-history?page=1&limit=10&workspace_id=01415fe5-b282-4295-a386-267ece622c7b

With Extracted Variable:
https://apibackenddev.onrender.com/executor/execution-history?page=1&limit=10&workspace_id={{E_WORKSPACEID}}`}
            </pre>

            <h3 className='font-semibold text-base mt-6'>
              📦 Example: Using Variables in Request Body
            </h3>
            <pre className='bg-gray-100 text-xs p-3 rounded overflow-x-auto'>
              {`Original Body:
{
  "firstName": "Michael",
  "lastName": "Smith",
  "email": "dly1ewow@yopmail.com",
  "agreedToTerms": true
}

With Variables:
{
  "firstName": "{{D_FIRSTNAME}}" --- string values should be in quotes,
  "lastName": "{{D_LASTNAME}}",
  "email": "{{D_EMAIL}}",
  "agreedToTerms": {{S_ACCEPTEDTRUE}} --- number or boolean should not be in quotes
}`}
            </pre>

            <h3 className='font-semibold text-base mt-6'>
              📌 Where You Can Use Variables
            </h3>
            <table className='w-full border text-sm border-gray-300'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='border p-2 text-left'>Location</th>
                  <th className='border p-2 text-left'>Supported</th>
                  <th className='border p-2 text-left'>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className='border p-2'>URL</td>
                  <td className='border p-2'>✅</td>
                  <td className='border p-2 font-mono text-xs'>
                    .../workspace_id={'{{E_WORKSPACEID}}'}
                  </td>
                </tr>
                <tr>
                  <td className='border p-2'>Headers</td>
                  <td className='border p-2'>✅</td>
                  <td className='border p-2 font-mono text-xs'>
                    Authorization: Bearer {'{{E_TOKEN}}'}
                  </td>
                </tr>
                <tr>
                  <td className='border p-2'>Request Body</td>
                  <td className='border p-2'>✅</td>
                  <td className='border p-2 font-mono text-xs'>
                    "email": "{'{{D_EMAIL}}'}"
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className='font-semibold text-base mt-6'>🧪 Pro Tips</h3>
            <ul className='list-disc pl-5 space-y-1'>
              <li>
                Use <b>Extracted Variables</b> to pass data between requests
                (e.g., login token, user ID).
              </li>
              <li>
                Use <b>Static Variables</b> for flags or constants (e.g., true,
                false, QA_ENV).
              </li>
              <li>
                Use <b>Dynamic Variables</b> to generate fresh data for each run
                (e.g., random emails).
              </li>
            </ul>

            <h3 className='font-semibold text-base mt-6'>🧭 Need Help?</h3>
            <ul className='list-disc pl-5 space-y-1'>
              <li>Hover over any input field to see variable hints.</li>
              <li>
                Use the Variable Preview Panel to see resolved values before
                execution.
              </li>
              <li>Check the Execution Logs to debug variable substitution.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
