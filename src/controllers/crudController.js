const AppError = require('../utils/AppError');
const { validateFields, pickFields, parseId } = require('../utils/validators');

// Patients and doctors have the same 5 CRUD operations, so both controllers are built
// from this one function instead of copy-pasting the code.
function crudController(model, rules, entityName) {
  function getIdOrFail(req) {
    const id = parseId(req.params.id);
    if (!id) throw new AppError(400, `${entityName} id must be a positive whole number`);
    return id;
  }

  function validateOrFail(body, partial) {
    const errors = validateFields(rules, body, partial);
    if (errors.length) throw new AppError(400, 'Validation failed', errors);
    return pickFields(rules, body);
  }

  return {
    async list(req, res) {
      res.json(await model.findAll());
    },

    async getOne(req, res) {
      const item = await model.findById(getIdOrFail(req));
      if (!item) throw new AppError(404, `${entityName} not found`);
      res.json(item);
    },

    async create(req, res) {
      const data = validateOrFail(req.body, false);
      res.status(201).json(await model.create(data));
    },

    async update(req, res) {
      const id = getIdOrFail(req);
      const data = validateOrFail(req.body, true);
      const item = await model.update(id, data);
      if (!item) throw new AppError(404, `${entityName} not found`);
      res.json(item);
    },

    async remove(req, res) {
      const deleted = await model.remove(getIdOrFail(req));
      if (!deleted) throw new AppError(404, `${entityName} not found`);
      res.status(204).end();
    },
  };
}

module.exports = crudController;
