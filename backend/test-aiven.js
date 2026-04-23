const { connectSQL, sequelize } = require('./config/sqlDb');
const User = require('./models/sql/User');

async function testAiven() {
  try {
    console.log('Testing Aiven MySQL connection...');
    await connectSQL();
    
    console.log('Fetching user count...');
    const count = await User.count();
    console.log(`✅ Success! Found ${count} users in Aiven MySQL.`);
    
    if (count > 0) {
      const admin = await User.findOne({ where: { role: 'admin' } });
      console.log(`✅ Admin user verified: ${admin.email}`);
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testAiven();
