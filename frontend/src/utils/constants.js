// In Docker: Nginx proxies /api → backend:5000
// In local dev: Either use Vite proxy or set VITE_API_URL=http://localhost:5000/api
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const ORDER_FIELDS = [
  { value: 'orderId', label: 'Order ID', type: 'string' },
  { value: 'orderValue', label: 'Order Value', type: 'number' },
  { value: 'orderType', label: 'Order Type', type: 'string' },
  { value: 'quantity', label: 'Quantity', type: 'number' },
  { value: 'pricePerItem', label: 'Price Per Item', type: 'number' },
  { value: 'totalPrice', label: 'Total Price', type: 'number' },
  { value: 'userType', label: 'User Type', type: 'string' },
  { value: 'region', label: 'Region', type: 'string' },
  { value: 'previousOrders', label: 'Previous Orders', type: 'number' },
  { value: 'paymentType', label: 'Payment Type', type: 'string' },
];

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const OPERATORS = [
  { value: '>', label: 'Greater than (>)' },
  { value: '<', label: 'Less than (<)' },
  { value: '=', label: 'Equals (=)' },
  { value: '!=', label: 'Not equals (!=)' },
  { value: '>=', label: 'Greater or equal (>=)' },
  { value: '<=', label: 'Less or equal (<=)' },
];

export const LOGIC_TYPES = [
  { value: 'AND', label: 'AND — All must match' },
  { value: 'OR', label: 'OR — Any can match' },
];
