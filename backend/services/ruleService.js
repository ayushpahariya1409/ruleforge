
const ruleRepository = require('../repositories/ruleRepository');
const ApiError = require('../utils/ApiError');
const { getConditionHash } = require('../utils/conditionUtils');

class RuleService {
  /**
   * Create a new rule with duplicate logic detection
   * Handles string/number normalization and unique hash
   */
  async createRule(ruleData, userId) {
    // Validate fields if activating
    if (ruleData.isActive) {
      await this._validateRuleFields(ruleData.conditions);
    }

    // Compute unique hash of normalized conditions
    const ruleHash = getConditionHash(ruleData.conditions);

    try {
      const rule = await ruleRepository.create({
        ...ruleData,
        ruleHash,
        createdBy: userId,
      });
      return rule;
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.ruleHash) {
        throw ApiError.badRequest(
          'A rule with identical logic already exists (even if name or value format differs)'
        );
      }
      throw err;
    }
  }

  async getAllRules(includeInactive = false) {
    if (includeInactive) {
      return ruleRepository.findAll();
    }
    return ruleRepository.findActive();
  }

  async getRuleById(ruleId) {
    const rule = await ruleRepository.findById(ruleId);
    if (!rule) throw ApiError.notFound('Rule not found');
    return rule;
  }

  /**
   * Update a rule with duplicate logic detection
   */
  async updateRule(ruleId, updateData) {
    const existingRule = await ruleRepository.findById(ruleId);
    if (!existingRule) throw ApiError.notFound('Rule not found');

    // Validate if activating
    if (updateData.isActive === true) {
      const conditions = updateData.conditions || existingRule.conditions;
      await this._validateRuleFields(conditions);
    }

    // Recompute hash if conditions are updated
    if (updateData.conditions) {
      updateData.ruleHash = getConditionHash(updateData.conditions);
    }

    // Increment version
    updateData.version = (existingRule.version || 1) + 1;

    try {
      const updatedRule = await ruleRepository.update(ruleId, updateData);
      return updatedRule;
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.ruleHash) {
        throw ApiError.badRequest(
          'A rule with identical logic already exists (even if name or value format differs)'
        );
      }
      throw err;
    }
  }

  /**
   * Ensure all fields used in conditions exist in schema
   */
  async _validateRuleFields(conditions) {
    const schemaService = require('./schemaService');
    const allFields = await schemaService.getAllFields();
    const validFieldNames = allFields.map((f) => f.fieldName);

    const usedFields = this._extractFieldsFromConditions(conditions);

    for (const field of usedFields) {
      if (!validFieldNames.includes(field)) {
        throw ApiError.badRequest(
          `Cannot activate rule. Field "${field}" no longer exists in the schema.`
        );
      }
    }
  }

  _extractFieldsFromConditions(node) {
    if (!node) return [];
    const fields = new Set();
    const traverse = (n) => {
      if (n.field) fields.add(n.field);
      if (n.conditions && Array.isArray(n.conditions)) {
        n.conditions.forEach(traverse);
      }
    };
    traverse(node);
    return Array.from(fields);
  }

  async deleteRule(ruleId) {
    const rule = await ruleRepository.findById(ruleId);
    if (!rule) throw ApiError.notFound('Rule not found');
    return ruleRepository.softDelete(ruleId);
  }

  async testRule(conditions, sampleData) {
    const { evaluateCondition, generateReadableSummary } = require('./ruleEngine');
    const { matched, explanations } = evaluateCondition(conditions, sampleData);
    return {
      matched,
      explanation: explanations,
      summary: generateReadableSummary({ matched, explanation: explanations }),
    };
  }

  async getActiveCount() {
    return ruleRepository.countActive();
  }
}

module.exports = new RuleService();
