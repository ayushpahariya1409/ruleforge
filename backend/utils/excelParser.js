
const XLSX = require('xlsx');
const fs = require('fs');
const ApiError = require('./ApiError');

/**
 * Convert Excel serial date → YYYY-MM-DD
 */
const excelDateToISO = (excelDate) => {
  if (!excelDate) return excelDate;

  const excelEpoch = new Date(1899, 11, 30);
  const msPerDay = 24 * 60 * 60 * 1000;

  const date = new Date(excelEpoch.getTime() + excelDate * msPerDay);
  return date.toISOString().split('T')[0];
};

/**
 * Detect date fields
 */
const isDateField = (fieldName) => {
  return ['date', 'Date', 'DATE'].some((k) => fieldName.includes(k));
};

/**
 * Should convert number → date
 */
const shouldConvertToDate = (value, fieldName) => {
  return typeof value === 'number' && value > 0 && value < 60000 && isDateField(fieldName);
};

/**
 * Detect MM/DD/YYYY format
 */
const isDateString = (value) => {
  return typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value);
};

/**
 * Convert MM/DD/YYYY → YYYY-MM-DD
 */
const formatDateString = (dateStr) => {
  const [month, day, yearRaw] = dateStr.split('/');
  let year = yearRaw;

  if (year.length === 2) {
    year = year < 50 ? `20${year}` : `19${year}`;
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * ✅ REMOVE DUPLICATES BASED ON USER EMAIL (MAIN LOGIC)
 */
const removeDuplicateByEmail = (rows) => {
  const seen = new Set();

  return rows.filter((row) => {
    const key = Object.keys(row).find((k) =>
      k.replace(/\s|_/g, '').toLowerCase() === 'useremail'
    );

    if (!key) return true;

    const value = row[key]?.toString().toLowerCase().trim();

    if (!value) return true;

    if (seen.has(value)) {
      return false; // ❌ duplicate email → remove
    }

    seen.add(value);
    return true; // ✅ keep first
  });
};

/**
 * MAIN PARSER
 */
const parseExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw ApiError.badRequest('File not found');
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw ApiError.badRequest('No sheets found');
  }

  const sheet = workbook.Sheets[sheetName];

  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawData.length) {
    throw ApiError.badRequest('Excel file is empty');
  }

  // 🔹 Normalize & clean data
  let data = rawData.map((row) => {
    const newRow = {};

    for (const [key, value] of Object.entries(row)) {
      const trimmedKey = key.trim();

      if (value instanceof Date) {
        newRow[trimmedKey] = value.toISOString().split('T')[0];
      } else if (shouldConvertToDate(value, trimmedKey)) {
        newRow[trimmedKey] = excelDateToISO(value);
      } else if (isDateString(value)) {
        newRow[trimmedKey] = formatDateString(value);
      } else if (typeof value === 'object' && value !== null) {
        newRow[trimmedKey] = JSON.stringify(value);
      } else if (typeof value === 'string') {
        const num = Number(value);
        newRow[trimmedKey] =
          !isNaN(num) && value.trim() !== '' ? num : value.trim();
      } else {
        newRow[trimmedKey] = value;
      }
    }

    return newRow;
  });

  // 🔥 YOUR MAIN FIX HERE
  const before = data.length;

  data = removeDuplicateByEmail(data);

  const after = data.length;

  console.log(`✅ Rows before: ${before}`);
  console.log(`✅ Rows after: ${after}`);
  console.log(`🧹 Duplicate emails removed: ${before - after}`);

  return {
    headers: Object.keys(data[0]),
    rows: data,
    totalRows: data.length,
    duplicatesRemoved: before - after, // optional (good for UI)
  };
};

/**
 * CLEANUP FILE
 */
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('Cleanup failed:', err.message);
  }
};

module.exports = { parseExcelFile, cleanupFile };