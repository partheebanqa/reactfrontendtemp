import React from "react";
import { Button } from "@/components/ui/button";
import {
  Code
} from "lucide-react";
import { Link } from "wouter";
import LogoFull from "../../assests/images/OptraLogo-removebg-preview.png";

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  try {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
             <Link to="/" className="flex items-center space-x-2">
                <img
                  src={LogoFull}
                  alt="Optraflow"
                  className=""
                  style={{ width: "100%", height: "60px" }}
                />
             
              </Link>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <a href="/pricing">Pricing</a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="/contact-us">Contact Us</a>
              </Button>
              <Button onClick={() => window.location.href = "/signin"}>
                Sign In
              </Button>
            </div>
          </nav>
        </header>

        {children}

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                  <Link to="/" className="flex items-center space-x-2">
                <img
                  src={LogoFull}
                  alt="Optraflow"
                  className=""
                  style={{ width: "50%", height: "60px" }}
                />
             
              </Link>

                <p className="text-gray-400">
                  The no-code API testing platform for modern teams.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <div className="space-y-2 text-gray-400">
                  <div>Features</div>
                  <div>Pricing</div>
                  <div>Integrations</div>
                  <div>API</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <div className="space-y-2 text-gray-400">
                  <div>About</div>
                  <div>Blog</div>
                  <div>Careers</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <div className="space-y-2 text-gray-400">
                  <div>
                    <Link to="/privacy">Privacy Policy</Link>
                  </div>
                  <div>
                    <Link to="/terms">Terms of Service</Link>
                  </div>
                  <div>
                    <Link to="/contact-us">Contact Us</Link>
                  </div>
                  <div>Security</div>
                  <div>Compliance</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; 2025 APIFlow. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('LandingLayout error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">Please refresh the page</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default LandingLayout;
