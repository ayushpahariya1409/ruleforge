const User = require('./models/sql/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function listUsers() {
  console.log('--- Listing All Users ---');
  try {
    const users = await User.findAll();
    console.log(`Total users found: ${users.length}`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`);
    });
  } catch (err) {
    console.error('Error fetching users:', err.message);
  }
  process.exit(0);
}

listUsers();
