const patientModel = require('../models/patientModel');
const { patientRules } = require('../utils/validators');
const crudController = require('./crudController');

module.exports = crudController(patientModel, patientRules, 'Patient');
