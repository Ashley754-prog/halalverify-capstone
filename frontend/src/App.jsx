import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userRole, setUserRole] = useState(null); // 'admin' | 'user' | null
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // auto-close sidebar on smaller screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Monitor network connectivity in real-time
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

  // Called by Login with (view, role). For non-login nav (forgot-password, create-account),
  // role will be null — we just navigate without changing the role.
  const handleLogin = (view, role) => {
    if (role !== null) setUserRole(role);
    setCurrentView(view);
  };

  const handleSignOut = () => {
    setUserRole(null);
    setCurrentView('login');
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
        // Route guard: non-admins cannot access this page
        return userRole === 'admin' ? <Analytics /> : <Dashboard userRole={userRole} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard userRole={userRole} />;
    }
  };

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

  return (
    <Sidebar
      currentView={currentView}
      onViewChange={setCurrentView}
      userRole={userRole}
      onSignOut={handleSignOut}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
    >
      <AppTopbar isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-center py-2 text-xs font-bold tracking-wide shadow-inner animate-pulse flex items-center justify-center gap-2">
          <AlertTriangle size={14} /> Operating in Local Offline Mode. Cloud AI scans are suspended; local models and cached Zamboanga databases remain operational.
        </div>
      )}
      {renderContent()}
    </Sidebar>
  );
}