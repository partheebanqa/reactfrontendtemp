import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  Zap,
  TestTube,
  Link2,
  Database,
  Download,
  Play,
  Settings,
  User,
  BookOpen,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const faqData: FAQItem[] = [
  // Request Builder
  {
    id: "rb-1",
    question: "What is the Request Builder and how do I use it?",
    answer: "The Request Builder is a powerful tool for creating and testing individual API requests. You can set HTTP methods (GET, POST, PUT, DELETE), add headers, query parameters, and request bodies. It supports various content types including JSON, XML, and form data. Simply select your method, enter the URL, configure headers and body, then click Send to test your request.",
    category: "Request Builder",
    tags: ["basics", "getting-started", "api", "testing"]
  },
  {
    id: "rb-2",
    question: "How do I add authentication to my requests?",
    answer: "You can add authentication through the Headers tab by adding Authorization headers (e.g., 'Bearer token' for JWT, 'Basic username:password' for basic auth), or use API tokens in the headers. For OAuth, you can add the access token as a Bearer token in the Authorization header.",
    category: "Request Builder",
    tags: ["authentication", "security", "headers", "oauth"]
  },
  {
    id: "rb-3",
    question: "Can I save and reuse requests?",
    answer: "Yes! Once you create a request in the Request Builder, you can save it to a Test Suite for reuse. You can also create templates by saving requests with variables that can be modified later.",
    category: "Request Builder",
    tags: ["save", "reuse", "templates", "organization"]
  },

  // Test Suites
  {
    id: "ts-1",
    question: "What are Test Suites and why should I use them?",
    answer: "Test Suites are collections of related API tests that help you organize your testing workflow. They allow you to group tests by functionality, feature, or environment. You can run entire suites with one click, making it easy to test complete workflows or regression testing.",
    category: "Test Suites",
    tags: ["organization", "testing", "workflow", "automation"]
  },
  {
    id: "ts-2",
    question: "How do I create and manage Test Suites?",
    answer: "Click 'New Test Suite' to create a collection, give it a name and description, then add individual test cases from your Request Builder. You can set the suite status as Active, Paused, or Archived. Use the search function to quickly find specific suites.",
    category: "Test Suites",
    tags: ["creation", "management", "organization", "status"]
  },
  {
    id: "ts-3",
    question: "Can I run all tests in a suite at once?",
    answer: "Absolutely! Each Test Suite has a 'Run Suite' button that executes all tests in sequence. You can monitor the progress and results in real-time, and view detailed reports in the Executions section.",
    category: "Test Suites",
    tags: ["execution", "batch-testing", "automation", "monitoring"]
  },

  // Request Chains
  {
    id: "rc-1",
    question: "What's the difference between Test Suites and Request Chains?",
    answer: "Request Chains are sequences of API requests that pass data between each step, simulating real user workflows. Unlike Test Suites which run independent tests, Request Chains allow you to use response data from one request as input for the next request.",
    category: "Request Chains",
    tags: ["workflow", "data-passing", "sequence", "automation"]
  },
  {
    id: "rc-2",
    question: "How do I pass data between requests in a chain?",
    answer: "Use variables like {{token}} in subsequent requests to reference data from previous responses. For example, if your login request returns a token, you can use {{auth_token}} in the Authorization header of following requests. The system automatically extracts and passes this data.",
    category: "Request Chains",
    tags: ["variables", "data-passing", "automation", "workflows"]
  },
  {
    id: "rc-3",
    question: "Can I schedule Request Chains to run automatically?",
    answer: "Yes! You can schedule Request Chains to run at specific times or intervals. Go to the scheduling section of any chain to set up daily, weekly, or custom cron-based schedules. This is perfect for monitoring APIs or running regular health checks.",
    category: "Request Chains",
    tags: ["scheduling", "automation", "monitoring", "cron"]
  },

  // Data Management
  {
    id: "dm-1",
    question: "How is my test data stored and managed?",
    answer: "All your test data including requests, responses, and execution history is stored securely in our database. You can export test results, view historical data, and manage your workspace data from the Data Management section.",
    category: "Data Management",
    tags: ["storage", "security", "export", "history"]
  },
  {
    id: "dm-2",
    question: "Can I import/export my tests and data?",
    answer: "Yes! You can export your test suites, request chains, and execution data in various formats (JSON, CSV). You can also import tests from other tools or previous exports to migrate your testing setup.",
    category: "Data Management",
    tags: ["import", "export", "migration", "backup"]
  },
  {
    id: "dm-3",
    question: "How long is my test data retained?",
    answer: "Test data retention depends on your subscription plan. Free plans retain data for 30 days, Pro plans for 1 year, and Enterprise plans offer custom retention periods. You can always export important data for longer-term storage.",
    category: "Data Management",
    tags: ["retention", "plans", "storage", "backup"]
  },

  // Swagger Extractor
  {
    id: "se-1",
    question: "What is the Swagger Extractor utility?",
    answer: "The Swagger Extractor automatically imports API tests from OpenAPI/Swagger specifications. Simply upload your API spec file or provide a URL, and it will generate test cases for all your endpoints with proper request formats and examples.",
    category: "Utility - Swagger Extractor",
    tags: ["swagger", "openapi", "import", "automation"]
  },
  {
    id: "se-2",
    question: "What file formats are supported for API spec import?",
    answer: "We support OpenAPI 3.0, Swagger 2.0, in both JSON and YAML formats. You can upload files directly or provide a URL to your API specification. The tool automatically parses and creates test cases for all endpoints.",
    category: "Utility - Swagger Extractor",
    tags: ["formats", "openapi", "swagger", "json", "yaml"]
  },
  {
    id: "se-3",
    question: "Will the extracted tests include examples and validation?",
    answer: "Yes! The extractor creates tests with example data from your API spec, including request/response schemas, parameter validation, and status code checks. You can further customize these generated tests as needed.",
    category: "Utility - Swagger Extractor",
    tags: ["examples", "validation", "schemas", "customization"]
  },

  // Executions
  {
    id: "ex-1",
    question: "How do I monitor test executions and results?",
    answer: "The Executions page shows all your test runs with detailed results, response times, and status codes. You can filter by date, status, or test suite, and drill down into individual request details to debug failures.",
    category: "Executions",
    tags: ["monitoring", "results", "debugging", "performance"]
  },
  {
    id: "ex-2",
    question: "What information is available in execution reports?",
    answer: "Execution reports include success/failure rates, response times, error details, request/response data, and performance metrics. You can view trends over time and export reports for documentation or compliance purposes.",
    category: "Executions",
    tags: ["reports", "metrics", "performance", "compliance"]
  },
  {
    id: "ex-3",
    question: "Can I get notifications when tests fail?",
    answer: "Yes! You can set up notifications via email, Slack, or webhooks when tests fail or meet specific conditions. Configure these in the Integrations section for real-time alerts about your API health.",
    category: "Executions",
    tags: ["notifications", "alerts", "integrations", "monitoring"]
  },

  // CI/CD Configuration
  {
    id: "ci-1",
    question: "How do I integrate tests into my CI/CD pipeline?",
    answer: "Use our REST API or webhook integrations to trigger tests from your CI/CD tools like GitHub Actions, Jenkins, or GitLab CI. We provide example configurations and API tokens for secure integration.",
    category: "CI/CD Configuration",
    tags: ["integration", "automation", "devops", "api"]
  },
  {
    id: "ci-2",
    question: "What CI/CD platforms are supported?",
    answer: "We support all major CI/CD platforms including GitHub Actions, GitLab CI, Jenkins, Azure DevOps, CircleCI, and any system that can make HTTP requests. We provide specific examples and templates for popular platforms.",
    category: "CI/CD Configuration",
    tags: ["platforms", "github", "gitlab", "jenkins", "azure"]
  },
  {
    id: "ci-3",
    question: "Can tests automatically fail CI builds when API tests fail?",
    answer: "Absolutely! Our API returns appropriate exit codes and detailed results that CI systems can interpret. Failed API tests can stop deployments and provide detailed failure information in your build logs.",
    category: "CI/CD Configuration",
    tags: ["automation", "failure-handling", "build-gates", "deployment"]
  },

  // Profile Sections
  {
    id: "ps-1",
    question: "How do I manage my account and workspace settings?",
    answer: "Access your profile settings to manage personal information, API keys, notification preferences, and workspace configurations. You can also manage team members, permissions, and billing information from the profile section.",
    category: "Profile Sections",
    tags: ["account", "settings", "workspace", "team"]
  },
  {
    id: "ps-2",
    question: "How do I invite team members to my workspace?",
    answer: "In your profile settings, go to Team Management and click 'Invite Members'. Enter email addresses and set appropriate permissions (Admin, Editor, Viewer). Invited members will receive an email to join your workspace.",
    category: "Profile Sections",
    tags: ["team", "collaboration", "permissions", "invitations"]
  },
  {
    id: "ps-3",
    question: "Can I customize my workspace and user preferences?",
    answer: "Yes! You can customize themes, default environments, notification settings, and dashboard preferences. These settings sync across all your devices and help personalize your testing workflow.",
    category: "Profile Sections",
    tags: ["customization", "preferences", "themes", "personalization"]
  }
];

