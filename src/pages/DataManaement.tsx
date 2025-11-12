import BreadCum from '@/components/BreadCum/Breadcum';
import DataManagement from '@/components/DataManement/DataManagement';
import { Database } from 'lucide-react';

const DataManagementPage = () => {
  return (
    <>
      <BreadCum
        title='Data Management'
        subtitle='Create multi-environment setups, static and dynamic variables for realistic test data scenarios'
        showCreateButton={false}
        buttonTitle='Run Execution'
        onClickCreateNew={() => console.log('Create execution')}
        icon={Database}
        iconBgClass='bg-orange-100'
        iconColor='#f97316'
        iconSize={40}
        quickGuideTitle='🚀 Guided Onboarding: Data Management'
        quickGuideContent={
          <div>
            <p className='mb-4 text-base font-medium mt-4'>
              Optraflow lets you manage environments, static variables, and
              dynamic variables to streamline API testing across workspaces.
            </p>

            <ul className='list-none pl-5 space-y-4 text-sm leading-relaxed'>
              <li>
                🟩 <b className='text-[#000000]'>Step 1: Manage Environments</b>{' '}
                – <span className='italic'>Location:</span> Manage Environment
                button.
                <span className='block mt-1'>
                  Clicking the <b>Manage Environment</b> button redirects you to
                  the Environment Management screen under the Profile section.
                  Here, you can view and configure <b>global environments</b>.
                </span>
              </li>

              <li>
                🟨{' '}
                <b className='text-[#000000]'>
                  Step 2: Manage Workspace-Specific Environments
                </b>{' '}
                – <span className='italic'>Location:</span> Add Environment
                button.
                <span className='block mt-1'>
                  On this screen, you can manage all environments associated
                  with a specific workspace. Click <b>Add Environment</b> to
                  create a new one and set its base URL.
                </span>
                <span className='block mt-1'>
                  In Optraflow, switching environments automatically updates the
                  base URL for your requests—allowing you to execute the same
                  request across different environments seamlessly.
                </span>
                <i className='block mt-2 text-gray-600'>
                  Note: Admins can add environments for all available
                  workspaces.
                </i>
              </li>

              <li>
                🟦{' '}
                <b className='text-[#000000]'>
                  Step 3: Add an Environment for a Workspace
                </b>
                <span className='block mt-1'>
                  Organization admins can manage environments across all
                  workspaces.
                </span>
                <span className='block mt-2'>
                  <b>To add an environment:</b>
                  <ul className='list-disc pl-6 mt-2 space-y-1'>
                    <li>
                      Click <b>Add Environment</b>
                    </li>
                    <li>Enter the environment name</li>
                    <li>Select the workspace</li>
                    <li>Provide the base URL</li>
                    <li>(Optional) Add a description</li>
                    <li>
                      Click <b>Save</b>
                    </li>
                  </ul>
                </span>
                <span className='block mt-2 text-gray-600'>
                  💡 <i>Tip:</i> If your created environments aren’t visible,
                  use the <b>Workspace Switcher</b> at the top-left (next to the
                  Optraflow logo) to select the correct workspace.
                </span>
              </li>

              <li>
                🟪{' '}
                <b className='text-[#000000]'>
                  Step 4: Manage Static Variables
                </b>{' '}
                – <span className='italic'>Location:</span> Variables button.
                <span className='block mt-1'>
                  Click on <b>Add Variable</b> to create a static variable:
                </span>
                <ul className='list-disc pl-6 mt-2 space-y-1'>
                  <li>Enter the variable name and value</li>
                  <li>(Optional) Add a description</li>
                  <li>
                    Click <b>Save</b>
                  </li>
                </ul>
                <i className='block mt-2 text-gray-600'>
                  Note: Static variables are prefixed with <b>S_</b>. Use them
                  in request chains and builders as <code>S_variableName</code>.
                </i>
              </li>

              <li>
                🟧{' '}
                <b className='text-[#000000]'>
                  Step 5: Manage Dynamic Variables
                </b>
                <span className='block mt-1'>
                  Click <b>Add Variable</b> to create a dynamic variable:
                </span>
                <ul className='list-disc pl-6 mt-2 space-y-1'>
                  <li>Enter the variable name</li>
                  <li>
                    Choose a function (e.g., random email, first name, address)
                  </li>
                  <li>(Optional) Add a description</li>
                  <li>
                    Click <b>Save</b>
                  </li>
                </ul>
                <i className='block mt-2 text-gray-600'>
                  Note: Dynamic variables are prefixed with <b>D_</b>. Use them
                  in request chains and builders as <code>D_variableName</code>.
                </i>
              </li>

              <li>
                ✅{' '}
                <b className='text-[#000000]'>
                  Final Step: Using Variables in Requests
                </b>
                <span className='block mt-1'>
                  You can reference variables in both <b>Request Chains</b> and{' '}
                  <b>Request Builders</b>:
                </span>
                <ul className='list-disc pl-6 mt-2 space-y-1'>
                  <li>
                    Use <code>S_variableName</code> for static variables
                  </li>
                  <li>
                    Use <code>D_variableName</code> for dynamic variables
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        }
      />

      <DataManagement />
    </>
  );
};
export default DataManagementPage;
