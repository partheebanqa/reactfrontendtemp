import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import ReactJson from "react-json-view";

interface TestItem {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  duration: string;
  statusCode: number;
  status: "success" | "fail" | "warning";
  response?: string;
  requestCurl:string;
}

interface TestCategory {
  name: string;
  icon: JSX.Element;
  testCount: number;
  tests: TestItem[];
}

const methodColors = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

const statusIcons = {
  success: <CheckCircle className="text-green-600 w-4 h-4" />,
  fail: <AlertCircle className="text-red-600 w-4 h-4" />,
  warning: <AlertCircle className="text-yellow-500 w-4 h-4" />,
};

const DetailedTestResults = ({
  categories,
}: {
  categories: TestCategory[];
}) => {
  const [openSections, setOpenSections] = useState<string[]>([]);
const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("request");

  const toggleCategory = (name: string) => {
    setOpenSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleTestDetails = (testId: string) => {
  setExpandedTestId(prevId => (prevId === testId ? null : testId));
};

console.log(categories, "catagories")

  return (
    <div className="rounded-lg border border-gray-200 space-y-3 mt-8 p-5 bg-white">
      <h2 className="text-1xl font-bold text-foreground mb-1">
        Detailed Test Results
      </h2>

      {categories.map((cat) => {
        const isOpen = openSections.includes(cat.name);
        return (
          <div key={cat.name} className="border border-[#E0E0E0] rounded-lg">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(cat.name)}
              className={`w-full px-5 py-4 flex items-center justify-between text-left text-sm font-medium rounded-lg ${
                isOpen ? "bg-gray-50" : "bg-white"
              } hover:bg-gray-100 transition`}
            >
              <div className="flex items-center gap-2 text-base text-black font-semibold">
                {cat.icon}
                <span>{cat.name}</span>
                <span className="text-sm text-muted-foreground font-normal ml-1">
                  ({cat.testCount} tests)
                </span>
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Test Items */}
            {isOpen && (
              <div className="divide-y border-t border-[#E0E0E0]">
                {cat.tests.map((test) => (
                  <div key={test.id} className="bg-white">
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{statusIcons[test.status]}</div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {test.name}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-full font-medium ${
                                methodColors[test.method]
                              }`}
                            >
                              {test.method}
                            </span>
                            <span>{test.endpoint}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-sm">
                        <p className="font-semibold text-gray-900">
                          {test.duration}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Status: {test.statusCode}
                        </p>

                        <button
  onClick={() => toggleTestDetails(test.id)}
  className="flex items-center text-xs text-blue-500 space-x-1 mt-1"
>
  {expandedTestId === test.id ? (
    <>
      <ChevronUp size={20} color="#136fb0" />
      <span style={{ color: "#136fb0" }}>Hide Details</span>
    </>
  ) : (
    <>
      <ChevronDown size={20} color="#136fb0" />
      <span style={{ color: "#136fb0" }}>Show Details</span>
    </>
  )}
</button>

                      </div>
                    </div>

                    {/* Tabs and Detailed Data */}
                    {expandedTestId === test.id && (
                      <div className="space-y-4 mt-4 p-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                          <TabsList className="grid w-full grid-cols-4 mt-4">
                            <TabsTrigger value="request">Request</TabsTrigger>
                            <TabsTrigger value="response">Response</TabsTrigger>
                            <TabsTrigger value="assertions">
                              Assertions
                            </TabsTrigger>
                            <TabsTrigger value="result">
                              Assertions Results
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="request">
                            <div className="mt-4 p-3 bg-gray-900 rounded max-h-96 overflow-auto text-xs text-white">
                              <ReactJson
                               src={{ requestCurl: test.requestCurl }}
                                collapsed={1}
                                enableClipboard={false}
                                displayDataTypes={false}
                                name={false}
                                theme="monokai"
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="response">
                            <div className="mt-4 p-3 bg-gray-900 rounded max-h-96 overflow-auto text-xs text-white">
                              <ReactJson
                                  src={{ response: test.response }}
                                collapsed={1}
                                enableClipboard={false}
                                displayDataTypes={false}
                                name={false}
                                theme="monokai"
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="assertions">
                            <div className="mt-4 p-3 bg-gray-900 rounded max-h-96 overflow-auto text-xs text-white">
                              <ReactJson
                                src={test}
                                collapsed={1}
                                enableClipboard={false}
                                displayDataTypes={false}
                                name={false}
                                theme="monokai"
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="result">
                            <div className="mt-4 p-3 bg-gray-900 rounded max-h-96 overflow-auto text-xs text-white">
                              <ReactJson
                                src={test}
                                collapsed={1}
                                enableClipboard={false}
                                displayDataTypes={false}
                                name={false}
                                theme="monokai"
                              />
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DetailedTestResults;
