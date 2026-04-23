export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(num);
};

export const truncate = (str, n = 50) => {
  if (!str) return '';
  return str.length > n ? str.substring(0, n) + '...' : str;
};

export const getMatchRate = (matches, total) => {
  return ((matches / total) * 100).toFixed(1) + '%';
};

export const generateLogicSummary = (condition) => {
  if (!condition) return '';
  
  // Leaf check
  if (condition.field !== undefined && condition.operator !== undefined) {
    return `${condition.field} ${condition.operator} ${condition.value}`;
  }
  
  // Group check
  if (condition.logic && condition.conditions) {
    const children = condition.conditions.map(c => generateLogicSummary(c));
    return `(${children.join(` ${condition.logic} `)})`;
  }
  
  return '';
};

export const generateReadableSummary = (ruleResult) => {
  if (!ruleResult) return '';
  
  const opMap = {
    '>': 'more than',
    '<': 'less than',
    '>=': 'at least',
    '<=': 'at most',
    '=': 'exactly',
    '!=': 'not equal to'
  };

  const { matched, explanation = [] } = ruleResult;

  if (!matched) {
    const failedConditions = explanation
      .filter((e) => e.result === 'FAIL')
      .map((e) => {
        const fieldName = e.field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const opName = opMap[e.operator] || e.operator;
        
        if (e.actual === 'MISSING') {
          return `the ${fieldName} was not provided (was required to be ${opName} ${e.expected})`;
        }
        return `the ${fieldName} was "${e.actual}" (but needed to be ${opName} ${e.expected})`;
      });
      
    if (failedConditions.length === 0) return 'The conditions did not align with the rule logic.';
    
    return `Did not match because ${failedConditions.join(', ')}.`;
  }

  const passedConditions = explanation
    .filter((e) => e.result === 'PASS')
    .map((e) => {
      const fieldName = e.field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `${fieldName} was ${e.actual}`;
    });
    
  if (passedConditions.length === 0) return 'Matches all rule criteria.';

  return `Rule triggered because ${passedConditions.join(' and ')}.`;
};
