import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-surface-400" />
        </div>
      )}
      <h3 className="text-lg font-bold text-surface-800 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-surface-400 text-center max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
};

export default EmptyState;
