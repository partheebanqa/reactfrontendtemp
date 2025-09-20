import React, { useState } from "react";
import RequestBuilder from "@/components/RequestBuilder";
import { ChartColumn, Settings } from "lucide-react";
import BreadCum from "@/components/BreadCum/Breadcum";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface TestAssertion {
  field: string;
  operator: string;
  expected: string;
}

const RequestBuilderPage: React.FC = () => {
  return (
    <>
      <BreadCum
        title="Request Builder"
        subtitle="Get execution results of test suite and request chain"
        showCreateButton={false}
        buttonTitle="Run Execution"
        onClickCreateNew={() => console.log("Create execution")}
        icon={Settings}
        iconBgClass="bg-blue-100"
        iconColor="#136fb0"
        iconSize={40}
        quickGuideTitle="🚀 Guided Onboarding: Request Builder"
        quickGuideContent={
          <div>
            <p className="mb-4 text-base font-medium mt-4">Here’s how to get started:</p>
            <ul className="list-none pl-5 space-y-2 text-sm">
              <li>
                🟩 <b className='text-[#000000]'>Step 1: Workspace Selection</b> – Location: Top-left workspace
                dropdown. Start by selecting your workspace. This is where your APIs,
                environments, and test assets live. If you don’t see expected data,
                double-check your selection.
              </li>
              <li>
                🟨 <b className='text-[#000000]'>Step 2: Choose an Environment</b> – Location: Top-right
                environment selector. Choose the environment you want to test
                against—Dev, QA, UAT, or Production. This sets the base URL for your
                requests.
              </li>
              <li>
                🟦 <b className='text-[#000000]'>Step 3: Open or Create a Request</b> – Location: Request
                dropdown or collection panel. Open an existing request or create a new
                one. Organize requests into collections for faster access and better
                structure.
              </li>
              <li>
                🟪 <b className='text-[#000000]'>Step 4: Configure Your Request</b> – Location: Request
                configuration tabs:
                <ul className="list-disc pl-5 space-y-1">
                  <li>Params: Add query parameters</li>
                  <li>Headers: Set custom headers</li>
                  <li>Body: Define payloads (JSON, form-data)</li>
                  <li>Authorization: Add tokens or credentials</li>
                  <li>Assertions: Add assertions to API Response</li>
                  <li>Settings: Customize timeout and redirects</li>
                  <li>Schemas: Add schema and compare against response</li>
                </ul>
                Each tab helps you shape the request precisely.
              </li>
              <li>
                🟧 <b className='text-[#000000]'>Step 5: Execute & Inspect Response</b> – Location: Send button
                and response panel. Click <i>Send Request</i> to execute. Review
                status code, headers, response body, time taken, payload size,
                assertion results, and schema comparison results—all in real-time.
              </li>
              <li>
                🟥 <b className='text-[#000000]'>Step 6: Add Assertions</b> – Location: Assertions tab. After a
                successful response, assertions are auto-generated. Select the ones
                you want to validate every time the API runs.
              </li>
              <li>
                🟫 <b className='text-[#000000]'>Step 7: Attach a Schema</b> – Location: Schemas tab. Upload a
                Swagger/OpenAPI spec to validate your response structure. Use the
                Swagger Parser under Utilities to generate individual specs.
              </li>
              <li>
                🟨 <b className='text-[#000000]'>Step 8: Reuse & Iterate</b> – Location: Collections and history
                panel. Save requests, switch environments. Iterate quickly and scale
                your testing with confidence.
              </li>
              <li>
                ✅ <b className='text-[#000000]'>Final Step: You’re Ready!</b> – You’ve completed the Request
                Builder walkthrough. You’re now equipped to build smarter, faster, and
                more reliable API workflows.
              </li>
            </ul>
          </div>
        }
      />


      <RequestBuilder />

    </>
  );
};

export default RequestBuilderPage;
