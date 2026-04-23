
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearError } from '../../store/authSlice';
import Button from '../shared/Button';
import { HiUser, HiEnvelope, HiLockClosed } from 'react-icons/hi2';
import { HiEye, HiEyeSlash } from 'react-icons/hi2';
import GoogleLoginButton from './GoogleLoginButton';

const RegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasAlphabet: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Create updated form data first
    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedFormData);
    dispatch(clearError());
    let errorMsg = '';

    // Name validation
    if (name === 'name') {
      if (!value.trim()) {
        errorMsg = 'Name is required';
      } else if (!/^[A-Za-z\s]{2,50}$/.test(value)) {
        errorMsg = 'Only letters & spaces (2-50 chars)';
      }
    }

    // Email validation
    if (name === 'email') {
      if (!value) {
        errorMsg = '';
      }
      else if (!value.trim()) {
        errorMsg = 'Email is required';
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z]+(\.[a-zA-Z]+)+$/.test(value)) {
        errorMsg = 'Invalid email format';
      }
    }

    // Password validation
    if (name === 'password') {
      if (!value) {
        errorMsg = 'Password is required';
      } else if (value.length < 6) {
        errorMsg = 'At least 6 characters required';
      }

      // 🔥 Revalidate confirm password when password changes
      if (updatedFormData.confirmPassword) {
        if (value !== updatedFormData.confirmPassword) {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords don't match",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: '',
          }));
        }
      }
    }

    // Confirm password validation
    if (name === 'confirmPassword') {
      if (!value) {
        errorMsg = 'Confirm your password';
      } else if (value !== updatedFormData.password) {
        errorMsg = "Passwords don't match";
      }
    }
    if (name === 'password') {
      const rules = {
        minLength: value.length >= 8,
        hasNumber: /\d/.test(value),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        hasAlphabet: /[A-Za-z]/.test(value),
      };

      setPasswordRules(rules);

      // Optional: show general error under input
      if (!value) {
        errorMsg = '';
      } else if (
        !rules.minLength ||
        !rules.hasNumber ||
        !rules.hasSpecialChar ||
        !rules.hasAlphabet
      ) {
        errorMsg = 'Password must contain';
      }
    }
    // Update errors
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    setErrors({}); // clear previous errors

    const result = await dispatch(registerUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: 'user', // enforce user role
    }));

    if (registerUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form
        onSubmit={handleSubmit}
        className="card p-7 space-y-5"
      >
        {error && (
          <div className="p-3 text-sm font-medium text-danger-600 bg-danger-50 border border-danger-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="label-text">Full Name</label>
          <div className="relative">
            <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              className={`input-field pl-10 ${errors.name ? 'border-danger-400' : ''}`}
              required
            />
          </div>
          {errors.name && <p className="text-danger-500 text-xs mt-1.5 font-medium">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="label-text">Email Address</label>
          <div className="relative">
            <HiEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              className={`input-field pl-10 ${errors.email ? 'border-danger-400' : ''}`}
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
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-400' : ''}`}
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
          {formData.password &&
            !(passwordRules.minLength &&
              passwordRules.hasNumber &&
              passwordRules.hasSpecialChar &&
              passwordRules.hasAlphabet) && (
              <div className="mt-2.5 space-y-1">
                <p className={`text-xs font-medium ${passwordRules.minLength ? "text-success-600" : "text-surface-400"}`}>
                  {passwordRules.minLength ? '✓' : '○'} At least 8 characters
                </p>
                <p className={`text-xs font-medium ${passwordRules.hasAlphabet ? "text-success-600" : "text-surface-400"}`}>
                  {passwordRules.hasAlphabet ? '✓' : '○'} At least 1 letter
                </p>
                <p className={`text-xs font-medium ${passwordRules.hasNumber ? "text-success-600" : "text-surface-400"}`}>
                  {passwordRules.hasNumber ? '✓' : '○'} At least 1 number
                </p>
                <p className={`text-xs font-medium ${passwordRules.hasSpecialChar ? "text-success-600" : "text-surface-400"}`}>
                  {passwordRules.hasSpecialChar ? '✓' : '○'} At least 1 special character
                </p>
              </div>
            )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label-text">Confirm Password</label>
          <div className="relative">
            <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-danger-400' : ''}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              {showConfirmPassword ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-danger-500 text-xs mt-1.5 font-medium">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
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
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
