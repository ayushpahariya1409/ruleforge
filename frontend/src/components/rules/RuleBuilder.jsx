import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  HiCheck,
  HiPlay,
  HiDocumentDuplicate,
  HiPlus,
  HiXMark,
  HiOutlineSquare3Stack3D,
  HiChevronRight,
} from 'react-icons/hi2';

import ConditionGroup from './ConditionGroup';
import Button from '../shared/Button';
import Spinner from '../shared/Spinner';
import { useTestRule } from '../../hooks/useRules';
import { useSchemaGrouped } from '../../hooks/useSchema';
import toast from 'react-hot-toast';
import { validateConditionValue } from '../../utils/validation';
import ColumnPicker from '../rules/CoulmnPicker';
import Modal from '../shared/Modal';

const CATEGORY_STYLES = {
  users: {
    label: 'Users',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  products: {
    label: 'Products',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  orders: {
    label: 'Orders',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/30',
    dot: 'bg-primary-400',
  },
};

/* ─── Selected Columns Chips ────────────────────────────────────── */
const SelectedColumnsBar = ({ columns, onRemove }) => (
  <div className="flex flex-wrap items-center gap-2 p-3 bg-white/60 rounded-xl border border-gray-200/40">
    <span className="text-xs font-bold text-gray-800 uppercase tracking-widest mr-1">
      Rule Parameters:
    </span>

    {columns.map((col) => {
      const style = CATEGORY_STYLES[col.category] || CATEGORY_STYLES.orders;

      return (
        <span
          key={`${col.category}-${col.fieldName}`}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${style.bg} ${style.color} border ${style.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {col.fieldName}

          <button
            type="button"
            onClick={() => onRemove(col)}
            className="ml-1 hover:opacity-70"
          >
            <HiXMark className="w-3 h-3" />
          </button>
        </span>
      );
    })}
  </div>
);

/* ─── Main RuleBuilder ───────────────────────────────────────────── */
const RuleBuilder = forwardRef(({
  rule = null,
  onSave,
  onDirtyChange, 
  preSelectedColumns = [],
}, ref) => {
  const { data: grouped, isLoading: schemaLoading } = useSchemaGrouped();
  const testMutation = useTestRule();

  const extractFieldsFromConditions = (node) => {
    if (!node) return [];
    if (node.field) return [node.field];
    if (node.conditions)
      return node.conditions.flatMap(extractFieldsFromConditions);
    return [];
  };

  const buildInitialColumns = () => {
    if (!rule?.conditions) return [];
    const fieldNames = [
      ...new Set(extractFieldsFromConditions(rule.conditions)),
    ];

    if (!grouped) {
      return fieldNames.map((f) => ({
        fieldName: f,
        category: 'orders',
        dataType: 'string',
        dot: 'bg-primary-400',
      }));
    }

    return fieldNames.map((fieldName) => {
      for (const cat of ['users', 'products', 'orders']) {
        const found = grouped[cat]?.find((f) => f.fieldName === fieldName);
        if (found)
          return {
            fieldName,
            category: cat,
            dataType: found.dataType,
          };
      }
      return {
        fieldName,
        category: 'orders',
        dataType: 'string',
      };
    });
  };

  const [selectedColumns, setSelectedColumns] = useState(
    rule ? buildInitialColumns() : preSelectedColumns
  );

  const [ruleName, setRuleName] = useState(rule?.ruleName || '');
  const [description, setDescription] = useState(rule?.description || '');

  const [conditions, setConditions] = useState(
    rule?.conditions || {
      logic: 'AND',
      conditions: [{ field: '', operator: '=', value: '' }],
    }
  );

  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);

  const [initialData] = useState({
    ruleName: rule?.ruleName || '',
    description: rule?.description || '',
    conditions: JSON.stringify(rule?.conditions || { logic: 'AND', conditions: [{ field: '', operator: '=', value: '' }] }),
    selectedColumns: JSON.stringify(selectedColumns)
  });

  const isDirty = ruleName !== initialData.ruleName || 
                  description !== initialData.description || 
                  JSON.stringify(conditions) !== initialData.conditions ||
                  JSON.stringify(selectedColumns) !== initialData.selectedColumns;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSave = () => {
    if (!ruleName.trim()) {
      toast.error('Rule name is required.');
      return;
    }

    if (selectedColumns.length === 0) {
      toast.error('At least one column is required.');
      return;
    }

    const validateRuleTree = (node) => {
      if (node.logic) {
        for (const child of node.conditions) {
          const error = validateRuleTree(child);
          if (error) return error;
        }
        return '';
      }

      const fieldType = getFieldDataType(node.field);
      return validateConditionValue(node.value, fieldType, node.field);
    };

    const validationError = validateRuleTree(conditions);
    if (validationError) {
      toast.error(`Validation Error: ${validationError}`);
      return;
    }

    onSave({
      ruleName,
      description,
      conditions,
    });
  };

  useImperativeHandle(ref, () => ({
    save: handleSave
  }));

  const handleTest = async () => {
    try {
      const parsed = JSON.parse(sampleData);
      const result = await testMutation.mutateAsync({
        conditions,
        sampleData: parsed,
      });

      const res = result.data.data.result;

      if (res.matched) {
        toast.success(`✅ MATCH — ${res.summary}`, { duration: 5000 });
      } else {
        toast.error(`❌ NO MATCH — ${res.summary}`, {
          duration: 5000,
        });
      }
    } catch (err) {
      toast.error(
        err.name === 'SyntaxError'
          ? 'Invalid JSON in sandbox — check your sample data.'
          : 'Test failed. Please try again.'
      );
    }
  };

  const renderExplanation = (cond) => {
    if (!cond) return null;
    if (cond.logic) {
      return (
        <>
          <span className="text-purple-600">(</span>
          {cond.conditions.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span className="text-blue-600 font-bold">
                  {' '}
                  {cond.logic}{' '}
                </span>
              )}
              {renderExplanation(c)}
            </React.Fragment>
          ))}
          <span className="text-purple-600">)</span>
        </>
      );
    }
    return cond.field && cond.value !== undefined ? (
      <span>
        <span className="text-green-600">{cond.field}</span>{' '}
        {cond.operator}{' '}
        <span className="text-orange-600">
          {JSON.stringify(cond.value)}
        </span>
      </span>
    ) : null;
  };

  const explanationContent =
    renderExplanation(conditions) || (
      <span className="text-gray-500">No conditions defined yet.</span>
    );

  if (schemaLoading) {
    return (
      <div className="py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasNoSchema =
    !grouped ||
    Object.values(grouped).every((arr) => arr.length === 0);

  if (hasNoSchema) {
    return (
      <div className="py-16 text-center">
        <HiOutlineSquare3Stack3D className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800">
          No Fields Available
        </h3>
      </div>
    );
  }

  /* ─── UI ───────────────────────────────────────────── */
  return (
    <>
      <div className="space-y-6">
        {/* Rule Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label-text">Rule Name</label>
            <input
              type="text"
              placeholder="e.g. High Value Premium Order"
              className="input-field"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>

          <div>
            <label className="label-text">Description</label>
            <input
              type="text"
              placeholder="Short summary of what this rule checks"
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Selected Columns Display */}
        {selectedColumns.length > 0 && (
          <div>
            <label className="label-text mb-2 block text-[11px] font-black uppercase tracking-widest text-surface-400">
              Selected Rule Parameters
            </label>
            <SelectedColumnsBar
              columns={selectedColumns}
              onRemove={handleRemoveColumn}
            />
          </div>
        )}

        {/* Add Column Button */}
        <div>
          <button
            type="button"
            onClick={() => setShowColumnPicker(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-surface-50 text-surface-900 border border-surface-200 hover:text-primary-600 hover:border-primary-500/50 hover:bg-primary-50/30 transition-all uppercase tracking-widest shadow-sm"
          >
            <HiPlus className="w-4 h-4" />
            Add Rule Parameter
          </button>
        </div>

        {/* Condition Logic Tree */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em]">
              Condition Logic Tree
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${showExplanation
                  ? 'bg-primary-600/10 text-primary-600 border border-primary-500/20'
                  : 'bg-surface-50 text-surface-500 border border-surface-200 hover:border-surface-300'
                  }`}
              >
                <HiPlay className="w-3.5 h-3.5" />
                {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
              </button>

              <button
                type="button"
                onClick={() => setShowSandbox(!showSandbox)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${showSandbox
                  ? 'bg-primary-600/10 text-primary-600 border border-primary-500/20'
                  : 'bg-surface-50 text-surface-500 border border-surface-200 hover:border-surface-300'
                  }`}
              >
                <HiPlay className="w-3.5 h-3.5" />
                Test Rule
              </button>
            </div>
          </div>

          {showExplanation && (
            <div className="p-4 bg-surface-50/50 border border-surface-200 rounded-2xl font-mono text-xs leading-relaxed text-surface-700 shadow-inner">
              {explanationContent}
            </div>
          )}

          <ConditionGroup
            group={conditions}
            onChange={setConditions}
            fields={selectedColumns}
          />
        </div>

        {/* Test Sandbox */}
        {showSandbox && (
          <div className="p-6 rounded-2xl bg-primary-50/30 border border-primary-500/20 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-primary-600 uppercase tracking-widest flex items-center gap-2">
                <HiDocumentDuplicate className="w-5 h-5" />
                Rule Testing Sandbox
              </h4>
              <Button
                variant="secondary"
                size="sm"
                loading={testMutation.isPending}
                onClick={handleTest}
                className="font-black"
              >
                Run Test
              </Button>
            </div>
            <p className="text-[11px] font-bold text-surface-500 mb-3 uppercase tracking-wider">
              Input sample record (JSON format):
            </p>
            <textarea
              className="w-full bg-white font-mono text-xs text-surface-700 p-4 rounded-xl border border-surface-200 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 focus:outline-none h-40 shadow-inner transition-all"
              value={sampleData}
              onChange={(e) => setSampleData(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Column Picker Modal */}
      {showColumnPicker && (
        <Modal
          isOpen={showColumnPicker}
          onClose={() => setShowColumnPicker(false)}
          title="Select Rule Parameters"
          size="full"
          footer={
            <Button onClick={() => setShowColumnPicker(false)} icon={HiChevronRight} className="px-8 py-2.5 shadow-xl shadow-primary-600/20 text-sm font-bold uppercase tracking-widest">
              Save Parameters
            </Button>
          }
        >
          <ColumnPicker
            grouped={grouped}
            selectedColumns={selectedColumns}
            onToggle={handleToggleColumn}
          />
        </Modal>
      )}
    </>
  );
});

export default RuleBuilder;