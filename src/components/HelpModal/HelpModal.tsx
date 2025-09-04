import React, { useState } from 'react';
import { X, Book, Code, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'graphql' | 'grpc' | 'websocket' | 'ai' | 'rest' | 'testing'>('overview');

  if (!isOpen) return null;

  const sections = [
    { id: 'overview', title: 'Overview', icon: Book },
    { id: 'rest', title: 'REST APIs', icon: Code },
    { id: 'graphql', title: 'GraphQL', icon: Code },
    { id: 'grpc', title: 'gRPC', icon: Code },
    { id: 'websocket', title: 'WebSocket', icon: Code },
    { id: 'ai', title: 'AI APIs', icon: Code },
    { id: 'testing', title: 'Testing Best Practices', icon: CheckCircle },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">API Tester Pro Documentation</h2>
        <p className="text-gray-600 mb-4">
          Welcome to API Tester Pro! This comprehensive guide will help you test different types of APIs effectively.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Supported API Types</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• REST APIs with full HTTP method support</li>
            <li>• GraphQL queries, mutations, and subscriptions</li>
            <li>• gRPC service calls</li>
            <li>• WebSocket real-time connections</li>
            <li>• AI/ML APIs (OpenAI, Anthropic, etc.)</li>
          </ul>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Key Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Import from Postman, Swagger, OpenAPI</li>
            <li>• Environment variables and workspaces</li>
            <li>• Request history and collections</li>
            <li>• Response validation and formatting</li>
            <li>• Performance monitoring</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900">Getting Started</h4>
            <p className="text-sm text-blue-700 mt-1">
              Select a section from the left to learn about testing specific API types, or jump to Testing Best Practices for general guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderREST = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">REST API Testing</h2>
        <p className="text-gray-600 mb-4">
          REST (Representational State Transfer) is the most common API architecture. Here's how to test REST APIs effectively.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">HTTP Methods</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-600">GET</span> - Retrieve data
              <br />
              <span className="font-medium text-blue-600">POST</span> - Create new resources
              <br />
              <span className="font-medium text-yellow-600">PUT</span> - Update entire resource
            </div>
            <div>
              <span className="font-medium text-orange-600">PATCH</span> - Partial updates
              <br />
              <span className="font-medium text-red-600">DELETE</span> - Remove resources
              <br />
              <span className="font-medium text-gray-600">HEAD/OPTIONS</span> - Metadata
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Sample REST Request</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-blue-600 mb-2">POST /api/users</div>
            <div className="text-gray-600 mb-2">Headers:</div>
            <div className="ml-4 mb-2">
              Content-Type: application/json<br />
              Authorization: Bearer your-token-here
            </div>
            <div className="text-gray-600 mb-2">Body:</div>
            <div className="ml-4 text-green-600">
              {`{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}`}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900">Testing Considerations</h4>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• Test all HTTP status codes (200, 201, 400, 401, 404, 500)</li>
                <li>• Validate response headers and content types</li>
                <li>• Test with different payload sizes</li>
                <li>• Verify authentication and authorization</li>
                <li>• Test rate limiting and error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGraphQL = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">GraphQL Testing</h2>
        <p className="text-gray-600 mb-4">
          GraphQL provides a flexible query language for APIs. Here's how to test GraphQL endpoints effectively.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">GraphQL Basics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-900">Queries</div>
              <div className="text-blue-700">Read data from the server</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-900">Mutations</div>
              <div className="text-green-700">Modify data on the server</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-medium text-purple-900">Subscriptions</div>
              <div className="text-purple-700">Real-time data updates</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Sample GraphQL Query</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-blue-600 mb-2">POST /graphql</div>
            <div className="text-gray-600 mb-2">Headers:</div>
            <div className="ml-4 mb-2">Content-Type: application/json</div>
            <div className="text-gray-600 mb-2">Body:</div>
            <div className="ml-4 text-green-600">
              {`{
  "query": "query GetUsers($limit: Int) {
    users(limit: $limit) {
      id
      name
      email
      posts {
        id
        title
        createdAt
      }
    }
  }",
  "variables": {
    "limit": 10
  }
}`}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Sample GraphQL Mutation</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-green-600">
              {`{
  "query": "mutation CreateUser($input: UserInput!) {
    createUser(input: $input) {
      id
      name
      email
      createdAt
    }
  }",
  "variables": {
    "input": {
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}`}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">GraphQL Fragments</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-green-600">
              {`fragment UserInfo on User {
  id
  name
  email
  createdAt
}

query GetUsersWithFragments {
  activeUsers: users(status: ACTIVE) {
    ...UserInfo
  }
  inactiveUsers: users(status: INACTIVE) {
    ...UserInfo
  }
}`}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900">GraphQL Testing Tips</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Test query depth limits and complexity analysis</li>
                <li>• Validate field-level permissions and data filtering</li>
                <li>• Test with invalid field names and syntax errors</li>
                <li>• Verify introspection queries work correctly</li>
                <li>• Test subscription connections and disconnections</li>
                <li>• Validate variable types and required fields</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Public GraphQL APIs for Testing</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Countries API</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://countries.trevorblades.com/</code>
            </div>
            <div className="flex items-center justify-between">
              <span>SpaceX API</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://api.spacex.land/graphql/</code>
            </div>
            <div className="flex items-center justify-between">
              <span>Rick & Morty API</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://rickandmortyapi.com/graphql</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGRPC = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">gRPC Testing</h2>
        <p className="text-gray-600 mb-4">
          gRPC is a high-performance RPC framework. Here's how to test gRPC services effectively.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">gRPC Service Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-600 mb-1">Unary RPC</div>
              <div className="text-gray-600">Single request → Single response</div>
            </div>
            <div>
              <div className="font-medium text-green-600 mb-1">Server Streaming</div>
              <div className="text-gray-600">Single request → Stream of responses</div>
            </div>
            <div>
              <div className="font-medium text-yellow-600 mb-1">Client Streaming</div>
              <div className="text-gray-600">Stream of requests → Single response</div>
            </div>
            <div>
              <div className="font-medium text-purple-600 mb-1">Bidirectional Streaming</div>
              <div className="text-gray-600">Stream of requests ↔ Stream of responses</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Sample gRPC Request</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-blue-600 mb-2">Service: UserService</div>
            <div className="text-blue-600 mb-2">Method: GetUser</div>
            <div className="text-gray-600 mb-2">Request Message:</div>
            <div className="ml-4 text-green-600 mb-2">
              {`{
  "user_id": "12345",
  "include_profile": true
}`}
            </div>
            <div className="text-gray-600 mb-2">Expected Response:</div>
            <div className="ml-4 text-green-600">
              {`{
  "user": {
    "id": "12345",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "bio": "Software Developer",
      "location": "San Francisco"
    }
  }
}`}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Protocol Buffer Definition</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-green-600">
              {`syntax = "proto3";

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (stream User);
  rpc CreateUser(CreateUserRequest) returns (User);
}

message GetUserRequest {
  string user_id = 1;
  bool include_profile = 2;
}

message GetUserResponse {
  User user = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  Profile profile = 4;
}`}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900">gRPC Testing Considerations</h4>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• Test with valid and invalid protocol buffer messages</li>
                <li>• Verify streaming connections handle backpressure</li>
                <li>• Test connection timeouts and retries</li>
                <li>• Validate metadata and headers transmission</li>
                <li>• Test error codes and status messages</li>
                <li>• Verify TLS/SSL certificate validation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900">Note</h4>
              <p className="text-sm text-blue-700 mt-1">
                gRPC testing in API Tester Pro currently provides simulation capabilities. For full gRPC testing,
                consider using specialized tools like grpcurl or BloomRPC alongside this platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWebSocket = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">WebSocket Testing</h2>
        <p className="text-gray-600 mb-4">
          WebSockets enable real-time, bidirectional communication. Here's how to test WebSocket connections effectively.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">WebSocket Connection Flow</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
              <span>1. HTTP Upgrade Request</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
              <span>2. Server Accepts Upgrade (101 Switching Protocols)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
              <span>3. Bidirectional Message Exchange</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
              <span>4. Connection Close</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Sample WebSocket Connection</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-blue-600 mb-2">ws://localhost:8080/chat</div>
            <div className="text-gray-600 mb-2">Connection Headers:</div>
            <div className="ml-4 mb-3">
              Upgrade: websocket<br />
              Connection: Upgrade<br />
              Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==<br />
              Sec-WebSocket-Version: 13
            </div>
            <div className="text-gray-600 mb-2">Send Message:</div>
            <div className="ml-4 text-green-600 mb-3">
              {`{
  "type": "chat_message",
  "user": "john_doe",
  "message": "Hello, everyone!",
  "timestamp": "2024-01-15T10:30:00Z"
}`}
            </div>
            <div className="text-gray-600 mb-2">Received Message:</div>
            <div className="ml-4 text-green-600">
              {`{
  "type": "chat_response",
  "message_id": "msg_12345",
  "status": "delivered",
  "timestamp": "2024-01-15T10:30:01Z"
}`}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Common WebSocket Message Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-600 mb-1">Text Messages</div>
              <div className="text-gray-600 mb-3">UTF-8 encoded strings (JSON, plain text)</div>

              <div className="font-medium text-green-600 mb-1">Binary Messages</div>
              <div className="text-gray-600">Raw binary data (images, files)</div>
            </div>
            <div>
              <div className="font-medium text-yellow-600 mb-1">Control Frames</div>
              <div className="text-gray-600 mb-3">Ping/Pong for keep-alive</div>

              <div className="font-medium text-red-600 mb-1">Close Frames</div>
              <div className="text-gray-600">Connection termination</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">WebSocket Testing Scenarios</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-900 mb-1">Connection Testing</div>
              <div className="text-blue-700">Test successful connections, failed connections, and upgrade rejections</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-900 mb-1">Message Exchange</div>
              <div className="text-green-700">Send various message types and verify responses</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="font-medium text-yellow-900 mb-1">Error Handling</div>
              <div className="text-yellow-700">Test network interruptions and malformed messages</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-medium text-purple-900 mb-1">Performance</div>
              <div className="text-purple-700">Test high-frequency messages and connection limits</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900">WebSocket Testing Considerations</h4>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• Test connection timeouts and keep-alive mechanisms</li>
                <li>• Verify proper handling of connection drops</li>
                <li>• Test message ordering and delivery guarantees</li>
                <li>• Validate authentication and authorization</li>
                <li>• Test with different message sizes and frequencies</li>
                <li>• Verify proper cleanup on connection close</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAI = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI API Testing</h2>
        <p className="text-gray-600 mb-4">
          AI APIs provide machine learning capabilities. Here's how to test various AI service endpoints effectively.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Common AI API Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-600 mb-1">Text Completion</div>
              <div className="text-gray-600 mb-3">Generate text based on prompts</div>

              <div className="font-medium text-green-600 mb-1">Chat Completion</div>
              <div className="text-gray-600 mb-3">Conversational AI responses</div>

              <div className="font-medium text-purple-600 mb-1">Embeddings</div>
              <div className="text-gray-600">Vector representations of text</div>
            </div>
            <div>
              <div className="font-medium text-yellow-600 mb-1">Image Generation</div>
              <div className="text-gray-600 mb-3">Create images from text prompts</div>

              <div className="font-medium text-red-600 mb-1">Audio Processing</div>
              <div className="text-gray-600 mb-3">Speech-to-text, text-to-speech</div>

              <div className="font-medium text-orange-600 mb-1">Fine-tuning</div>
              <div className="text-gray-600">Custom model training</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">OpenAI Chat Completion Example</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-blue-600 mb-2">POST https://api.openai.com/v1/chat/completions</div>
            <div className="text-gray-600 mb-2">Headers:</div>
            <div className="ml-4 mb-3">
              Authorization: Bearer YOUR_API_KEY<br />
              Content-Type: application/json
            </div>
            <div className="text-gray-600 mb-2">Body:</div>
            <div className="ml-4 text-green-600">
              {`{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Explain quantum computing in simple terms."
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0
}`}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Anthropic Claude Example</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-blue-600 mb-2">POST https://api.anthropic.com/v1/messages</div>
            <div className="text-gray-600 mb-2">Headers:</div>
            <div className="ml-4 mb-3">
              x-api-key: YOUR_ANTHROPIC_API_KEY<br />
              Content-Type: application/json<br />
              anthropic-version: 2023-06-01
            </div>
            <div className="text-gray-600 mb-2">Body:</div>
            <div className="ml-4 text-green-600">
              {`{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 1000,
  "messages": [
    {
      "role": "user",
      "content": "Write a Python function to calculate fibonacci numbers."
    }
  ]
}`}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Image Generation Example</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-blue-600 mb-2">POST https://api.openai.com/v1/images/generations</div>
            <div className="text-gray-600 mb-2">Body:</div>
            <div className="ml-4 text-green-600">
              {`{
  "prompt": "A serene landscape with mountains and a lake at sunset, digital art style",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid"
}`}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Text Embeddings Example</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm">
            <div className="text-blue-600 mb-2">POST https://api.openai.com/v1/embeddings</div>
            <div className="text-gray-600 mb-2">Body:</div>
            <div className="ml-4 text-green-600">
              {`{
  "model": "text-embedding-ada-002",
  "input": "The quick brown fox jumps over the lazy dog",
  "encoding_format": "float"
}`}
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900">AI API Security & Cost Considerations</h4>
              <ul className="text-sm text-red-700 mt-1 space-y-1">
                <li>• Never expose API keys in client-side code</li>
                <li>• Monitor token usage and costs carefully</li>
                <li>• Implement rate limiting to prevent abuse</li>
                <li>• Validate and sanitize all user inputs</li>
                <li>• Test with various prompt lengths and complexities</li>
                <li>• Handle API rate limits and quota exceeded errors</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900">Testing Best Practices</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Test with edge cases (empty prompts, very long inputs)</li>
                <li>• Verify response format consistency</li>
                <li>• Test error handling for invalid parameters</li>
                <li>• Monitor response times and latency</li>
                <li>• Test with different model parameters</li>
                <li>• Validate content filtering and safety measures</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTesting = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Testing Best Practices</h2>
        <p className="text-gray-600 mb-4">
          Follow these comprehensive testing practices to ensure your APIs are robust, reliable, and performant.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Testing Pyramid</h3>
          <div className="space-y-3">
            <div className="bg-green-100 p-3 rounded">
              <div className="font-medium text-green-900">Unit Tests (70%)</div>
              <div className="text-sm text-green-700">Test individual API endpoints and functions</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded">
              <div className="font-medium text-yellow-900">Integration Tests (20%)</div>
              <div className="text-sm text-yellow-700">Test API interactions and data flow</div>
            </div>
            <div className="bg-red-100 p-3 rounded">
              <div className="font-medium text-red-900">End-to-End Tests (10%)</div>
              <div className="text-sm text-red-700">Test complete user workflows</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Test Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-600 mb-2">Functional Testing</div>
              <ul className="text-gray-600 space-y-1 mb-4">
                <li>• Positive test cases (happy path)</li>
                <li>• Negative test cases (error scenarios)</li>
                <li>• Boundary value testing</li>
                <li>• Input validation testing</li>
              </ul>

              <div className="font-medium text-green-600 mb-2">Security Testing</div>
              <ul className="text-gray-600 space-y-1">
                <li>• Authentication and authorization</li>
                <li>• Input sanitization</li>
                <li>• SQL injection prevention</li>
                <li>• Rate limiting validation</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-yellow-600 mb-2">Performance Testing</div>
              <ul className="text-gray-600 space-y-1 mb-4">
                <li>• Load testing (normal traffic)</li>
                <li>• Stress testing (peak traffic)</li>
                <li>• Spike testing (sudden increases)</li>
                <li>• Volume testing (large datasets)</li>
              </ul>

              <div className="font-medium text-purple-600 mb-2">Reliability Testing</div>
              <ul className="text-gray-600 space-y-1">
                <li>• Error handling and recovery</li>
                <li>• Timeout scenarios</li>
                <li>• Network failure simulation</li>
                <li>• Data consistency validation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Test Data Management</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-900 mb-1">Test Data Strategy</div>
              <div className="text-blue-700">Use realistic, anonymized data that covers edge cases and boundary conditions</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-900 mb-1">Data Isolation</div>
              <div className="text-green-700">Ensure tests don't interfere with each other by using separate test databases</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="font-medium text-yellow-900 mb-1">Data Cleanup</div>
              <div className="text-yellow-700">Clean up test data after each test run to maintain consistency</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Environment Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-900 mb-1">Development</div>
              <div className="text-blue-700">Rapid testing and debugging</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="font-medium text-yellow-900 mb-1">Staging</div>
              <div className="text-yellow-700">Production-like testing</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-900 mb-1">Production</div>
              <div className="text-green-700">Monitoring and health checks</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Response Validation Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900 mb-2">Status Codes</div>
              <ul className="text-gray-600 space-y-1 mb-4">
                <li>✓ 200 OK - Successful requests</li>
                <li>✓ 201 Created - Resource creation</li>
                <li>✓ 400 Bad Request - Invalid input</li>
                <li>✓ 401 Unauthorized - Authentication</li>
                <li>✓ 403 Forbidden - Authorization</li>
                <li>✓ 404 Not Found - Missing resources</li>
                <li>✓ 500 Internal Server Error</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-2">Response Structure</div>
              <ul className="text-gray-600 space-y-1">
                <li>✓ Correct content type headers</li>
                <li>✓ Valid JSON/XML structure</li>
                <li>✓ Required fields present</li>
                <li>✓ Data type validation</li>
                <li>✓ Consistent error format</li>
                <li>✓ Proper encoding (UTF-8)</li>
                <li>✓ Response time within limits</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-900">Testing Success Metrics</h4>
              <ul className="text-sm text-green-700 mt-1 space-y-1">
                <li>• 95%+ test coverage for critical paths</li>
                <li>• Response times under 200ms for simple requests</li>
                <li>• 99.9% uptime and availability</li>
                <li>• Zero critical security vulnerabilities</li>
                <li>• Consistent performance under load</li>
                <li>• Comprehensive error handling</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Automation & CI/CD Integration</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-medium text-purple-900 mb-1">Automated Testing</div>
              <div className="text-purple-700">Run tests automatically on code changes, deployments, and schedules</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="font-medium text-orange-900 mb-1">Continuous Monitoring</div>
              <div className="text-orange-700">Monitor API health, performance, and error rates in production</div>
            </div>
            <div className="bg-pink-50 p-3 rounded">
              <div className="font-medium text-pink-900 mb-1">Reporting & Analytics</div>
              <div className="text-pink-700">Generate detailed test reports and track metrics over time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'rest': return renderREST();
      case 'graphql': return renderGraphQL();
      case 'grpc': return renderGRPC();
      case 'websocket': return renderWebSocket();
      case 'ai': return renderAI();
      case 'testing': return renderTesting();
      default: return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Documentation</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="p-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={16} />
              <span className="text-sm">Close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">
                {sections.find(s => s.id === activeSection)?.title}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}