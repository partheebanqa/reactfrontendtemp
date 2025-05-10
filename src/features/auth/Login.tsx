import React, { useState } from 'react';
import authService from '../../services/auth/auth-service';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  // onClose: () => void;
  // onLoginSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [directUrl, setDirectUrl] = useState('http://localhost:8080');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: 'admin@apitest.com',
    password: 'admin123',
    name: '',
    tenantId: '',
    tenantName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'tenantId' ? parseInt(value, 10).toString() || '' : value,
    });
  };

  const handleDirectUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirectUrl(e.target.value);
  };

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const user = await authService.directLogin(directUrl, {
        email: formData.email,
        password: formData.password,
      });

      setSuccessMessage('Direct login successful! Redirecting...');
      setTimeout(() => {
        // onLoginSuccess(user);
        // onClose();
      }, 1500);
    } catch (err: any) {
      setError(`Direct login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setValidated(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let user;
      if (isLogin) {
        user = await authService.login({
          email: formData.email,
          password: formData.password,
        });
        if(user.message) navigate('/dashboard');
      }
      //  else {
      //   let tenantId = formData.tenantId;
      //   if (formData.tenantName && !tenantId) {
      //     const tenantService = (await import('../../services/auth/tenantService')).default;
      //     const tenantResponse = await tenantService.createTenant({ name: formData.tenantName });
      //     tenantId = String(tenantResponse.id);
      //   }
      //   user = await authService.register({
      //     name: formData.name,
      //     email: formData.email,
      //     password: formData.password,
      //     tenantId,
      //   });
      //   setSuccessMessage('Account created successfully! Redirecting...');
      // }

      setTimeout(() => {
        // onLoginSuccess(user);
        // onClose();
      }, 1500);
    } catch (err: any) {
      let errorMessage = 'Authentication failed.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 404) {
        errorMessage = 'Authentication server not found. Try direct login.';
      } else if ([401, 403].includes(err.response?.status)) {
        errorMessage = 'Invalid credentials.';
      } else if (err.message?.includes('Network Error')) {
        errorMessage = 'Network error. Server may be unreachable.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMessage(null);
    setValidated(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl relative">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-center">{isLogin ? 'Log In' : 'Create Account'}</h2>
        </div>
        <div className="p-6">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block mb-1 text-sm font-medium">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-blue-300" required />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-blue-300" required />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-blue-300" required minLength={6} />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Organization</label>
                  <input type="text" name="tenantName" value={formData.tenantName} onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded" />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Select existing organization</label>
                  <select name="tenantId" value={formData.tenantId} onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded" disabled={!!formData.tenantName}>
                    <option value="">Select</option>
                    <option value="90">Admin Organization</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
              {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Log In' : 'Create Account')}
            </button>

            {/* Accordion: Advanced Login Options */}
            {isLogin && (
              <div className="mt-6 border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex justify-between items-center bg-gray-100 px-4 py-3 text-left font-medium text-gray-800 hover:bg-gray-200 transition"
              >
                <span>Advanced Login Options</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            
              {showAdvanced && (
                <div className="px-4 py-4 bg-white space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Direct API URL</label>
                    <input
                      type="text"
                      value={directUrl}
                      onChange={handleDirectUrlChange}
                      className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
                      placeholder="http://localhost:8080"
                    />
                    <span className="text-gray-500 text-sm">Enter the direct URL to the API server</span>
                  </div>
            
                  <button
                    type="button"
                    onClick={handleDirectLogin}
                    disabled={loading}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition"
                  >
                    {loading ? 'Trying direct login...' : 'Try Direct Login'}
                  </button>
                </div>
              )}
            </div>
            
          )}

          <button type="button" onClick={toggleAuthMode}
            className="text-blue-600 hover:underline text-sm mt-4">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </form>
        </div>

        
      </div>
    </div>
  );
};

export default AuthModal;
