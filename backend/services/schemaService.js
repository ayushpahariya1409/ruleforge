const schemaRepository = require('../repositories/schemaRepository');
const ruleRepository = require('../repositories/ruleRepository');
const ApiError = require('../utils/ApiError');

class SchemaService {

  /**
   * Get all fields as a flat list of fieldNames, grouped by category.
   */
  async getAllFields() {
    return schemaRepository.findAll();
  }


  async getFieldsGrouped() {
    const fields = await schemaRepository.getAllFieldNames();
    const grouped = { users: [], products: [], orders: [] };
    for (const f of fields) {
      if (grouped[f.category]) {
        grouped[f.category].push({
          fieldName: f.fieldName,
          dataType: f.dataType,
        });
      }
    }
    return grouped;
  }

  async getFieldById(id) {
    const field = await schemaRepository.findById(id);
    if (!field) {
      throw ApiError.notFound('Field not found');
    }
    return field;
  }

  /**
   * Get all field names as a flat array (for template generation).
   */
  async getAllFieldNamesFlat() {
    const fields = await schemaRepository.getAllFieldNames();
    return fields.map(f => f.fieldName);
  }
}

module.exports = new SchemaService();
