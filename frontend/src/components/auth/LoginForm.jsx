import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError } from '../../store/authSlice';
import Button from '../shared/Button';
import { HiEnvelope, HiLockClosed } from 'react-icons/hi2';
import { HiEye, HiEyeSlash } from 'react-icons/hi2';
import GoogleLoginButton from './GoogleLoginButton';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Real-time validation
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'email') {
      setEmail(value);
      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, email: 'Email is required' }));
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
        setErrors((prev) => ({ ...prev, email: 'Invalid email format' }));
      } else {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
    }

    if (name === 'password') {
      setPassword(value);
      if (!value) {
        setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      } else if (value.length < 6) {
        setErrors((prev) => ({ ...prev, password: 'At least 8 characters required' }));
      } else {
        setErrors((prev) => ({ ...prev, password: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    // Final validation before submit
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="card p-7 space-y-5">
        {error && (
          <div className="p-3 text-sm font-medium text-danger-600 bg-danger-50 border border-danger-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="label-text">Email Address</label>
          <div className="relative">
            <HiEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
            <input
              type="email"
              name="email"
              className={`input-field pl-10 ${errors.email ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''}`}
              placeholder="name@company.com"
              value={email}
              onChange={handleChange}
              required
            />
          </div>
          {errors.email && <p className="text-danger-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="label-text">Password</label>
          <div className="relative">
            <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              {showPassword ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-danger-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-surface-400">Or continue with</span>
          </div>
        </div>

        <GoogleLoginButton />

        <p className="text-center text-sm text-surface-500 mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;