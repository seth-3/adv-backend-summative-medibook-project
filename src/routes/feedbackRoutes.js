const express = require('express');
const controller = require('../controllers/feedbackController');

const router = express.Router();

router.get('/', controller.showForm);
router.post('/', express.urlencoded({ extended: false }), controller.submit);

module.exports = router;
