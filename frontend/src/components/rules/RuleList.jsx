import React from 'react';
import RuleCard from './RuleCard';
import EmptyState from '../shared/EmptyState';
import { HiOutlineCog6Tooth } from 'react-icons/hi2';

const RuleList = ({ rules, onEdit, onDelete, onStatusToggle }) => {
  if (!rules || rules.length === 0) {
    return (
      <EmptyState
        icon={HiOutlineCog6Tooth}
        title="No Rules Found"
        description="You haven't created any evaluation rules yet. Create your first rule to start analyzing orders."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {rules.map((rule) => (
        <RuleCard
          key={rule._id}
          rule={rule}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusToggle={onStatusToggle}
        />
      ))}
    </div>
  );
};

export default RuleList;
