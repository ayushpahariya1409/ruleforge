
require('dotenv').config();
const mongoose = require('mongoose');
const { sequelize, connectSQL } = require('../config/sqlDb');
const { mongoUri } = require('../config/env');
const EntityField = require('../models/sql/EntityField');
const User = require('../models/sql/User');
const Rule = require('../models/Rule');
const Evaluation = require('../models/Evaluation');
const EvaluationResult = require('../models/EvaluationResult');
const crypto = require('crypto');

// ─── Rules Seed Data ─────────────────────────────────────────────────────────

const rulesSeedData = [
  // ── 3 Complicated Rules (nested 3 levels, grouped) ──
  {
    ruleName: 'High-Value Electronics Combo',
    description: 'Flags premium users ordering electronics with high total or quantity',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'userIsPremium', operator: '=', value: true },
        {
          logic: 'OR',
          conditions: [
            {
              logic: 'AND',
              conditions: [
                { field: 'orderTotal', operator: '>', value: 500 },
                { field: 'orderQuantity', operator: '>=', value: 3 },
                {
                  logic: 'OR',
                  conditions: [
                    { field: 'productCategory', operator: '=', value: 'Electronics' },
                    { field: 'productPrice', operator: '>', value: 200 },
                  ],
                },
              ],
            },
            { field: 'productIsDigital', operator: '=', value: false },
          ],
        },
      ],
    },
  },
  {
    ruleName: 'Subscription Premium Bundle',
    description: 'Applies discount if subscription is high value and user is premium',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'orderIsSubscription', operator: '=', value: true },
        { field: 'userIsPremium', operator: '=', value: true },
        {
          logic: 'OR',
          conditions: [
            {
              logic: 'AND',
              conditions: [
                { field: 'orderTotal', operator: '>=', value: 100 },
                { field: 'orderQuantity', operator: '>=', value: 2 },
                {
                  logic: 'OR',
                  conditions: [
                    { field: 'productCategory', operator: '=', value: 'Software' },
                    { field: 'productPrice', operator: '>', value: 50 },
                  ],
                },
              ],
            },
            { field: 'userAge', operator: '>=', value: 25 },
          ],
        },
      ],
    },
  },
  {
    ruleName: 'VIP Express Delivery',
    description: 'Routes orders to express processing for premium or mature users with high-value pending orders',
    conditions: {
      logic: 'AND',
      conditions: [
        {
          logic: 'OR',
          conditions: [
            { field: 'userIsPremium', operator: '=', value: true },
            { field: 'userAge', operator: '>=', value: 30 },
          ],
        },
        { field: 'orderTotal', operator: '>', value: 300 },
        {
          logic: 'OR',
          conditions: [
            { field: 'orderStatus', operator: '=', value: 'Pending' },
            { field: 'orderStatus', operator: '=', value: 'Processing' },
          ],
        },
      ],
    },
  },

  // ── 3 Mid-Level Rules (2 levels of nesting) ──
  {
    ruleName: 'Free Shipping Eligibility',
    description: 'Orders qualify for free shipping based on total or premium status',
    conditions: {
      logic: 'OR',
      conditions: [
        { field: 'orderTotal', operator: '>=', value: 100 },
        {
          logic: 'AND',
          conditions: [
            { field: 'userIsPremium', operator: '=', value: true },
            { field: 'orderQuantity', operator: '>=', value: 2 },
          ],
        },
      ],
    },
  },
  {
    ruleName: 'Loyalty Reward Points',
    description: 'Premium users get loyalty points for high value or subscription orders',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'userIsPremium', operator: '=', value: true },
        {
          logic: 'OR',
          conditions: [
            { field: 'orderTotal', operator: '>', value: 150 },
            { field: 'orderIsSubscription', operator: '=', value: true },
          ],
        },
      ],
    },
  },
  {
    ruleName: 'Bulk Discount Orders',
    description: 'Orders qualify for bulk discount when quantity is high and either price is low or user is premium',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'orderQuantity', operator: '>=', value: 10 },
        {
          logic: 'OR',
          conditions: [
            { field: 'productPrice', operator: '<', value: 50 },
            { field: 'userIsPremium', operator: '=', value: true },
          ],
        },
      ],
    },
  },

  // ── 2 Simple Rules (1-2 nodes) ──
  {
    ruleName: 'New Customer Welcome Offer',
    description: 'Applies discount for new customers',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'userSignupDate', operator: '>', value: '2025-01-01' },
        { field: 'userIsPremium', operator: '=', value: false },
      ],
    },
  },
  {
    ruleName: 'Low Stock Alert',
    description: 'Triggers alert when product stock is low',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'productStock', operator: '<', value: 10 },
      ],
    },
  },
];

