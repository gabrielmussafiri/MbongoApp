import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Transactions from './pages/Transactions';
import PendingTransactions from './pages/PendingTransactions';
import SubAccounts from './pages/SubAccounts';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();

  // Layout for authenticated pages only
  const AuthenticatedLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Agents />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Transactions />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending-transactions"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PendingTransactions />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sub-accounts"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <SubAccounts />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App; 