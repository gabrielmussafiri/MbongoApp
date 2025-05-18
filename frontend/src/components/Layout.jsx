import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  CreditCardIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Agents', href: '/agents', icon: UserGroupIcon },
    { name: 'Sub-Accounts', href: '/sub-accounts', icon: CreditCardIcon },
    { name: 'Transactions', href: '/transactions', icon: ArrowPathIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-primary-700 to-primary-800 border-r border-white/10 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">DRC-SA MONEY</span>
            </Link>
            <button
              className="lg:hidden text-white/70 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-white/70 truncate">
                  {user?.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Navigation */}
        <div className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-neutral-200 shadow-sm">
          <button
            className="lg:hidden text-neutral-500 hover:text-neutral-700"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex-1 px-4">
            <h1 className="text-xl font-semibold text-neutral-900">
              {navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 