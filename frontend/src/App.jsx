import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import Login from "./auth/Login.jsx";
import CreateAccount from "./auth/CreateAccount.jsx";
import ForgotPassword from "./auth/ForgotPassword.jsx";
import ResetPassword from "./auth/ResetPassword.jsx";
import Sidebar from './components/layouts/Sidebar.jsx';
import { AppTopbar } from './components/layouts/Topbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Scanner from './pages/Scanner.jsx';
import Registry from './pages/Registry.jsx';
import ScanHistory from './pages/ScanHistory.jsx';
import ReportIssue from './pages/ReportIssue.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import { supabase } from './lib/supabaseClient';
import { AUTH_VIEWS, fetchUserRole, signOut } from './lib/auth';

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userRole, setUserRole] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const restoreAuthenticatedUser = useCallback(async (userId) => {
    const role = await fetchUserRole(userId);
    if (!role) {
      setUserRole(null);
      return false;
    }

    setUserRole(role);
    setCurrentView((prev) => (AUTH_VIEWS.has(prev) ? 'dashboard' : prev));
    return true;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && isMounted) {
        await restoreAuthenticatedUser(session.user.id);
      }

      if (isMounted) {
        setAuthLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setCurrentView('reset-password');
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUserRole(null);
        setCurrentView('login');
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        await restoreAuthenticatedUser(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [restoreAuthenticatedUser]);

  const handleLogin = (view, role) => {
    if (role !== null) {
      setUserRole(role);
    }
    setCurrentView(view);
  };

  const handleViewChange = (view) => {
    if (!AUTH_VIEWS.has(view) && !userRole) {
      setCurrentView('login');
      return;
    }

    if (view === 'analytics' && userRole !== 'admin') {
      setCurrentView('dashboard');
      return;
    }

    setCurrentView(view);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Clear local state even if the remote sign-out request fails.
    } finally {
      setUserRole(null);
      setCurrentView('login');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard userRole={userRole} />;
      case 'scanner':
        return <Scanner isOnline={isOnline} />;
      case 'registry':
        return <Registry userRole={userRole} />;
      case 'scan-history':
        return <ScanHistory userRole={userRole} />;
      case 'report-issue':
        return <ReportIssue />;
      case 'analytics':
        return userRole === 'admin' ? <Analytics /> : <Dashboard userRole={userRole} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard userRole={userRole} />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 px-6 py-4 text-sm font-semibold text-slate-200">
          Restoring your session...
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} layout="login" />;
  }

  if (currentView === 'create-account') {
    return <CreateAccount onViewChange={setCurrentView} layout="create" />;
  }

  if (currentView === 'forgot-password') {
    return <ForgotPassword onViewChange={setCurrentView} />;
  }

  if (currentView === 'reset-password') {
    return <ResetPassword onViewChange={setCurrentView} />;
  }

  if (!userRole) {
    return <Login onLogin={handleLogin} layout="login" />;
  }

  return (
    <Sidebar
      currentView={currentView}
      onViewChange={handleViewChange}
      userRole={userRole}
      onSignOut={handleSignOut}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
    >
      <AppTopbar isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
      {!isOnline && (
        <div className="bg-amber-600 text-white text-center py-2 text-xs font-bold tracking-wide shadow-inner animate-pulse flex items-center justify-center gap-2">
          <AlertTriangle size={14} /> Operating in Local Offline Mode. Cloud AI scans are suspended; local models and cached Zamboanga databases remain operational.
        </div>
      )}
      {renderContent()}
    </Sidebar>
  );
}
