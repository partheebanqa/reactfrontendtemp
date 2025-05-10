import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/optraflow-logo.png" alt="Optraflow" className="mx-auto h-12 w-auto" />
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600">
              We collect information that you provide directly to us, including personal information such as your name, email address, and organization details when you register for an account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600">
              We use the information we collect to provide, maintain, and improve our services, communicate with you, and protect our users and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="text-gray-600">
              We do not sell or rent your personal information to third parties. We may share your information only in the circumstances described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-600">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-600">
              You have the right to access, correct, or delete your personal information. You can also object to or restrict certain processing of your information.
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

export default PrivacyPage;