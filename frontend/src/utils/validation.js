/**
 * Centralized validation logic for rule conditions.
 * Returns an error message string if invalid, or an empty string if valid.
 */
export const validateConditionValue = (val, type, fieldName) => {
  if (!fieldName) return 'Field is required';
  
  // Treat empty/null/undefined as "Value is required"
  if (val === '' || val === undefined || val === null) return 'Value is required';
  
  const valueStr = String(val).trim();
  const lowerFieldName = (fieldName || '').toLowerCase();

  // ─── EMAIL VALIDATION ───────────────────────────────────────────────────
  // Triggers if type is email OR field name suggests email
  const isEmailField = type === 'email' || lowerFieldName.includes('email') || lowerFieldName.includes('mail');
  
  if (isEmailField) {
    if (valueStr.length > 100) return 'Email is too long (max 100 characters)';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(valueStr)) return 'Invalid email format (e.g., user@example.com)';
  } else {
    // ─── TEXT/NAME VALIDATION ──────────────────────────────────────────────────
    // Triggers for names, categories, or status fields to ensure clean text
    const isTextField = lowerFieldName.includes('name') || lowerFieldName.includes('user') || 
                        lowerFieldName.includes('customer') || lowerFieldName.includes('category') || 
                        lowerFieldName.includes('status');
    
    if (isTextField && type !== 'number' && type !== 'date' && type !== 'boolean') {
      if (valueStr.length > 50) return 'Text is too long (max 50 characters)';
      // Allow alphabets, spaces, dots, and hyphens
      if (!/^[A-Za-z .\-]+$/.test(valueStr)) return 'Should only contain letters and spaces (no numbers)';
    }
  }
  
  // ─── DATE VALIDATION ────────────────────────────────────────────────────
  // Only trigger if type is date OR field name explicitly contains 'date' or timestamp patterns
  const isDateField = type === 'date' || lowerFieldName.includes('date') || /(^at|_at|createdAt|updatedAt)/i.test(fieldName);
  
  if (isDateField) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(valueStr)) return 'Use YYYY-MM-DD format (e.g., 2025-01-01)';
  }

  // ─── NUMBER VALIDATION ──────────────────────────────────────────────────
  if (type === 'number' || lowerFieldName.includes('age') || lowerFieldName.includes('qty') || lowerFieldName.includes('price')) {
    const isIntegerOnly = lowerFieldName.match(/age|quantity|stock|id|count/);

    if (isIntegerOnly) {
      if (!/^\d+$/.test(valueStr)) return 'This field only accepts whole numbers (integers)';
    } else {
      if (isNaN(Number(valueStr))) return 'Must be a valid numeric value';
    }
    
    // Age specific constraint
    if (lowerFieldName.includes('age')) {
      const numVal = parseInt(valueStr, 10);
      if (numVal > 150) return 'Age cannot be more than 150';
      if (numVal <= 0) return 'Age must be greater than 0';
    }

    if (valueStr.length > 12) return 'Value is too large';
  }
  
  return '';
};
