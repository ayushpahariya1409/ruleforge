import React, { useState } from 'react';
import { HiPlus, HiTrash } from 'react-icons/hi2';
import ConditionLeaf from './ConditionLeaf';
import toast from 'react-hot-toast';

const DEPTH_BORDER_COLORS = ['#6b46c1', '#3182ce', '#38a169', '#dd6b20', '#e53e3e']; // Exactly 5 levels

const ConditionGroup = ({ group, onChange, onRemove, depth = 0, fields = [] }) => {
  const [isActive, setIsActive] = useState(false);

  const handleChildChange = (index, newChild) => {
    const newConditions = [...group.conditions];
    newConditions[index] = newChild;
    onChange({ ...group, conditions: newConditions });
  };

  const handleRemoveChild = (index) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onChange({ ...group, conditions: newConditions });
  };

  const addLeaf = () => {
    if (group.conditions.length >= 15) {
      toast.error('Limit of 15 conditions per group reached');
      return;
    }
    onChange({
      ...group,
      conditions: [...group.conditions, { field: '', operator: '=', value: '' }],
    });
  };

  const addGroup = () => {
    if (depth >= 4) { // Allows depth 0, 1, 2, 3, 4 (Total 5 levels)
      toast.error('Maximum nesting limit of 5 reached');
      return;
    }
    if (group.conditions.length >= 15) {
      toast.error('Limit of 15 items per group reached');
      return;
    }
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        {
          logic: 'AND',
          conditions: [{ field: '', operator: '=', value: '' }],
        },
      ],
    });
  };

  const updateLogic = (value) => {
    onChange({ ...group, logic: value });
  };

  const groupStyle = isActive ? 'bg-violet-100/70' : 'bg-gray-50/50';
  const containerBorderColor = DEPTH_BORDER_COLORS[depth] || '#718096';

  return (
    <div
      className={`relative p-4 rounded-2xl flex flex-col gap-4 ${groupStyle}`}
      style={{ border: `3px solid ${containerBorderColor}` }} // only group border highlighted
      onClick={(e) => {
        e.stopPropagation();
        setIsActive(!isActive);
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-600">
          {depth === 0 ? 'IF' : 'GROUP'}
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addLeaf();
            }}
            className="text-xs flex items-center gap-1 text-primary-500"
          >
            <HiPlus className="w-3.5 h-3.5" />
            Condition
          </button>

          {depth < 4 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addGroup();
              }}
              className="text-xs flex items-center gap-1 text-purple-500"
            >
              <HiPlus className="w-3.5 h-3.5" />
              Group
            </button>
          )}

          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-red-500"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CONDITIONS */}
      <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-200/50">
        {group.conditions.map((child, index) => (
          <div key={index} className="space-y-2">
            {child.logic ? (
              <ConditionGroup
                group={child}
                onChange={(newChild) => handleChildChange(index, newChild)}
                onRemove={() => handleRemoveChild(index)}
                depth={depth + 1}
                fields={fields}
              />
            ) : (
              <ConditionLeaf
                condition={child}
                onChange={(newChild) => handleChildChange(index, newChild)}
                onRemove={() => handleRemoveChild(index)}
                fields={fields}
              />
            )}

            {index < group.conditions.length - 1 && (
              <div className="flex items-center ml-2">
                <select
                  value={group.logic}
                  onChange={(e) => updateLogic(e.target.value)}
                  className="text-xs border rounded px-2 py-1 bg-gray-100"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              </div>
            )}
          </div>
        ))}

        {group.conditions.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Add a condition to start...
          </p>
        )}
      </div>
    </div>
  );
};

export default ConditionGroup;