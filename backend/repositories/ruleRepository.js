const Rule = require('../models/Rule');

class RuleRepository {
  async create(ruleData) {
    return Rule.create(ruleData);
  }

  async findById(id) {
    return Rule.findById(id).populate('createdBy', 'name email');
  }

  async findAll(filter = {}) {
    return Rule.find({ ...filter, isDeleted: false })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async findActive() {
    return Rule.find({ isActive: true, isDeleted: false }).sort({ createdAt: -1 });
  }

  async findByIds(ids) {
    return Rule.find({ _id: { $in: ids }, isActive: true, isDeleted: false });
  }

  async update(id, updateData) {
    return Rule.findOneAndUpdate(
      { _id: id, isDeleted: false }, 
      updateData, 
      {
        new: true,
        runValidators: true,
      }
    ).populate('createdBy', 'name email');
  }

  async softDelete(id) {
    return Rule.findByIdAndUpdate(
      id,
      { isDeleted: true, isActive: false },
      { new: true }
    );
  }

  async countActive() {
    return Rule.countDocuments({ isActive: true, isDeleted: false });
  }
}

module.exports = new RuleRepository();
