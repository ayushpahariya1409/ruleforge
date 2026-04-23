
import React, { useState, useRef } from 'react';
import { HiOutlinePlusSmall, HiOutlineMagnifyingGlass, HiCheck, HiChevronRight } from 'react-icons/hi2';
import RuleList from '../components/rules/RuleList';
import RuleBuilder from '../components/rules/RuleBuilder';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import Spinner from '../components/shared/Spinner';
import Pagination from '../components/shared/Pagination';
import { useRules, useCreateRule, useUpdateRule, useDeleteRule } from '../hooks/useRules';
import toast from 'react-hot-toast';
import PerPageControl from '../components/shared/PerPageControl';
import ColumnPicker from '../components/rules/CoulmnPicker';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Reveal from '../components/shared/Reveal';

import { useSchemaGrouped } from '../hooks/useSchema';


const RulesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  
  const [isRuleBuilderDirty, setIsRuleBuilderDirty] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const ruleBuilderRef = useRef();

  const { data, isLoading } = useRules(true); // Always fetch all for admin
  const createMutation = useCreateRule();
  const updateMutation = useUpdateRule();
  const deleteMutation = useDeleteRule();

  const [selectedColumns, setSelectedColumns] = useState(() => {
    const saved = localStorage.getItem('selected_rule_columns');
    return saved ? JSON.parse(saved) : [];
  });
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const { data: groupedSchema, isLoading: schemaLoading } = useSchemaGrouped();

  const handleCreate = () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select columns first');
      return;
    }

    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleSave = async (ruleData) => {
    try {
      if (editingRule) {
        await updateMutation.mutateAsync({ id: editingRule._id, data: ruleData });
        toast.success('Rule updated successfully');
      } else {
        await createMutation.mutateAsync(ruleData);
        toast.success('Rule created successfully');
      }
      setIsModalOpen(false);
      setIsRuleBuilderDirty(false); // Reset dirty state on save
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save rule');
    }
  };

  const handleCloseBuilder = () => {
    if (isRuleBuilderDirty) {
      setShowUnsavedWarning(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleSaveAndExit = () => {
    ruleBuilderRef.current?.save();
    setShowUnsavedWarning(false);
  };

  const handleDiscardAndExit = () => {
    setIsModalOpen(false);
    setShowUnsavedWarning(false);
    setIsRuleBuilderDirty(false);
  };

  const handleDeleteClick = (rule) => {
    setRuleToDelete(rule);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await deleteMutation.mutateAsync(ruleToDelete._id);
      toast.success('Rule deleted successfully');
      setIsDeleteModalOpen(false);
      setRuleToDelete(null);
    } catch (err) {
      toast.error('Failed to delete rule');
    }
  };

  const handleStatusToggle = async (id, isActive) => {
    try {
      await updateMutation.mutateAsync({ id, data: { isActive } });
      toast.success(`Rule ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update rule status');
    }
  };

  const filteredRules = data?.rules?.filter((rule) => {
    const matchesSearch = rule.ruleName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && rule.isActive) || (filterStatus === 'inactive' && !rule.isActive);
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredRules.length / pageSize);
  const paginatedRules = filteredRules.slice((page - 1) * pageSize, page * pageSize);

  // Reset to first page when filtering
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  };

  const handlePageSizeChange = (newSize) => {
    const currentFirstRow = (page - 1) * pageSize;
    const newPage = Math.floor(currentFirstRow / newSize) + 1;
    setPageSize(newSize);
    setPage(Math.max(1, newPage));
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-surface-900 -tracking-tight mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Rule Configuration
            </h1>
            <p className="text-surface-500 font-medium">
              Define complex logic chains and automated evaluation parameters.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsColumnModalOpen(true)}
              size="sm"
            >
              Select Parameters
            </Button>

            <Button
              icon={HiOutlinePlusSmall}
              onClick={handleCreate}
              size="sm"
            >
              Create Rule
            </Button>
          </div>
        </div>
      </Reveal>

      {/* Filters Bar */}
      <Reveal delay={100}>
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                className="input-field pl-10 py-2.5 text-sm w-full"
                placeholder="Search rules..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={handleStatusFilterChange}
                className="select-field py-2.5 text-sm w-full sm:w-auto"
              >
                <option value="all">All Rules</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <PerPageControl
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                max={16}
              />
              <div className="text-xs text-surface-500 whitespace-nowrap bg-surface-50 py-2.5 px-4 rounded-xl border border-surface-200">
                <span className="font-bold text-surface-800">{filteredRules.length}</span> rules
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Content */}
      {isLoading ? (
        <div className="py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <Reveal delay={200}>
          <RuleList
            rules={paginatedRules}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onStatusToggle={handleStatusToggle}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </Reveal>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseBuilder}
        title={editingRule ? 'Edit Evaluation Rule' : 'Create New Evaluation Rule'}
        size="full"
        footer={
          <Button onClick={() => ruleBuilderRef.current?.save()} loading={createMutation.isPending || updateMutation.isPending} className="px-10 py-2.5 shadow-xl shadow-primary-600/20 text-sm font-bold uppercase tracking-widest">
            <HiCheck className="w-4 h-4" /> Save Rule
          </Button>
        }
      >
        <RuleBuilder
          ref={ruleBuilderRef}
          rule={editingRule}
          preSelectedColumns={selectedColumns}
          onSave={handleSave}
          onDirtyChange={setIsRuleBuilderDirty}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showUnsavedWarning}
        onClose={() => setShowUnsavedWarning(false)}
        onConfirm={handleSaveAndExit}
        onSecondary={handleDiscardAndExit}
        title="Unsaved Changes"
        message="You have unsaved changes. Would you like to save them before exiting?"
        confirmText="Save & Exit"
        secondaryText="Discard Changes"
        variant="primary"
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRuleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Rule?"
        message={`Are you sure you want to delete "${ruleToDelete?.ruleName}"? This action cannot be undone.`}
        confirmText="Delete Rule"
        loading={deleteMutation.isPending}
      />

      <Modal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title="Select Rule Parameters"
        size="full"
        footer={
          <Button onClick={() => {
            if (selectedColumns.length === 0) {
              toast.error('Select at least one column');
              return;
            }
            setIsColumnModalOpen(false);
            toast.success('Columns saved');
          }} icon={HiChevronRight} className="px-10 py-2.5 shadow-xl shadow-primary-600/20 text-sm font-bold uppercase tracking-widest">
            Save Parameters
          </Button>
        }
      >
        <ColumnPicker
          grouped={groupedSchema} // OR useSchemaGrouped()
          selectedColumns={selectedColumns}
        onToggle={(col) => {
          const nextColumns = (() => {
            const exists = selectedColumns.some(
              c => c.fieldName === col.fieldName && c.category === col.category
            );

            if (exists) {
              return selectedColumns.filter(
                c => !(c.fieldName === col.fieldName && c.category === col.category)
              );
            }

            return [...selectedColumns, col];
          })();
          
          setSelectedColumns(nextColumns);
          localStorage.setItem('selected_rule_columns', JSON.stringify(nextColumns));
        }}
        onDone={() => {}} // Not used anymore as footer handles it
        />
      </Modal>
    </div>
  );
};

export default RulesPage;
