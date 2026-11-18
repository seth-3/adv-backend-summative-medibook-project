const express = require('express');
const controller = require('../controllers/waitlistController');

const router = express.Router();

router.post('/', controller.join);
router.get('/', controller.list);

module.exports = router;
