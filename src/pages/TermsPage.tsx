import { Link } from "wouter";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/optraflow-logo.png" alt="Optraflow" className="mx-auto h-12 w-auto" />
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing and using Optraflow's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600">
              Optraflow provides a web-based platform for workflow automation and business process management. The service includes features for process design, automation, analytics, and collaboration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-600">
              To access certain features of the Service, you must register for an account. You agree to provide accurate information and maintain the security of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Privacy</h2>
            <p className="text-gray-600">
              Your privacy is important to us. Please review our{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>{' '}
              to understand how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-600">
              All content and materials available through the Service are the property of Optraflow or its licensors and are protected by intellectual property laws.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          © 2025, Optraflow technologies Pvt. Ltd. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

export default TermsPage;