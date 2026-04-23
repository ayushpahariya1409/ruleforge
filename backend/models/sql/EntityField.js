const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sqlDb');
const User = require('./User');

const EntityField = sequelize.define('EntityField', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category: {
    type: DataTypes.ENUM('users', 'products', 'orders'),
    allowNull: false,
  },
  fieldName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      is: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    },
  },
  dataType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'date'),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(200),
    defaultValue: '',
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['category', 'fieldName'],
    },
    {
      fields: ['category'],
    },
  ],
});

// Associations
User.hasMany(EntityField, { foreignKey: 'createdBy' });
EntityField.belongsTo(User, { foreignKey: 'createdBy' });

module.exports = EntityField;
