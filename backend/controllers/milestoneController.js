const { sequelize, Project, Milestone, Task, EscrowTransaction } = require('../models');
const { AppError, wrapAll } = require('../middleware/errorHandler');
const { pick, parseId } = require('../utils/helpers');
const { projectTotals } = require('../services/escrow');

const FIELDS = ['title', 'amount', 'dueDate'];

/**
 * Escrow state machine.
 *   action   : allowed current statuses -> new status, ledger entry written
 */
const ACTIONS = {
  fund:    { from: ['pending'],                         to: 'funded',    ledger: 'deposit', note: 'Client funded milestone into escrow' },
  submit:  { from: ['funded'],                          to: 'submitted', ledger: null },
  release: { from: ['submitted'],                       to: 'released',  ledger: 'release', note: 'Escrow released to freelancer' },
  dispute: { from: ['funded', 'submitted'],             to: 'disputed',  ledger: null },
  refund:  { from: ['funded', 'submitted', 'disputed'], to: 'refunded',  ledger: 'refund',  note: 'Escrow refunded to client' },
};

const withDetails = (id, transaction) =>
  Milestone.findByPk(id, {
    include: [
      { model: Task, as: 'tasks' },
      { model: EscrowTransaction, as: 'transactions' },
      { model: Project, as: 'project', attributes: ['id', 'title', 'budget', 'status', 'clientId', 'freelancerId'] },
    ],
    order: [
      [{ model: Task, as: 'tasks' }, 'id', 'ASC'],
      [{ model: EscrowTransaction, as: 'transactions' }, 'id', 'ASC'],
    ],
    transaction,
  });

const listForProject = async (req, res) => {
  const projectId = parseId(req.params.projectId, 'projectId');
  const project = await Project.findByPk(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  const milestones = await Milestone.findAll({
    where: { projectId },
    include: [{ model: Task, as: 'tasks' }],
    order: [['id', 'ASC']],
  });
  res.json(milestones);
};

const get = async (req, res) => {
  const milestone = await withDetails(parseId(req.params.id));
  if (!milestone) throw new AppError(404, 'Milestone not found');
  res.json(milestone);
};

const create = async (req, res) => {
  const projectId = parseId(req.params.projectId, 'projectId');
  const project = await Project.findByPk(projectId);
  if (!project) throw new AppError(404, 'Project not found');
  if (['completed', 'cancelled'].includes(project.status)) {
    throw new AppError(409, `Cannot add milestones to a ${project.status} project`);
  }

  const data = pick(req.body, FIELDS);
  const amount = Number(data.amount);
  const totals = await projectTotals(projectId);
  if (Number.isFinite(amount) && totals.allocated + amount > Number(project.budget)) {
    throw new AppError(
      422,
      `Milestones would exceed the project budget (budget ${project.budget}, already planned ${totals.allocated})`
    );
  }

  const milestone = await Milestone.create({ ...data, projectId });
  res.status(201).json(milestone);
};

const update = async (req, res) => {
  const milestone = await Milestone.findByPk(parseId(req.params.id));
  if (!milestone) throw new AppError(404, 'Milestone not found');
  if (milestone.status !== 'pending') {
    throw new AppError(409, 'Only milestones that are not yet funded can be edited');
  }

  const data = pick(req.body, FIELDS);
  if (data.amount !== undefined) {
    const project = await Project.findByPk(milestone.projectId);
    const totals = await projectTotals(milestone.projectId, { excludeMilestoneId: milestone.id });
    if (totals.allocated + Number(data.amount) > Number(project.budget)) {
      throw new AppError(422, 'Milestones would exceed the project budget');
    }
  }

  await milestone.update(data);
  res.json(milestone);
};

const remove = async (req, res) => {
  const milestone = await Milestone.findByPk(parseId(req.params.id));
  if (!milestone) throw new AppError(404, 'Milestone not found');
  if (milestone.status !== 'pending') {
    throw new AppError(409, 'Only milestones that are not yet funded can be deleted');
  }
  await milestone.destroy(); // tasks removed by ON DELETE CASCADE
  res.status(204).send();
};

/**
 * POST /api/milestones/:id/action   body: { "action": "fund|submit|release|dispute|refund" }
 * Runs inside a DB transaction so the status change and the ledger entry stay consistent.
 */
const performAction = async (req, res) => {
  const id = parseId(req.params.id);
  const name = req.body && req.body.action;
  const rule = ACTIONS[name];
  if (!rule) {
    throw new AppError(400, `action must be one of: ${Object.keys(ACTIONS).join(', ')}`);
  }

  const result = await sequelize.transaction(async (t) => {
    const milestone = await Milestone.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!milestone) throw new AppError(404, 'Milestone not found');

    const project = await Project.findByPk(milestone.projectId, { transaction: t });

    if (!rule.from.includes(milestone.status)) {
      throw new AppError(409, `Cannot ${name} a milestone that is "${milestone.status}"`);
    }
    if (name === 'fund') {
      if (!project.freelancerId) {
        throw new AppError(409, 'Assign a freelancer to the project before funding a milestone');
      }
      if (['completed', 'cancelled'].includes(project.status)) {
        throw new AppError(409, `Cannot fund a milestone of a ${project.status} project`);
      }
    }

    await milestone.update({ status: rule.to }, { transaction: t });

    if (rule.ledger) {
      await EscrowTransaction.create(
        { milestoneId: milestone.id, type: rule.ledger, amount: milestone.amount, note: rule.note },
        { transaction: t }
      );
    }

    // When every active milestone has been released, the project is complete.
    if (name === 'release') {
      const all = await Milestone.findAll({ where: { projectId: project.id }, transaction: t });
      const active = all.filter((m) => m.status !== 'refunded');
      if (active.length > 0 && active.every((m) => m.status === 'released')) {
        await project.update({ status: 'completed' }, { transaction: t });
      }
    }

    return milestone.id;
  });

  res.json(await withDetails(result));
};

module.exports = wrapAll({ listForProject, get, create, update, remove, performAction });
