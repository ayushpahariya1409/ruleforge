
const { evaluateAllOrders } = require('./services/ruleEngine');
const crypto = require('crypto');

// Generate 20,000 dummy records
const orders = Array.from({ length: 20000 }, (_, i) => ({
  id: i,
  userName: `User ${i}`,
  userEmail: `user${i}@example.com`,
  userAge: Math.floor(Math.random() * 50) + 18,
  userIsPremium: Math.random() > 0.5,
  productName: 'Gadget',
  productCategory: 'Electronics',
  productPrice: Math.random() * 1000,
  productStock: Math.floor(Math.random() * 100),
  productIsDigital: false,
  orderTotal: Math.random() * 2000,
  orderQuantity: Math.floor(Math.random() * 10) + 1,
  orderStatus: 'Pending',
  orderIsSubscription: Math.random() > 0.8,
  orderDeliveryDate: '2025-05-01'
}));

// Dummy rules (similar to what user has)
const rules = [
  {
    _id: 'rule1',
    ruleName: 'High-Value Electronics',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'userIsPremium', operator: '=', value: true },
        { field: 'orderTotal', operator: '>', value: 500 },
        {
          logic: 'OR',
          conditions: [
            { field: 'productCategory', operator: '=', value: 'Electronics' },
            { field: 'orderQuantity', operator: '>=', value: 3 }
          ]
        }
      ]
    }
  },
  {
    _id: 'rule2',
    ruleName: 'Free Shipping',
    conditions: {
      logic: 'OR',
      conditions: [
        { field: 'orderTotal', operator: '>=', value: 100 },
        { field: 'userIsPremium', operator: '=', value: true }
      ]
    }
  }
];

console.log('Starting evaluation of 20,000 orders...');
const start = Date.now();
const { results, totalMatches } = evaluateAllOrders(orders, rules);
console.log(`Evaluation finished in ${Date.now() - start}ms`);
console.log(`Total Matches: ${totalMatches}`);

// Check size of the results object (v8.serialize for worker-like measure)
const v8 = require('v8');
const serialized = v8.serialize({ results, totalMatches });
console.log(`Serialized size: ${(serialized.length / (1024 * 1024)).toFixed(2)} MB`);

if (serialized.length > 17825792) {
  console.log('⚠️ SIZE EXCEEDS 17MB LIMIT! This will likely cause ERR_OUT_OF_RANGE in postMessage.');
} else {
  console.log('Size is within limits for a single postMessage payload.');
}
