const { createRuleSchema } = require('../validators/ruleValidator');

const validLeaf = { field: 'age', operator: '>', value: 25 };

// Function to create a nested rule structure
const createNested = (depth, nodesPerLevel = 1) => {
  if (depth === 1) {
    return {
      logic: 'AND',
      conditions: Array(nodesPerLevel).fill(validLeaf)
    };
  }
  return {
    logic: 'AND',
    conditions: [
      ...Array(nodesPerLevel - 1).fill(validLeaf),
      createNested(depth - 1, nodesPerLevel)
    ]
  };
};

console.log('--- Testing Backend Validation Limits ---');

// Test 1: 5 levels, 1 node per level (Valid)
const test1 = { ruleName: 'Depth 5', conditions: createNested(5, 1) };
const val1 = createRuleSchema.validate(test1);
console.log('Test 1 (Depth 5, 1 Node):', val1.error ? `FAILED: ${val1.error.message}` : 'PASSED');

// Test 2: 6 levels (Invalid)
const test2 = { ruleName: 'Depth 6', conditions: createNested(6, 1) };
const val2 = createRuleSchema.validate(test2);
console.log('Test 2 (Depth 6, 1 Node):', val2.error ? `PASSED: Correctly caught error: ${val2.error.message}` : 'FAILED: Should have caught depth 6');

// Test 3: 1 level, 15 nodes (Valid)
const test3 = { ruleName: '15 Nodes', conditions: createNested(1, 15) };
const val3 = createRuleSchema.validate(test3);
console.log('Test 3 (Depth 1, 15 Nodes):', val3.error ? `FAILED: ${val3.error.message}` : 'PASSED');

// Test 4: 1 level, 16 nodes (Invalid)
const test4 = { ruleName: '16 Nodes', conditions: createNested(1, 16) };
const val4 = createRuleSchema.validate(test4);
console.log('Test 4 (Depth 1, 16 Nodes):', val4.error ? `PASSED: Correctly caught error: ${val4.error.message}` : 'FAILED: Should have caught 16 nodes');

// Test 5: Depth 5, Level 5 has 15 nodes (Valid)
const test5 = { ruleName: 'Depth 5 Wide', conditions: createNested(5, 15) };
const val5 = createRuleSchema.validate(test5);
console.log('Test 5 (Depth 5, 15 Nodes per level):', val5.error ? `FAILED: ${val5.error.message}` : 'PASSED');

console.log('--- End of Tests ---');