// ─── Main Seed Function ──────────────────────────────────────────────────────

const seedDB = async () => {
  let sqlConnection = false;
  let mongoConnection = false;

  try {
    // Connect SQL
    await connectSQL();
    sqlConnection = true;
    
    console.log('🔄 Syncing SQL tables...');
    await sequelize.sync();
    console.log('✅ SQL tables synced.');

    // Connect Mongo
    await mongoose.connect(mongoUri);
    mongoConnection = true;
    console.log('Connected to MongoDB');

    // ── Get/Create Admin User ──
    console.log('🧹 Clearing old users and fields...');
    // Delete fields first (child) then users (parent) to avoid FK constraint errors
    await EntityField.destroy({ where: {} });
    await User.destroy({ where: {} });
    
    adminUser = await User.create({
      name: 'Admin',
      email: 'admin123@gmail.com',
      password: 'admin@123',
      role: 'admin',
    });
    const ADMIN_ID = adminUser.id;

    // ── SQL Entity Fields (5 per table) ──
    const seedData = [
      // Users
      { category: 'users', fieldName: 'userName', dataType: 'string', description: 'Full name', createdBy: ADMIN_ID },
      { category: 'users', fieldName: 'userEmail', dataType: 'string', description: 'Email', createdBy: ADMIN_ID },
      { category: 'users', fieldName: 'userAge', dataType: 'number', description: 'Age in years', createdBy: ADMIN_ID },
      { category: 'users', fieldName: 'userIsPremium', dataType: 'boolean', description: 'Premium status', createdBy: ADMIN_ID },
      { category: 'users', fieldName: 'userSignupDate', dataType: 'date', description: 'Signup date', createdBy: ADMIN_ID },

      // Products
      { category: 'products', fieldName: 'productName', dataType: 'string', description: 'Product name', createdBy: ADMIN_ID },
      { category: 'products', fieldName: 'productCategory', dataType: 'string', description: 'Category', createdBy: ADMIN_ID },
      { category: 'products', fieldName: 'productPrice', dataType: 'number', description: 'Price', createdBy: ADMIN_ID },
      { category: 'products', fieldName: 'productStock', dataType: 'number', description: 'Stock', createdBy: ADMIN_ID },
      { category: 'products', fieldName: 'productIsDigital', dataType: 'boolean', description: 'Digital product', createdBy: ADMIN_ID },

      // Orders
      { category: 'orders', fieldName: 'orderTotal', dataType: 'number', description: 'Total value', createdBy: ADMIN_ID },
      { category: 'orders', fieldName: 'orderQuantity', dataType: 'number', description: 'Quantity', createdBy: ADMIN_ID },
      { category: 'orders', fieldName: 'orderStatus', dataType: 'string', description: 'Status', createdBy: ADMIN_ID },
      { category: 'orders', fieldName: 'orderIsSubscription', dataType: 'boolean', description: 'Subscription order', createdBy: ADMIN_ID },
      { category: 'orders', fieldName: 'orderDeliveryDate', dataType: 'date', description: 'Delivery date', createdBy: ADMIN_ID },
    ];

    // ── Seed SQL Entity Fields ──
    await EntityField.destroy({ where: {} });
    await EntityField.bulkCreate(seedData, { validate: true });

    // ── Seed MongoDB Rules ──
    await Rule.deleteMany({});
    await Evaluation.deleteMany({});
    await EvaluationResult.deleteMany({});
    const rulesToInsert = rulesSeedData.map(rule => ({
      ...rule,
      ruleHash: crypto.createHash('sha256')
        .update(JSON.stringify({ ruleName: rule.ruleName, conditions: rule.conditions }))
        .digest('hex'),
      createdBy: ADMIN_ID,
      isActive: true,
    }));
    await Rule.insertMany(rulesToInsert);

    console.log(`Seeded ${seedData.length} SQL fields and ${rulesToInsert.length} Mongo rules.`);

  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    if (sqlConnection) await sequelize.close();
    if (mongoConnection) await mongoose.connection.close();
  }
};

seedDB();
