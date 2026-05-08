const { parseExcelPreview, cleanupFile } = require('../utils/excelParser');
const ApiError = require('../utils/ApiError');
const TempUpload = require('../models/TempUpload');

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
      // Parse ONLY the first 10 rows for preview — runs in ~0.3s even for 100k row files.
      // The file stays on disk; evaluate will do the full parse when needed.
      const preview = parseExcelPreview(file.path);

      // Store just the file path — NOT the 50k rows — in MongoDB.
      const tempUpload = await TempUpload.create({
        filePath: file.path,
        fileName: file.originalname,
        totalRows: preview.totalRows,
      });

      return {
        sessionId: tempUpload._id.toString(),
        fileName: file.originalname,
        headers: preview.headers,
        totalRows: preview.totalRows,
        preview: preview.preview,
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
      return { valid: false, missingFields: missing };
    }
    return { valid: true, missingFields: [] };
  }
}

module.exports = new UploadService();