const categories = [
  { name: "Request Builder", icon: Zap, color: "bg-blue-100 text-blue-600" },
  { name: "Test Suites", icon: TestTube, color: "bg-green-100 text-green-600" },
  { name: "Request Chains", icon: Link2, color: "bg-purple-100 text-purple-600" },
  { name: "Data Management", icon: Database, color: "bg-orange-100 text-orange-600" },
  { name: "Utility - Swagger Extractor", icon: Download, color: "bg-cyan-100 text-cyan-600" },
  { name: "Executions", icon: Play, color: "bg-red-100 text-red-600" },
  { name: "CI/CD Configuration", icon: Settings, color: "bg-indigo-100 text-indigo-600" },
  { name: "Profile Sections", icon: User, color: "bg-pink-100 text-pink-600" }
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="text-blue-600" size={32} />
              <h1 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h1>
            </div>
            <p className="text-lg text-slate-600 mb-6">
              Everything you need to know about our API testing platform
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <Input
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Categories</h3>
              <div className="space-y-2">
                <Button
                  variant={selectedCategory === "All" ? "default" : "ghost"}
                  onClick={() => setSelectedCategory("All")}
                  className="w-full justify-start"
                >
                  All Categories
                </Button>
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = faqData.filter(item => item.category === category.name).length;
                  return (
                    <Button
                      key={category.name}
                      variant={selectedCategory === category.name ? "default" : "ghost"}
                      onClick={() => setSelectedCategory(category.name)}
                      className="w-full justify-start"
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${category.color}`}>
                        <Icon size={14} />
                      </div>
                      <span className="flex-1 text-left">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            {selectedCategory !== "All" && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const category = categories.find(c => c.name === selectedCategory);
                    if (category) {
                      const Icon = category.icon;
                      return (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.color}`}>
                          <Icon size={18} />
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <h2 className="text-2xl font-bold text-slate-900">{selectedCategory}</h2>
                </div>
                <p className="text-slate-600">
                  {selectedCategory === "Request Builder" && "Build and test individual API requests with our powerful request builder tool."}
                  {selectedCategory === "Test Suites" && "Organize and manage collections of related API tests for better workflow organization."}
                  {selectedCategory === "Request Chains" && "Create automated workflows that pass data between sequential API requests."}
                  {selectedCategory === "Data Management" && "Manage, export, and organize your test data and execution history."}
                  {selectedCategory === "Utility - Swagger Extractor" && "Import and generate tests automatically from OpenAPI/Swagger specifications."}
                  {selectedCategory === "Executions" && "Monitor test results, performance metrics, and debugging information."}
                  {selectedCategory === "CI/CD Configuration" && "Integrate API testing into your continuous integration and deployment pipelines."}
                  {selectedCategory === "Profile Sections" && "Manage your account, workspace settings, and team collaboration features."}
                </p>
              </div>
            )}

            {filteredFAQs.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No results found</h3>
                <p className="text-slate-600">
                  Try adjusting your search terms or selecting a different category.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <Collapsible
                      open={openItems.includes(item.id)}
                      onOpenChange={() => toggleItem(item.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-left text-base font-medium text-slate-900 pr-4">
                                {item.question}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                                {item.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {openItems.includes(item.id) ? (
                              <ChevronDown className="text-slate-400" size={20} />
                            ) : (
                              <ChevronRight className="text-slate-400" size={20} />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-slate-700 leading-relaxed">{item.answer}</p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="text-center">
            <MessageCircle className="text-blue-600 mx-auto mb-4" size={32} />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Still have questions?</h3>
            <p className="text-slate-600 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline">
                <MessageCircle className="mr-2" size={16} />
                Contact Support
              </Button>
              <Button>
                <ArrowRight className="mr-2" size={16} />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}