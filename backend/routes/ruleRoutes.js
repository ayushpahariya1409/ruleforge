const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validate');
const {
  createRuleSchema,
  updateRuleSchema,
  testRuleSchema,
} = require('../validators/ruleValidator');

// All routes require authentication
router.use(authenticate);

// Anyone can read rules
router.get('/', ruleController.getAllRules);
router.get('/:id', ruleController.getRuleById);

// Only admin can create/edit/delete rules
router.post('/', authorize('admin'), validate(createRuleSchema), ruleController.createRule);
router.put('/:id', authorize('admin'), validate(updateRuleSchema), ruleController.updateRule);
router.delete('/:id', authorize('admin'), ruleController.deleteRule);

// Admin can test rules
router.post('/test', authorize('admin'), validate(testRuleSchema), ruleController.testRule);

module.exports = router;
