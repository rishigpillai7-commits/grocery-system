const { Client, Project } = require('../models');
const { AppError, wrapAll } = require('../middleware/errorHandler');
const { pick, parseId } = require('../utils/helpers');

const FIELDS = ['name', 'email', 'company'];

const list = async (req, res) => {
  const clients = await Client.findAll({ order: [['id', 'ASC']] });
  res.json(clients);
};

const get = async (req, res) => {
  const client = await Client.findByPk(parseId(req.params.id), {
    include: [{ model: Project, as: 'projects' }],
  });
  if (!client) throw new AppError(404, 'Client not found');
  res.json(client);
};

const create = async (req, res) => {
  const client = await Client.create(pick(req.body, FIELDS));
  res.status(201).json(client);
};

const update = async (req, res) => {
  const client = await Client.findByPk(parseId(req.params.id));
  if (!client) throw new AppError(404, 'Client not found');
  await client.update(pick(req.body, FIELDS));
  res.json(client);
};

const remove = async (req, res) => {
  const client = await Client.findByPk(parseId(req.params.id));
  if (!client) throw new AppError(404, 'Client not found');
  // Foreign key is RESTRICT: a client that still owns projects cannot be deleted (409).
  await client.destroy();
  res.status(204).send();
};

module.exports = wrapAll({ list, get, create, update, remove });
