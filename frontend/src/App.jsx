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
import ProfilePage from './pages/ProfilePage.jsx';
import ProductsCatalog from './pages/ProductsCatalog.jsx';
import EstablishmentsMap from './pages/EstablishmentsMap.jsx';
import VerificationQueue from './pages/VerificationQueue.jsx';
import LandingPage from './pages/LandingPage.jsx';
import { supabase } from './lib/supabaseClient';
import { AUTH_VIEWS, fetchUserRole, signOut } from './lib/auth';
import { API_BASE_URL } from './utils/api';

const VALID_VIEWS = new Set([
  'landing',
  'profile',
  'dashboard',
  'scanner',
  'products',
  'map',
  'registry',
  'scan-history',
  'report-issue',
  'verification-queue',
  'analytics',
  'settings',
  'login',
  'create-account',
  'forgot-password',
  'reset-password',
]);

const getInitialView = () => {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.replace('#', '').trim();
  if (hash && VALID_VIEWS.has(hash)) {
    return hash;
  }
  return 'landing';
};

export default function App() {
  const [currentView, setCurrentView] = useState(getInitialView);
  const [viewParams, setViewParams] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Silently warm up the Render backend container in the background
    fetch(`${API_BASE_URL}/health`).catch(() => {});
  }, []);

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

  const handleViewChange = useCallback((view, params = {}, pushHistory = true) => {
    // In-app back action: pops browser history if available, else falls back to landing
    if (view === 'back') {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
        return;
      }
      view = 'landing';
    }

    if (view === 'profile' && !userRole) {
      view = 'login';
    }

    if (view === 'analytics' && userRole !== 'admin') {
      view = 'dashboard';
    }

    if (view === 'verification-queue' && userRole !== 'admin') {
      view = 'dashboard';
    }

    setViewParams(params || {});
    setCurrentView(view);

    // Push into browser history so back button navigates between in-app views without exiting to Google
    if (pushHistory && typeof window !== 'undefined') {
      const hash = view === 'landing' ? '' : `#${view}`;
      const url = hash ? `${window.location.pathname}${hash}` : window.location.pathname;
      window.history.pushState({ view, params: params || {} }, '', url);
    }
  }, [userRole]);

  // Synchronize browser Back / Forward buttons with in-app views via popstate
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.view && VALID_VIEWS.has(e.state.view)) {
        handleViewChange(e.state.view, e.state.params || {}, false);
      } else {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash && VALID_VIEWS.has(hash)) {
          handleViewChange(hash, {}, false);
        } else {
          handleViewChange('landing', {}, false);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleViewChange]);

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
        handleViewChange('reset-password', {}, true);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUserRole(null);
        handleViewChange('landing', {}, true);
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
  }, [restoreAuthenticatedUser, handleViewChange]);

  const handleLogin = (view, role) => {
    if (role !== null) {
      setUserRole(role);
    }
    handleViewChange(view, {}, true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Clear local state even if the remote sign-out request fails.
    } finally {
      setUserRole(null);
      handleViewChange('landing', {}, true);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onViewChange={handleViewChange} userRole={userRole} />;
      case 'profile':
        return <ProfilePage onViewChange={handleViewChange} />;
      case 'dashboard':
        return <Dashboard userRole={userRole} onViewChange={handleViewChange} />;
      case 'scanner':
        return <Scanner isOnline={isOnline} onViewChange={handleViewChange} />;
      case 'products':
        return (
          <ProductsCatalog
            userRole={userRole}
            onViewChange={handleViewChange}
            initialSearchQuery={viewParams.searchQuery || ''}
          />
        );
      case 'map':
        return <EstablishmentsMap userRole={userRole} onViewChange={handleViewChange} />;
      case 'registry':
        return <Registry userRole={userRole} onViewChange={handleViewChange} />;
      case 'scan-history':
        return <ScanHistory userRole={userRole} onViewChange={handleViewChange} />;
      case 'report-issue':
        return <ReportIssue userRole={userRole} onViewChange={handleViewChange} />;
      case 'verification-queue':
        return userRole === 'admin' ? (
          <VerificationQueue userRole={userRole} onViewChange={handleViewChange} />
        ) : (
          <Dashboard userRole={userRole} onViewChange={handleViewChange} />
        );
      case 'analytics':
        return userRole === 'admin' ? (
          <Analytics onViewChange={handleViewChange} />
        ) : (
          <Dashboard userRole={userRole} onViewChange={handleViewChange} />
        );
      case 'settings':
        return <Settings onViewChange={handleViewChange} />;
      default:
        return <Dashboard userRole={userRole} onViewChange={handleViewChange} />;
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

  if (currentView === 'landing') {
    return <LandingPage onViewChange={handleViewChange} userRole={userRole} />;
  }

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} onViewChange={handleViewChange} layout="login" />;
  }

  if (currentView === 'create-account') {
    return <CreateAccount onViewChange={handleViewChange} layout="create" />;
  }

  if (currentView === 'forgot-password') {
    return <ForgotPassword onViewChange={handleViewChange} />;
  }

  if (currentView === 'reset-password') {
    return <ResetPassword onViewChange={handleViewChange} />;
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
      <AppTopbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onProfileClick={() => handleViewChange('profile')}
        userRole={userRole}
        onSignInClick={() => handleViewChange('login')}
        onLogoClick={() => handleViewChange('landing')}
      />
      {!isOnline && (
        <div className="bg-amber-600 text-white text-center py-2 text-xs font-bold tracking-wide shadow-inner animate-pulse flex items-center justify-center gap-2">
          <AlertTriangle size={14} /> You are offline. Scanning and database lookups are unavailable until the connection returns.
        </div>
      )}
      {renderContent()}
    </Sidebar>
  );
}
