/**
 * =====================================================
 * RULE ENGINE — Core Recursive Evaluator
 * =====================================================
 *
 * Evaluates orders against rules using a recursive
 * condition tree. Produces detailed per-condition
 * explanations for the explainability layer.
 *
 * Condition Tree Structure:
 *   Group: { logic: "AND"|"OR", conditions: [...] }
 *   Leaf:  { field, operator, value }
 */

/**
 * Format date values to YYYY-MM-DD format
 * Handles Date objects, excel serial numbers, and string dates
 */
function formatDate(value) {
  if (!value) return value;
  
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // If it's already a YYYY-MM-DD string, return as-is
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value;
  }
  
  return value;
}

/**
 * Normalize order data by formatting all date values
 */
function normalizeOrderData(order) {
  const normalized = {};
  for (const [key, value] of Object.entries(order)) {
    // Format dates in order data
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      normalized[key] = formatDate(value);
    } else if (value instanceof Date) {
      normalized[key] = formatDate(value);
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

/**
 * Check if a value is a date string in YYYY-MM-DD format
 */
function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Compare two values using the given operator.
 * Handles type coercion for numeric and date comparisons.
 */
function compare(actual, operator, expected) {
  // Handle null/undefined actual values
  if (actual === null || actual === undefined) {
    return false;
  }

  // Determine comparison type based on expected value
  const isNumericComparison = typeof expected === 'number' || (!isNaN(Number(expected)) && !isDateString(expected));
  const isDateComparison = isDateString(actual) && isDateString(expected);

  switch (operator) {
    case '=': {
      if (isNumericComparison) {
        return Number(actual) === Number(expected);
      }
      // For strings and dates, case-insensitive comparison
      return String(actual).toLowerCase() === String(expected).toLowerCase();
    }
    case '!=': {
      if (isNumericComparison) {
        return Number(actual) !== Number(expected);
      }
      return String(actual).toLowerCase() !== String(expected).toLowerCase();
    }
    case '>':
      if (isDateComparison) {
        return actual > expected;
      }
      return Number(actual) > Number(expected);
    case '<':
      if (isDateComparison) {
        return actual < expected;
      }
      return Number(actual) < Number(expected);
    case '>=':
      if (isDateComparison) {
        return actual >= expected;
      }
      return Number(actual) >= Number(expected);
    case '<=':
      if (isDateComparison) {
        return actual <= expected;
      }
      return Number(actual) <= Number(expected);
    default:
      return false;
  }
}

/**
 * Determine if a condition node is a leaf or a group.
 */
function isLeaf(condition) {
  return condition.field !== undefined && condition.operator !== undefined;
}

/**
 * Recursively evaluate a condition tree against an order.
 * Returns { matched: boolean, explanations: [] }
 */
function evaluateCondition(conditionTree, orderData) {
  // --- LEAF node ---
  if (isLeaf(conditionTree)) {
    const { field, operator, value } = conditionTree;
    const actualValue = orderData[field];
    const isMissing = actualValue === undefined || actualValue === null;
    const result = isMissing ? false : compare(actualValue, operator, value);

    return {
      matched: result,
      explanations: [
        {
          field,
          operator,
          expected: value,
          actual: isMissing ? 'MISSING' : actualValue,
          result: result ? 'PASS' : 'FAIL',
        },
      ],
    };
  }

  // --- GROUP node (AND / OR) ---
  const { logic, conditions } = conditionTree;

  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
    return { matched: false, explanations: [] };
  }

  const childResults = conditions.map((child) =>
    evaluateCondition(child, orderData)
  );

  const allExplanations = childResults.flatMap((r) => r.explanations);

  let matched;
  if (logic === 'AND') {
    matched = childResults.every((r) => r.matched);
  } else if (logic === 'OR') {
    matched = childResults.some((r) => r.matched);
  } else {
    matched = false;
  }

  return { matched, explanations: allExplanations };
}

/**
 * Evaluate a single order against a single rule.
 */
function evaluateOrderAgainstRule(order, rule) {
  const { matched, explanations } = evaluateCondition(rule.conditions, order);

  return {
    ruleId: rule._id,
    ruleName: rule.ruleName,
    matched,
    explanation: explanations,
  };
}

/**
 * Evaluate a single order against all provided rules.
 */
function evaluateOrder(order, rules) {
  return rules.map((rule) => evaluateOrderAgainstRule(order, rule));
}

/**
 * Evaluate ALL orders against ALL rules.
 * Returns structured results with explanations.
 */
function evaluateAllOrders(orders, rules) {
  const results = orders.map((order, index) => {
    // Normalize order data to ensure dates are in YYYY-MM-DD format
    const normalizedOrder = normalizeOrderData(order);
    const matchedRules = evaluateOrder(normalizedOrder, rules);
    return {
      orderIndex: index + 1,
      orderData: normalizedOrder,
      matchedRules,
    };
  });

  const totalMatches = results.filter((r) =>
    r.matchedRules.some((mr) => mr.matched)
  ).length;

  return { results, totalMatches };
}

module.exports = {
  compare,
  evaluateCondition,
  evaluateOrder,
  evaluateOrderAgainstRule,
  evaluateAllOrders,
};
