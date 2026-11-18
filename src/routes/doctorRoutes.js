const express = require('express');
const controller = require('../controllers/doctorController');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/:id/stats', reportController.doctorStats);

module.exports = router;
