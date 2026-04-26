const { Sequelize } = require('sequelize');
const { sql } = require('./env');

let sequelize;

const dialect = sql.url?.startsWith('postgres') ? 'postgres' : 'mysql';

if (sql.url) {
  console.log(`🔌 Connecting to SQL via URL (${dialect})...`);
  const isTest = process.env.NODE_ENV === 'test';
  sequelize = new Sequelize(sql.url, {
    dialect,
    logging: false,
    dialectOptions: isTest ? {} : {
      ssl: {
        rejectUnauthorized: false,
      },
    },
    define: {
      timestamps: true,
    },
  });
} else {
  sequelize = new Sequelize(sql.database, sql.user, sql.password, {
    host: sql.host,
    dialect,
    logging: false,
    define: {
      timestamps: true,
    },
  });
}

const connectSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQL Database connected and authenticated.');
  } catch (error) {
    console.error('❌ SQL Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectSQL };
