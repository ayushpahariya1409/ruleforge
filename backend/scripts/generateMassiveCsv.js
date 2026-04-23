const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'massive_test_data_2000.csv');
const stream = fs.createWriteStream(filePath);

stream.write("orderId,amount,quantity,category,country,isPremium,status\n");

for (let i = 1; i <= 2000; i++) {
  const orderId = `ORD-${10000 + i}`;
  const amount = Math.floor(Math.random() * 1000);
  const quantity = Math.floor(Math.random() * 50);
  const category = ['Electronics', 'Clothing', 'Home', 'Toys'][Math.floor(Math.random() * 4)];
  const country = ['US', 'UK', 'IN', 'CA', 'AU'][Math.floor(Math.random() * 5)];
  const isPremium = Math.random() > 0.5 ? 'yes' : 'no';
  const status = ['pending', 'shipped', 'delivered'][Math.floor(Math.random() * 3)];
  
  stream.write(`${orderId},${amount},${quantity},${category},${country},${isPremium},${status}\n`);
}

stream.end();
console.log("massive_test_data_2000.csv generated in backend folder with 2000 rows!");
