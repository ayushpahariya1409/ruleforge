import React, { useState, useEffect } from 'react';
import { HiTrash, HiExclamationCircle } from 'react-icons/hi2';
import { OPERATORS } from '../../utils/constants';
import { validateConditionValue } from '../../utils/validation';

const CATEGORY_COLORS = {
  users:    'text-blue-600 font-bold',
  products: 'text-emerald-600 font-bold',
  orders:   'text-primary-700 font-bold',
};

const ConditionLeaf = ({ condition, onChange, onRemove, fields = [] }) => {
  const [error, setError] = useState('');

  // Get the selected field's data type
  const selectedField = fields.find(f => f.fieldName === condition.field);
  const fieldDataType = selectedField?.dataType || 'string';

  useEffect(() => {
    if (condition.value) {
      const msg = validateConditionValue(condition.value, fieldDataType, condition.field);
      setError(msg);
    } else {
      setError('');
    }
  }, [condition.value, fieldDataType, condition.field]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Reset operator if it becomes invalid for the new field
    if (name === 'field') {
      const newField = fields.find(f => f.fieldName === value);
      const newType = newField?.dataType || 'string';
      if ((newType === 'string' || newType === 'email' || newType === 'boolean') && 
          ['>', '<', '>=', '<='].includes(condition.operator)) {
        onChange({ ...condition, [name]: value, operator: '=' });
        return;
      }
    }

    onChange({ ...condition, [name]: newValue });
  };

  const handleNumberKeyDown = (e) => {
    const isIntegerOnly = (condition.field || '').toLowerCase().match(/age|quantity|stock|id/);
    
    // Always block these
    if (['+', '-', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
      return;
    }

    // Block decimal point for integer-only fields
    if (e.key === '.' && isIntegerOnly) {
      e.preventDefault();
    }
  };

  const isOperatorDisabled = (opValue) => {
    if (fieldDataType === 'string' || fieldDataType === 'email' || fieldDataType === 'boolean') {
      return ['>', '<', '>=', '<='].includes(opValue);
    }
    return false;
  };

  // Build field options from selected columns (array of { fieldName, category, dataType })
  const fieldOptions = fields.length > 0
    ? fields.map((f) => ({
        value: f.fieldName || f,
        label: f.fieldName || f,
        category: f.category || '',
      }))
    : [];

  // Group by category for a nicer dropdown
  const groupedOptions = {};
  fieldOptions.forEach(f => {
    const cat = f.category || 'other';
    if (!groupedOptions[cat]) groupedOptions[cat] = [];
    groupedOptions[cat].push(f);
  });
  const hasCategories = Object.keys(groupedOptions).some(k => k !== 'other');

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 group animate-slide-up">
      <div className="flex-1 min-w-[150px]">
        <select
          name="field"
          className="select-field text-sm py-2"
          value={condition.field || ''}
          onChange={handleChange}
        >
          <option value="">Select Field</option>
          {hasCategories ? (
            Object.entries(groupedOptions).map(([cat, opts]) => (
              <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                {opts.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </optgroup>
            ))
          ) : (
            fieldOptions.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))
          )}
        </select>
      </div>

      <div className="w-[180px]">
        <select
          name="operator"
          className="select-field text-sm py-2"
          value={condition.operator || '='}
          onChange={handleChange}
        >
          {OPERATORS.map((op) => (
            <option 
              key={op.value} 
              value={op.value}
              disabled={isOperatorDisabled(op.value)}
              className={isOperatorDisabled(op.value) ? 'text-gray-400' : ''}
            >
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[200px] relative">
        {fieldDataType === 'date' ? (
          <input
            type="date"
            name="value"
            className="input-field text-sm py-2"
            placeholder="YYYY-MM-DD"
            value={condition.value ?? ''}
            onChange={handleChange}
            title="Choose a date or type in YYYY-MM-DD format (e.g., 2024-12-31)"
          />
        ) : fieldDataType === 'email' ? (
          <input
            type="email"
            name="value"
            className="input-field text-sm py-2"
            placeholder="email@example.com"
            value={condition.value ?? ''}
            onChange={handleChange}
          />
        ) : fieldDataType === 'number' ? (
          <input
            type="number"
            name="value"
            className="input-field text-sm py-2"
            placeholder="e.g., 100"
            value={condition.value ?? ''}
            onChange={handleChange}
            onKeyDown={handleNumberKeyDown}
            title="Enter a numeric value (e.g., Age, Price, or Quantity)"
          />
        ) : fieldDataType === 'boolean' ? (
          <select
            name="value"
            className="select-field text-sm py-2"
            value={condition.value ?? ''}
            onChange={handleChange}
          >
            <option value="">Select Value</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : (
          <input
            type="text"
            name="value"
            className="input-field text-sm py-2"
            placeholder={
              fieldDataType === 'email' ? 'email@example.com' : 
              condition.field?.toLowerCase().includes('category') ? 'e.g., Electronics' :
              condition.field?.toLowerCase().includes('status') ? 'e.g., Active' :
              'Enter value...'
            }
            value={condition.value ?? ''}
            onChange={handleChange}
            pattern={
              fieldDataType === 'email' ? '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$' :
              undefined
            }
            title={
              fieldDataType === 'email' ? 'Enter a valid email address' : 
              'Enter the text value to compare against'
            }
          />
        )}

        {/* Live Validation Popup */}
        {error && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 animate-bounce-subtle">
            <div className="bg-danger-500 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl border border-white/20 flex items-center gap-2 whitespace-nowrap">
              <HiExclamationCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute -top-1.5 left-4 w-3 h-3 bg-danger-500 rotate-45 border-l border-t border-white/20" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title="Remove condition"
      >
        <HiTrash className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ConditionLeaf;
