const User = require('./models/sql/User');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config();

async function debugUser() {
  const email = 'admin123@gmail.com';
  const password = 'admin@123';
  
  console.log(`Searching for user: ${email}`);
  const user = await User.scope('withPassword').findOne({ where: { email } });
  
  if (!user) {
    console.log('❌ User not found in database!');
    process.exit(1);
  }
  
  console.log('✅ User found!');
  console.log('Stored Password Hash:', user.password);
  
  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Password Match Test:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
  
  process.exit(0);
}

debugUser().catch(err => {
  console.error(err);
  process.exit(1);
});
