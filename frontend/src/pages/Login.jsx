import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      if (response.token) {
        authLogin(response.token, response.user);
        navigate('/');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      if (error.message === 'Network error. Please check if the server is running.') {
        setError('Unable to connect to the server. Please make sure the backend server is running.');
      } else if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else {
      setError(error.response?.data?.message || 'An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tinda Mbongo</h1>
          <p className="text-gray-600 text-sm mb-4">Enter your credentials to access the remittance platform</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
              </label>
              <input
                id="email"
                type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                required
              placeholder="admin@moneyflow.com"
              />
            </div>
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                required
              placeholder="********"
            />
          </div>
            <button
              type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
            {loading ? 'Signing in...' : 'Sign in'}
            </button>
        </form>
        <div className="mt-6 text-sm text-gray-600">
          <div className="font-semibold mb-1">Demo Accounts:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Admin: admin@tindambongo.com / password</li>
            <li>DRC Agent: agent.drc@tindambongo.com / password</li>
            <li>SA Agent: agent.sa@tindambongo.com / password</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login; 