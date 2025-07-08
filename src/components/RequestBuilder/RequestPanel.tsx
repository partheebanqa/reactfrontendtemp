import React, { useState } from "react";
import {
  Send,
  ChevronDown,
  Code,
  Save,
  ShieldCloseIcon,
  Cross,
  Variable,
  Clock,
  X,
} from "lucide-react";
import SchemaPage from "./SchemaPage";
import { useRequestBuilder } from "@/hooks/useRequestBuilder";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Collection,
  CollectionRequest,
  KeyValuePair,
  Request,
} from "@/shared/types/collection";
import { useRequest } from "@/contexts/RequestContext";
import RequestParams from "./RequestParams";
import RequestAuth from "./RequestAuth";
import RequestHeaders from "./RequestHeaders";

interface RequestPanelProps {
  request: CollectionRequest;
  setRequest: (request: CollectionRequest) => void;
  onSend: () => void;
  loading: boolean;
  response?: any;
}

type TabType =
  | "params"
  | "auth"
  | "headers"
  | "body"
  | "tests"
  | "ai_tests"
  | "parametrization"
  | "schemas";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const RequestPanel: React.FC<RequestPanelProps> = ({
  request,
  setRequest,
  onSend,
  loading,
  response,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("params");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showSchemaPanel, setShowSchemaPanel] = useState(false);
  const { requestData, updateRequestData, executeRequest } = useRequest();
  const { setCollectionRequest } = useRequestBuilder();

  const [showNamePopup, setShowNamePopup] = useState(false);
  const [requestName, setrequestName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [collections, setCollections] = useState([]);
  const { currentWorkspace } = useWorkspace();
  const [bodyRawContent, setbodyRawContent] = useState("");
  const { collectionList } = useRequestBuilder();

  const sendRequest = () => {
    executeRequest();
  };

  const saveRequest = async (e: React.FormEvent) => {
    const result = collectionList?.find(
      (x: Collection) => x.id === selectedCollectionId
    ) as Collection | undefined;
    const nextOrder =
      result && result.requests.length > 0
        ? result.requests[result.requests.length - 1].order
        : 1;

    console.log(currentCollections);

    e.preventDefault();
    const updatedRequest: CollectionRequest = {
      ...request,
      name: requestName,
      description: description,
      collectionId: selectedCollectionId,
      variables: {},
      bodyType: "none",
      bodyFormData: null,
      bodyRawContent: bodyRawContent,
      order: nextOrder + 1,
    };
    const response = await collectionService.saveCollectionRequest(
      updatedRequest
    );
    showSnackbar(response.message, "success");
    if (response) {
      // setCollectionRequest(updatedRequest);
      setShowNamePopup(false);
    }
  };

  const updateAuth = (
    authType: string,
    auth: CollectionRequest["authorization"]
  ) => {
    setRequest({
      ...request,
      authorizationType: authType,
      authorization: auth,
    });
  };

  const updateHeaders = (headers: KeyValuePair[]) => {
    setRequest({ ...request, headers });
  };

  const updateParams = (params?: KeyValuePair[]) => {
    setRequest({ ...request, params });
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateRequestData({ method: e.target.value as RequestMethod });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRequestData({ url: e.target.value });
  };

  const handleAddParam = () => {
    updateRequestData({
      params: [...requestData.params, { key: "", value: "" }],
    });
  };

  const handleAddHeader = () => {
    updateRequestData({
      headers: [...requestData.headers, { key: "", value: "" }],
    });
  };

  const handleParamChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newParams = [...requestData.params];
    newParams[index][field] = value;
    updateRequestData({ params: newParams });
  };

  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newHeaders = [...requestData.headers];
    newHeaders[index][field] = value;
    updateRequestData({ headers: newHeaders });
  };

  const handleRemoveParam = (index: number) => {
    const newParams = [...requestData.params];
    newParams.splice(index, 1);
    updateRequestData({ params: newParams });
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...requestData.headers];
    newHeaders.splice(index, 1);
    updateRequestData({ headers: newHeaders });
  };

  const updateBody = (bodyRawContent: string) => {
    setRequest({ ...request, bodyRawContent });
    try {
      if (bodyRawContent.trim()) {
        JSON.parse(bodyRawContent);
        setJsonError(null);
      } else {
        setJsonError(null);
      }
    } catch (err) {
      setJsonError("Invalid JSON format");
    }
  };

  // const updateAssertions = (assertions: Request['assertions']) => {
  //   setRequest({ ...request, assertions });
  // };

  // const updateGraphQL = (updates: { query?: string; variables?: string }) => {
  //   setRequest({
  //     ...request,
  //     graphQLQuery: updates.query ?? request.graphQLQuery,
  //     graphQLVariables: updates.variables ?? request.graphQLVariables,
  //   });
  // };

  return (
    <div className="rounded-lg shadow-md bg-card text-card-foreground w-full mb-4">
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              className="appearance-none bg-primary text-primary-foreground font-medium px-4 py-2 rounded-md pr-8"
              value={request?.method}
              onChange={(e) => {
                handleMethodChange(e);
                setRequest({ ...request, method: e.target.value });
              }}
            >
              {HTTP_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-foreground"
            />
          </div>
          <input
            type="text"
            placeholder="Enter URL or paste text"
            className="flex-1 border border-input bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            value={request?.url}
            onChange={(e) => {
              handleUrlChange(e);
              setRequest({ ...request, url: e.target.value });
            }}
          />
          <div className="flex items-center gap-2">
            <button
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-primary/90"
              onClick={() => {
                onSend();
                sendRequest();
              }}
              disabled={
                loading ||
                !request.url ||
                (request.method !== "GET" && jsonError !== null)
              }
            >
              <Send size={16} />
              <span>Send</span>
            </button>
            <button
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-primary/90"
              disabled={!request.url}
              onClick={() => {
                setShowNamePopup(true);
              }}
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {showNamePopup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 w-full max-w-sm relative space-y-4 border border-border">
            <h2 className="text-lg font-semibold">Save Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Request Name
                </label>
                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => setrequestName(e.target.value)}
                  placeholder="Request Name"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Description
                </label>
                <textarea
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Request description"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Collection
                </label>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => {
                    setSelectedCollectionId(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a collection</option>
                  {collectionList.map((collection: any) => (
                    <option key={collection.Id} value={collection.Id}>
                      {collection.Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setShowNamePopup(false)}
                className="px-4 py-2 text-sm hover:text-foreground/80"
              >
                Cancel
              </button>
              <button
                onClick={saveRequest}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={14} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="border-t border-border">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "params"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("params")}
            >
              Params
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "auth"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("auth")}
            >
              Authorization
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "headers"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("headers")}
            >
              Headers
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "body"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("body")}
            >
              Body
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "schemas"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("schemas")}
            >
              Schemas
            </button>
          </div>
          <div className="p-4">
            {activeTab === "params" && (
              <RequestParams params={request.params} onChange={updateParams} />
            )}
            {activeTab === "auth" && (
              <RequestAuth
                authorizationType={request.authorizationType}
                authorization={request.authorization}
                onChange={(authType, auth) => {
                  setRequest({
                    ...request,
                    authorizationType: authType,
                    authorization: auth,
                  });
                  updateAuth;
                }}
              />
            )}
            {activeTab === "headers" && (
              <RequestHeaders
                headers={request.headers}
                onChange={updateHeaders}
              />
            )}
            {activeTab === "body" && (
              <div className="relative">
                <textarea
                  value={request.bodyRawContent}
                  onChange={(e) => {
                    updateBody(e.target.value);
                    setbodyRawContent(e.target.value);
                  }}
                  className={`w-full h-48 px-3 py-2 text-sm font-mono bg-background border rounded ${
                    jsonError ? "border-destructive" : "border-input"
                  } focus:outline-none focus:ring-2 focus:ring-ring`}
                  placeholder="Enter JSON body"
                  spellCheck={false}
                />
                {jsonError && (
                  <div className="absolute bottom-2 right-2 text-sm text-destructive px-2 py-1 rounded-md bg-destructive/10 shadow">
                    {jsonError}
                  </div>
                )}
              </div>
            )}

            {/* {activeTab === 'body' && !request.isGraphQL && request.method !== 'GET' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Request Body (JSON)</h3>
                <button
                  onClick={formatJson}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Format JSON
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={request.body}
                  onChange={(e) => updateBody(e.target.value)}
                  className={`w-full h-48 px-3 py-2 text-sm font-mono border rounded ${
                    jsonError ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter JSON body"
                  spellCheck={false}
                />
                {jsonError && (
                  <div className="absolute bottom-2 right-2 text-sm text-red-500 px-2 py-1 rounded-md shadow">
                    {jsonError}
                  </div>
                )}
              </div>
            </div>
          )} */}
            {/* {activeTab === 'tests' && (
            <AssertionsPanel
              assertions={request.assertions || {}}
              onChange={updateAssertions}
              availablePaths={response?.data ? Object.keys(response.data) : []}
            />
          )}
          {activeTab === 'ai_tests' && (
            <TestGenerator
              request={request}
              onRunTest={async (testRequest) => {
                setRequest(testRequest);
                await onSend();
                return response;
              }}
            />
          )}
          {activeTab === 'parametrization' && (
            <Parametrization
              request={request}
              onRequestChange={setRequest}
              onSend={onSend}
            />
          )} */}
            {/* {request.isGraphQL && (
            <GraphQLEditor
              query={request.graphQLQuery || ''}
              variables={request.graphQLVariables || ''}
              onChange={updateGraphQL}
            />
          )} */}

            {activeTab === "schemas" && (
              <div>
                <SchemaPage />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Panel */}
      {response && (
        <div className="bg-card rounded-lg shadow-md p-4 mt-4 border border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Response</h2>
            <button
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              onClick={() => setShowSchemaPanel(true)}
            >
              Generate Schema
            </button>
          </div>
          <div className="bg-muted p-4 rounded-md">
            <div className="flex items-center mb-2">
              <span
                className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  response.status < 400 ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              <span className="font-medium">
                Status: {response.status} {response.statusText}
              </span>
              {response.time && (
                <span className="ml-4 text-muted-foreground text-sm">
                  <Clock size={14} className="inline mr-1" />
                  {response.time}ms
                </span>
              )}
            </div>

            <div className="mt-4">
              <div className="flex border-b border-border">
                <button className="px-3 py-2 text-sm font-medium border-b-2 border-primary">
                  Response
                </button>
                <button className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  Headers
                </button>
                <button className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  Cookies
                </button>
              </div>

              <div className="mt-2 bg-background rounded-md p-2 font-mono text-sm overflow-auto max-h-60">
                <pre>{JSON.stringify(response.data, null, 2)}</pre>
              </div>
            </div>
          </div>

          {showSchemaPanel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full relative">
                <button
                  onClick={() => setShowSchemaPanel(false)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-2xl"
                >
                  ✕
                </button>
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">Schema Generator</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-auto max-h-96">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
                      onClick={() => setShowSchemaPanel(false)}
                    >
                      Cancel
                    </button>
                    <button className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      Save Schema
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestPanel;
