import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLoginUser } from '../../store/authSlice';

const GoogleLoginButton = () => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isInitialized = useRef(false);

  useEffect(() => {
    const handleCredentialResponse = async (response) => {
      if (!response.credential) return;
      const result = await dispatch(googleLoginUser(response.credential));
      if (googleLoginUser.fulfilled.match(result)) {
        navigate('/dashboard');
      }
    };

    const renderButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current || !wrapperRef.current) return;
      if (isInitialized.current) return;

      // Clear any previous attempts
      containerRef.current.innerHTML = '';

      // Measure available width — use a fallback of 280 which fits iPhone SE
      const availableWidth = wrapperRef.current.offsetWidth || 280;
      // Clamp to Google's allowed range (200-400)
      const buttonWidth = Math.min(Math.max(availableWidth, 200), 400);

      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: buttonWidth,
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
        });

        isInitialized.current = true;
      } catch (err) {
        console.error('Google Button Render Error:', err);
      }
    };

    // Use a small timeout to ensure layout is settled before measuring
    const initTimer = setTimeout(() => {
      if (window.google?.accounts?.id) {
        renderButton();
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderButton;
        document.head.appendChild(script);
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      isInitialized.current = false;
    };
  }, [dispatch, navigate]);

  return (
    <div ref={wrapperRef} className="w-full flex justify-center py-1">
      <div ref={containerRef} className="min-h-[44px]" />
    </div>
  );
};

export default GoogleLoginButton;
