const { parseExcelFile, cleanupFile } = require('../utils/excelParser');
const ApiError = require('../utils/ApiError');

class UploadService {
  async processUpload(file) {
    if (!file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];

    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    const allowedExts = ['.xlsx', '.xls', '.csv'];

    if (!allowedTypes.includes(file.mimetype) && !allowedExts.includes(ext)) {
      cleanupFile(file.path);
      throw ApiError.badRequest('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed');
    }

    try {
      const parsed = parseExcelFile(file.path);
      cleanupFile(file.path);

      return {
        fileName: file.originalname,
        headers: parsed.headers,
        totalRows: parsed.totalRows,
        preview: parsed.rows.slice(0, 10), // First 10 rows for preview
        allRows: parsed.rows,
      };
    } catch (error) {
      cleanupFile(file.path);
      if (error instanceof ApiError) throw error;
      throw ApiError.badRequest(`Failed to parse Excel file: ${error.message}`);
    }
  }

  validateSchema(headers, requiredFields = []) {
    const missing = requiredFields.filter((f) => !headers.includes(f));
    if (missing.length > 0) {
      return {
        valid: false,
        missingFields: missing,
      };
    }
    return { valid: true, missingFields: [] };
  }
}

module.exports = new UploadService();
