import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import { 
  HiBars3, 
  HiXMark, 
  HiOutlineUserCircle,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineArrowUpTray,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCog6Tooth
} from 'react-icons/hi2';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: HiOutlineChartBar },
    ...(user?.role === 'admin' ? [{ name: 'Rules', path: '/rules', icon: HiOutlineCog6Tooth }] : []),
    { name: 'Upload', path: '/upload', icon: HiOutlineArrowUpTray },
    { name: 'Results', path: '/results', icon: HiOutlineDocumentText },
  ];

  return (
    <nav className="sticky top-0 z-[60] w-full border-b border-surface-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div data-app-logo="true" className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
              <path d="M2 4l6-3 6 3v8l-6 3-6-3V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M2 4l6 3 6-3M8 7v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-lg font-black text-surface-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Rule<span className="text-primary-600">Forge</span>
          </span>
        </NavLink>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'}
              `}
            >
              <link.icon className="w-4.5 h-4.5" />
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* User Profile & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-surface-50 border border-surface-200">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-surface-700">{user?.name?.split(' ')[0]}</span>
          </div>

          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-surface-500 hover:text-danger-600 hover:bg-danger-50 transition-all border border-transparent hover:border-danger-100"
          >
            <HiOutlineArrowRightOnRectangle className="w-4.5 h-4.5" />
            Logout
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-surface-50 text-surface-600 hover:bg-surface-100 border border-surface-200 transition-all"
          >
            {isOpen ? <HiXMark className="w-6 h-6" /> : <HiBars3 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop Blur/Fade */}
          <div 
            className="fixed inset-0 top-[65px] bg-surface-900/10 backdrop-blur-sm z-[55] animate-fade-in md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Drawer */}
          <div className="absolute top-[65px] left-0 w-full bg-white border-b border-surface-200 shadow-2xl z-[60] animate-slide-down md:hidden">
            <div className="px-4 pt-2 pb-6 space-y-1">
              <div className="px-3 py-4 mb-2 flex items-center gap-4 border-b border-surface-50">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-100">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-surface-900">{user?.name}</p>
                  <p className="text-xs text-surface-500">{user?.email}</p>
                </div>
              </div>

              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100' 
                      : 'text-surface-600 hover:bg-surface-50'}
                  `}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </NavLink>
              ))}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-danger-600 hover:bg-danger-50 transition-all mt-4"
              >
                <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
