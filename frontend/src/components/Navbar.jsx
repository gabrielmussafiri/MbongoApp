import { Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-lg font-semibold text-primary-600">DRC-SA Money Transfer</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                {user && (
                  <>
                    <span className="text-gray-700">Welcome, {user.email} ({user.role})</span>
                    <button onClick={logout} className="btn btn-secondary">Logout</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 