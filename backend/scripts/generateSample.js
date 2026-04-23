const XLSX = require('xlsx');
const path = require('path');

const data = [
  { orderId: 'ORD-1001', orderValue: 12500, orderType: 'wholesale', quantity: 45, pricePerItem: 277.78, totalPrice: 12500, userType: 'premium', region: 'US', previousOrders: 20, paymentType: 'credit' },
  { orderId: 'ORD-1002', orderValue: 4200, orderType: 'retail', quantity: 120, pricePerItem: 35, totalPrice: 4200, userType: 'standard', region: 'EU', previousOrders: 3, paymentType: 'bank_transfer' },
  { orderId: 'ORD-1003', orderValue: 8900, orderType: 'wholesale', quantity: 12, pricePerItem: 741.67, totalPrice: 8900, userType: 'premium', region: 'APAC', previousOrders: 15, paymentType: 'credit' },
  { orderId: 'ORD-1004', orderValue: 1200, orderType: 'retail', quantity: 5, pricePerItem: 240, totalPrice: 1200, userType: 'standard', region: 'US', previousOrders: 1, paymentType: 'debit' },
  { orderId: 'ORD-1005', orderValue: 25000, orderType: 'wholesale', quantity: 200, pricePerItem: 125, totalPrice: 25000, userType: 'premium', region: 'LATAM', previousOrders: 50, paymentType: 'credit' },
  { orderId: 'ORD-1006', orderValue: 600, orderType: 'retail', quantity: 1, pricePerItem: 600, totalPrice: 600, userType: 'standard', region: 'EU', previousOrders: 0, paymentType: 'debit' },
  { orderId: 'ORD-1007', orderValue: 15000, orderType: 'wholesale', quantity: 150, pricePerItem: 100, totalPrice: 15000, userType: 'premium', region: 'US', previousOrders: 35, paymentType: 'corporate' },
  { orderId: 'ORD-1008', orderValue: 3200, orderType: 'retail', quantity: 8, pricePerItem: 400, totalPrice: 3200, userType: 'standard', region: 'APAC', previousOrders: 7, paymentType: 'credit' },
  { orderId: 'ORD-1009', orderValue: 9500, orderType: 'wholesale', quantity: 50, pricePerItem: 190, totalPrice: 9500, userType: 'premium', region: 'EU', previousOrders: 12, paymentType: 'bank_transfer' },
  { orderId: 'ORD-1010', orderValue: 450, orderType: 'retail', quantity: 2, pricePerItem: 225, totalPrice: 450, userType: 'standard', region: 'US', previousOrders: 0, paymentType: 'debit' },
];

const generateSample = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  
  const filePath = path.join(__dirname, '..', 'sample_orders.xlsx');
  XLSX.writeFile(wb, filePath);
  
  console.log(`✅ Sample Excel file generated at: ${filePath}`);
  console.log(`📊 Contains ${data.length} order records with columns:`);
  console.log(`   orderId, orderValue, orderType, quantity, pricePerItem, totalPrice, userType, region, previousOrders, paymentType`);
};

generateSample();
