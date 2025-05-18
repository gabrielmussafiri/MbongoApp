import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  CreditCardIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Agents', href: '/agents', icon: UserGroupIcon },
    { name: 'Transactions', href: '/transactions', icon: BanknotesIcon },
    { name: 'Pending Transactions', href: '/pending-transactions', icon: ArrowPathIcon },
    { name: 'Sub Accounts', href: '/sub-accounts', icon: CreditCardIcon },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/80 backdrop-blur-md border-r border-neutral-200 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-primary-600">DRC-SA Money</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 ${
                      isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                  <span className="text-lg font-medium leading-none text-primary-600">
                    {user?.name?.charAt(0) || user?.email?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs font-medium text-neutral-500 group-hover:text-neutral-700">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 