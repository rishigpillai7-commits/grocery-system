const { Op } = require('sequelize');
const { Client, Freelancer, Project, Milestone, Task } = require('../models');
const { AppError, wrapAll } = require('../middleware/errorHandler');
const { pick, parseId } = require('../utils/helpers');
const { projectTotals } = require('../services/escrow');

const CREATE_FIELDS = ['title', 'description', 'budget', 'deadline', 'clientId', 'freelancerId'];
const UPDATE_FIELDS = ['title', 'description', 'budget', 'deadline', 'freelancerId', 'status'];
const SORTABLE = { createdAt: 'createdAt', budget: 'budget', deadline: 'deadline', title: 'title' };

const personAttrs = ['id', 'name', 'email'];

/**
 * GET /api/projects
 * Advanced filtering: ?status=&clientId=&freelancerId=&minBudget=&maxBudget=
 *                     &search=&sortBy=&order=&page=&limit=
 */
const list = async (req, res) => {
  const { status, clientId, freelancerId, minBudget, maxBudget, search } = req.query;
  const where = {};

  if (status) {
    if (!Project.STATUSES.includes(status)) {
      throw new AppError(400, `status must be one of: ${Project.STATUSES.join(', ')}`);
    }
    where.status = status;
  }
  if (clientId) where.clientId = parseId(clientId, 'clientId');
  if (freelancerId) where.freelancerId = parseId(freelancerId, 'freelancerId');

  if (minBudget !== undefined || maxBudget !== undefined) {
    where.budget = {};
    if (minBudget !== undefined && minBudget !== '') {
      if (Number.isNaN(Number(minBudget))) throw new AppError(400, 'minBudget must be a number');
      where.budget[Op.gte] = Number(minBudget);
    }
    if (maxBudget !== undefined && maxBudget !== '') {
      if (Number.isNaN(Number(maxBudget))) throw new AppError(400, 'maxBudget must be a number');
      where.budget[Op.lte] = Number(maxBudget);
    }
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const sortField = SORTABLE[req.query.sortBy] || 'createdAt';
  const direction = String(req.query.order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const { count, rows } = await Project.findAndCountAll({
    where,
    include: [
      { model: Client, as: 'client', attributes: personAttrs },
      { model: Freelancer, as: 'freelancer', attributes: personAttrs },
    ],
    order: [[sortField, direction], ['id', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  res.json({ total: count, page, limit, data: rows });
};

const get = async (req, res) => {
  const id = parseId(req.params.id);
  const project = await Project.findByPk(id, {
    include: [
      { model: Client, as: 'client', attributes: personAttrs.concat('company') },
      { model: Freelancer, as: 'freelancer', attributes: personAttrs.concat('skills') },
      {
        model: Milestone,
        as: 'milestones',
        include: [{ model: Task, as: 'tasks' }],
      },
    ],
    order: [
      [{ model: Milestone, as: 'milestones' }, 'id', 'ASC'],
      [{ model: Milestone, as: 'milestones' }, { model: Task, as: 'tasks' }, 'id', 'ASC'],
    ],
  });
  if (!project) throw new AppError(404, 'Project not found');

  const escrow = await projectTotals(id);
  res.json({ ...project.toJSON(), escrow });
};

const create = async (req, res) => {
  const data = pick(req.body, CREATE_FIELDS);

  if (!data.clientId) throw new AppError(400, 'clientId is required');
  const client = await Client.findByPk(parseId(data.clientId, 'clientId'));
  if (!client) throw new AppError(404, 'Client not found');

  if (data.freelancerId) {
    const freelancer = await Freelancer.findByPk(parseId(data.freelancerId, 'freelancerId'));
    if (!freelancer) throw new AppError(404, 'Freelancer not found');
    data.status = 'in_progress';
  } else {
    delete data.freelancerId;
  }

  const project = await Project.create(data);
  res.status(201).json(project);
};

const update = async (req, res) => {
  const project = await Project.findByPk(parseId(req.params.id));
  if (!project) throw new AppError(404, 'Project not found');

  const data = pick(req.body, UPDATE_FIELDS);

  if (data.freelancerId) {
    const freelancer = await Freelancer.findByPk(parseId(data.freelancerId, 'freelancerId'));
    if (!freelancer) throw new AppError(404, 'Freelancer not found');
    if (project.status === 'open' && !data.status) data.status = 'in_progress';
  } else if ('freelancerId' in data) {
    data.freelancerId = null;
  }

  const totals = await projectTotals(project.id);

  if (data.budget !== undefined && Number(data.budget) < totals.allocated) {
    throw new AppError(422, `Budget cannot be lower than the milestones already planned (${totals.allocated})`);
  }
  if (data.status === 'cancelled' && totals.inEscrow > 0) {
    throw new AppError(409, 'Refund or release the money held in escrow before cancelling the project');
  }

  await project.update(data);
  res.json(project);
};

const remove = async (req, res) => {
  const project = await Project.findByPk(parseId(req.params.id));
  if (!project) throw new AppError(404, 'Project not found');

  const milestones = await Milestone.count({
    where: { projectId: project.id, status: { [Op.ne]: 'pending' } },
  });
  if (milestones > 0) {
    throw new AppError(409, 'Projects with funded or settled milestones cannot be deleted (escrow history is kept)');
  }

  await project.destroy(); // pending milestones + tasks are removed by ON DELETE CASCADE
  res.status(204).send();
};

module.exports = wrapAll({ list, get, create, update, remove });
