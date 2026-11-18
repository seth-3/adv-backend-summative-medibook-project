const express = require('express');
const controller = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', controller.book);
router.get('/:id', controller.getOne);
// a cancellation is a new thing we create for the appointment (the record itself is kept)
router.post('/:id/cancellation', controller.cancel);

module.exports = router;
