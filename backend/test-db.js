const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
const sqlConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function testMongo() {
  console.log('--- Testing MongoDB ---');
  try {
    console.log(`Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected successfully!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ MongoDB connection failed:');
    console.error(err.message);
  }
}

async function testSQL() {
  console.log('\n--- Testing MySQL ---');
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

async function runTests() {
  await testMongo();
  await testSQL();
}

runTests();
