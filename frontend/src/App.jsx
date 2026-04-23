import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { fetchCurrentUser } from './store/authSlice';

// Layout & Guards
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './guards/ProtectedRoute';
import AdminRoute from './guards/AdminRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RulesPage from './pages/RulesPage';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import DashboardPage from './pages/DashboardPage';
import ErrorBoundary from './components/shared/ErrorBoundary';

const SplashScreen = ({ isExiting, isAuthenticated }) => {
  const logoRef = useRef(null);

  useEffect(() => {
    // Only perform the dynamic glide if we're on a page with a logo target (Login/Register)
    // We detect this by checking if the user is NOT authenticated (since they'd be on the login page)
    if (isExiting && logoRef.current && !isAuthenticated) {
      const targetEl = document.querySelector('[data-app-logo="true"]');
      if (targetEl) {
        const startRect = logoRef.current.getBoundingClientRect();
        const endRect = targetEl.getBoundingClientRect();
        const deltaX = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
        const deltaY = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);
        const scale = endRect.width / startRect.width;
        logoRef.current.style.setProperty('--target-x', `${deltaX}px`);
        logoRef.current.style.setProperty('--target-y', `${deltaY}px`);
        logoRef.current.style.setProperty('--target-scale', `${scale}`);
      }
    }
  }, [isExiting]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden ${isExiting ? 'animate-splash-fade' : 'bg-white'}`}>
      <div 
        ref={logoRef}
        className={`relative mb-6 ${isExiting && !isAuthenticated ? 'animate-logo-dynamic-glide' : isExiting ? 'opacity-0 transition-opacity duration-300' : ''}`}
        style={{ '--target-x': '0px', '--target-y': '0px', '--target-scale': '1' }}
      >
        <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center shadow-2xl">
          <svg width="40" height="40" viewBox="0 0 16 16" fill="none" className="text-white">
            <path d="M2 4l6-3 6 3v8l-6 3-6-3V4z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            <path d="M2 4l6 3 6-3M8 7v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <div className={`text-center ${isExiting ? 'opacity-0 transition-opacity duration-300' : ''}`}>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
          Rule<span className="text-primary-600">Forge</span>
        </h1>
        <p className="mt-2 text-surface-400 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
};

const AppContent = () => {
  const dispatch = useDispatch();
  const { isInitialized, isAuthenticated } = useSelector((state) => state.auth);
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showSplash]);

  useEffect(() => {
    if (isInitialized) {
      // Start exit sequence with a slight delay for atmosphere
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 400);

      // Remove splash from DOM after the long 1.4s animation completes
      const removeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 1900);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [isInitialized]);

  return (
    <>
      {showSplash && <SplashScreen isExiting={isExiting} isAuthenticated={isAuthenticated} />}
      
      <div className={`min-h-screen ${isExiting ? 'animate-cinematic-reveal' : 'opacity-0'}`}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/schema" element={<Navigate to="/dashboard" replace />} />
                <Route element={<AdminRoute />}>
                  <Route path="/rules" element={<RulesPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={
              <div className="p-8">
                <h1 className="text-3xl font-bold mb-4">404 — Not Found</h1>
                <p className="text-gray-800">The page you are looking for does not exist.</p>
              </div>
            } />
          </Routes>
        </Router>
      </div>
    </>
  );
};

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#4f46e5',
                secondary: '#ffffff',
              },
            },
          }} />
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
