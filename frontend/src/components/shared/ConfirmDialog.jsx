import React from 'react';
import { createPortal } from 'react-dom';
import { HiExclamationTriangle, HiXMark } from 'react-icons/hi2';
import Button from './Button';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onSecondary, 
  title, 
  message, 
  details = [], 
  confirmText = 'Confirm', 
  secondaryText, 
  variant = 'danger', 
  loading = false 
}) => {
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Dialog Box */}
      <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl animate-scale-in border border-surface-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-surface-900 flex items-center gap-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'danger' ? 'bg-danger-50 text-danger-600' : 'bg-primary-50 text-primary-600'}`}>
              <HiExclamationTriangle className="w-6 h-6" />
            </div>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-all">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="px-6 py-6 font-medium text-surface-600">
          <p className="text-sm leading-relaxed mb-4">{message}</p>

          {details.length > 0 && (
            <div className="bg-surface-50 border border-surface-100 rounded-2xl p-4 mb-2 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">Affected Items</p>
              <ul className="space-y-2">
                {details.map((item, idx) => (
                  <li key={idx} className="text-sm text-surface-700 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${variant === 'danger' ? 'bg-danger-500' : 'bg-primary-500'}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-50/50 border-t border-surface-100 flex flex-col sm:flex-row items-center gap-3">
          {secondaryText ? (
            <button
              onClick={onSecondary}
              className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-white text-danger-600 border border-danger-100 font-bold text-sm hover:bg-danger-50 transition-all order-2 sm:order-1"
            >
              {secondaryText}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-white text-surface-700 font-bold text-sm hover:bg-surface-100 transition-all border border-surface-200 order-2 sm:order-1"
            >
              Cancel
            </button>
          )}
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            className={`w-full sm:flex-1 h-11 font-bold order-1 sm:order-2 ${variant === 'danger' ? 'shadow-lg shadow-danger-200' : 'shadow-lg shadow-primary-200'}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ConfirmDialog;
