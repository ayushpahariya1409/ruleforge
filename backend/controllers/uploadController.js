const asyncHandler = require('../utils/asyncHandler');
const uploadService = require('../services/uploadService');

exports.uploadFile = asyncHandler(async (req, res) => {
  const result = await uploadService.processUpload(req.file);
  res.status(200).json({
    success: true,
    message: 'File uploaded and parsed successfully',
    data: {
      fileName: result.fileName,
      headers: result.headers,
      totalRows: result.totalRows,
      preview: result.preview,
      allRows: result.allRows,
    },
  });
});

exports.validateSchema = asyncHandler(async (req, res) => {
  const { headers, requiredFields } = req.body;
  const result = uploadService.validateSchema(headers, requiredFields);
  res.status(200).json({
    success: true,
    data: result,
  });
});
