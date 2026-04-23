const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', resultController.getEvaluations);
router.get('/stats', resultController.getStats);
router.get('/:id', resultController.getEvaluationById);

module.exports = router;
