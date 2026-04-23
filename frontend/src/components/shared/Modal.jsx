import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFull = size === 'full';

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  const modalContent = isFull ? (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex-none w-full flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-white z-30 shadow-sm">
        <h2 className="text-xl font-black text-surface-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all"
        >
          <HiXMark className="w-6 h-6" />
        </button>
      </div>
      
      {/* Body Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 min-h-0">
        <div className="max-w-7xl mx-auto w-full pb-12">
          {children}
        </div>
      </div>

      {/* Fixed Footer */}
      {footer && (
        <div className="flex-none w-full px-6 pt-3 pb-5 border-t border-surface-100 bg-white z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto w-full flex justify-end">
            {footer}
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div
        className={`relative ${sizes[size]} w-full bg-white rounded-2xl shadow-2xl border border-surface-200/60 flex flex-col overflow-hidden max-h-[92vh] animate-scale-in`}
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="text-lg font-bold text-surface-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-50 transition-colors"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-surface-100 flex justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
