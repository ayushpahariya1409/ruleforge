import React from 'react';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import { formatDate } from '../../utils/formatters';

const RuleCard = ({ rule, onEdit, onDelete, onStatusToggle }) => {
  const countConditions = (node) => {
    if (!node.conditions) return 1;
    return node.conditions.reduce((acc, curr) => acc + countConditions(curr), 0);
  };

  const conditionCount = countConditions(rule.conditions);

  return (
    <div className="card-hover animate-slide-up group relative overflow-hidden">
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${rule.isActive ? 'bg-success-500' : 'bg-surface-300'}`} />

      <div className="p-5 pl-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-surface-900 group-hover:text-primary-600 transition-colors truncate">
              {rule.ruleName}
            </h3>
            <p className="text-sm text-surface-400 line-clamp-2 mt-1 leading-relaxed">
              {rule.description || 'No description provided.'}
            </p>
          </div>

          {/* Actions — High visibility */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => onEdit(rule)}
              className="p-2 rounded-lg text-surface-900 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Edit Rule"
            >
              <HiOutlinePencil className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => onDelete(rule)}
              className="p-2 rounded-lg text-danger-600 hover:text-danger-700 hover:bg-danger-50 transition-colors"
              title="Delete Rule"
            >
              <HiOutlineTrash className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-4 text-xs text-surface-400 mb-4">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            {conditionCount} condition{conditionCount !== 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span>{formatDate(rule.createdAt)}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] text-primary-700 font-bold">
              {rule.createdBy?.name?.charAt(0) || 'A'}
            </div>
            <span className="text-xs text-surface-400">
              {rule.createdBy?.name || 'Admin'}
            </span>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => onStatusToggle(rule._id, !rule.isActive)}
            className="toggle-switch"
            data-active={rule.isActive ? 'true' : 'false'}
            title={rule.isActive ? 'Deactivate rule' : 'Activate rule'}
          >
            <span className="toggle-dot" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleCard;
