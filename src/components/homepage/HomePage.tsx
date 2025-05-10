import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/optraflow-logo.png" alt="Optraflow" className="h-8 w-auto" />
              <div className="hidden md:flex ml-10 space-x-8">
                <div className="relative group">
                  <button className="flex items-center text-gray-700 px-3 py-2 text-sm font-medium">
                    Product
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                </div>
                <div className="relative group">
                  <button className="flex items-center text-gray-700 px-3 py-2 text-sm font-medium">
                    Solutions
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                </div>
                <div className="relative group">
                  <button className="flex items-center text-gray-700 px-3 py-2 text-sm font-medium">
                    Resources
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                </div>
                <Link to="/pricing" className="text-gray-700 px-3 py-2 text-sm font-medium">
                  Pricing
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 px-3 py-2 text-sm font-medium">
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-8">
            Test the API's<br />without limits
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Bring your vision to Project with the API automator that gives you the tools you need to succeed.
          </p>
          <div className="flex flex-col items-center space-y-4">
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <p className="text-sm text-gray-500">
              Start for free. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;