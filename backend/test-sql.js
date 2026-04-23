const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const sqlConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function testSQL() {
  console.log('--- Testing MySQL ---');
  try {
    const sequelize = new Sequelize(sqlConfig.database, sqlConfig.user, sqlConfig.password, {
      host: sqlConfig.host,
      dialect: 'mysql',
      logging: false,
    });
    console.log(`Connecting to MySQL at ${sqlConfig.host} (${sqlConfig.database})...`);
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully!');
    await sequelize.close();
  } catch (err) {
    console.error('❌ MySQL connection failed:');
    console.error(err.message);
  }
}

testSQL();
