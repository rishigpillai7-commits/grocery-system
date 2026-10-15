const { Freelancer, Project } = require('../models');
const { AppError, wrapAll } = require('../middleware/errorHandler');
const { pick, parseId } = require('../utils/helpers');

const FIELDS = ['name', 'email', 'skills', 'hourlyRate'];

const list = async (req, res) => {
  const freelancers = await Freelancer.findAll({ order: [['id', 'ASC']] });
  res.json(freelancers);
};

const get = async (req, res) => {
  const freelancer = await Freelancer.findByPk(parseId(req.params.id), {
    include: [{ model: Project, as: 'projects' }],
  });
  if (!freelancer) throw new AppError(404, 'Freelancer not found');
  res.json(freelancer);
};

const create = async (req, res) => {
  const freelancer = await Freelancer.create(pick(req.body, FIELDS));
  res.status(201).json(freelancer);
};

const update = async (req, res) => {
  const freelancer = await Freelancer.findByPk(parseId(req.params.id));
  if (!freelancer) throw new AppError(404, 'Freelancer not found');
  await freelancer.update(pick(req.body, FIELDS));
  res.json(freelancer);
};

const remove = async (req, res) => {
  const freelancer = await Freelancer.findByPk(parseId(req.params.id));
  if (!freelancer) throw new AppError(404, 'Freelancer not found');
  // Projects keep existing; their freelancer_id is set to NULL (ON DELETE SET NULL).
  await freelancer.destroy();
  res.status(204).send();
};

module.exports = wrapAll({ list, get, create, update, remove });
