const doctorModel = require('../models/doctorModel');
const { doctorRules } = require('../utils/validators');
const crudController = require('./crudController');

module.exports = crudController(doctorModel, doctorRules, 'Doctor');
