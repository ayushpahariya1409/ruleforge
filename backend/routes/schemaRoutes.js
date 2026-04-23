const express = require('express');
const router = express.Router();
const schemaController = require('../controllers/schemaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validate');


// All routes require authentication
router.use(authenticate);

// Anyone can read schema fields (needed for upload template & rule viewing)
router.get('/', schemaController.getAllFields);
router.get('/grouped', schemaController.getFieldsGrouped);
router.get('/template', schemaController.downloadTemplate);
router.get('/:id', schemaController.getFieldById);


module.exports = router;
