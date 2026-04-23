import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate]);
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-100/40 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-50/60 blur-[120px]" />
      </div>

      <div className="z-10 w-full animate-fade-in">
        {/* Branding */}
        <div className="text-center mb-8">
          <div data-app-logo="true" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 shadow-lg shadow-primary-200 mb-4">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-white">
              <path d="M2 4l6-3 6 3v8l-6 3-6-3V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M2 4l6 3 6-3M8 7v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
            Rule<span className="text-primary-600">Forge</span>
          </h1>
          <p className="text-surface-400 text-sm mt-1">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
      
      <footer className="mt-10 text-center text-surface-400 text-xs z-10">
        © 2026 RuleForge · Order Evaluation Engine
      </footer>
    </div>
  );
};

export default LoginPage;
