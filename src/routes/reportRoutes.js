const express = require('express');
const controller = require('../controllers/reportController');

const router = express.Router();

router.get('/doctors', controller.doctorsReport);
router.get('/busy-days', controller.busyDaysReport);

module.exports = router;
