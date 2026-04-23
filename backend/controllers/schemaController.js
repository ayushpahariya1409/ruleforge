const asyncHandler = require('../utils/asyncHandler');
const schemaService = require('../services/schemaService');
const XLSX = require('xlsx');



exports.getAllFields = asyncHandler(async (req, res) => {
  const fields = await schemaService.getAllFields();
  res.status(200).json({
    success: true,
    data: { fields, count: fields.length },
  });
});

exports.getFieldsGrouped = asyncHandler(async (req, res) => {
  const grouped = await schemaService.getFieldsGrouped();
  res.status(200).json({
    success: true,
    data: { grouped },
  });
});

exports.getFieldById = asyncHandler(async (req, res) => {
  const field = await schemaService.getFieldById(req.params.id);
  res.status(200).json({
    success: true,
    data: { field },
  });
});



exports.downloadTemplate = asyncHandler(async (req, res) => {
  const grouped = await schemaService.getFieldsGrouped();

  // Build headers from all categories
  const allHeaders = [];
  for (const category of ['users', 'products', 'orders']) {
    for (const field of grouped[category] || []) {
      allHeaders.push(field.fieldName);
    }
  }

  if (allHeaders.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No fields defined yet. Please add entity fields first before downloading a template.',
    });
  }

  // Create empty worksheet with only headers
  const wsData = [allHeaders]; // first row = headers
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-width columns
  worksheet['!cols'] = allHeaders.map(h => ({ wch: Math.max(h.length + 4, 15) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=data_template.xlsx');
  res.send(buffer);
});
