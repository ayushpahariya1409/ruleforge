const EntityField = require('../models/sql/EntityField');
const User = require('../models/sql/User');

class SchemaRepository {
  async create(fieldData) {
    return EntityField.create(fieldData);
  }

  async findAll(filter = {}) {
    return EntityField.findAll({
      where: filter,
      include: [{ model: User, attributes: ['name', 'email'] }],
      order: [['category', 'ASC'], ['fieldName', 'ASC']],
    });
  }

  async findByCategory(category) {
    return EntityField.findAll({
      where: { category },
      include: [{ model: User, attributes: ['name', 'email'] }],
      order: [['fieldName', 'ASC']],
    });
  }

  async findById(id) {
    return EntityField.findByPk(id, {
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
  }

  async findByFieldName(category, fieldName) {
    return EntityField.findOne({ where: { category, fieldName } });
  }


  async getAllFieldNames() {
    return EntityField.findAll({
      attributes: ['category', 'fieldName', 'dataType'],
    });
  }
}

module.exports = new SchemaRepository();
