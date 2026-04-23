const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');
const { evaluateSchema } = require('../validators/uploadValidator');

router.use(authenticate);

router.post('/', validate(evaluateSchema), evaluationController.evaluate);
router.get('/:id/results', evaluationController.getEvaluationResults);

module.exports = router;
