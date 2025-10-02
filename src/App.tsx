import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignUp } from './pages/SignUp';
import { Login } from './pages/Login';
import { UserDashboard } from './pages/UserDashboard';
import { AdminPanel } from './pages/AdminPanel';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'dashboard' | 'admin'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'signup') {
      return <SignUp onNavigate={setCurrentPage} />;
    }
    return <Login onNavigate={setCurrentPage} />;
  }

  if (profile?.is_admin) {
    return <AdminPanel />;
  }

  return <UserDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
