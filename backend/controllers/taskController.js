const { Milestone, Task } = require('../models');
const { AppError, wrapAll } = require('../middleware/errorHandler');
const { pick, parseId } = require('../utils/helpers');

const FIELDS = ['title', 'isDone'];

const create = async (req, res) => {
  const milestoneId = parseId(req.params.milestoneId, 'milestoneId');
  const milestone = await Milestone.findByPk(milestoneId);
  if (!milestone) throw new AppError(404, 'Milestone not found');
  if (['released', 'refunded'].includes(milestone.status)) {
    throw new AppError(409, `Cannot add tasks to a ${milestone.status} milestone`);
  }
  const task = await Task.create({ ...pick(req.body, FIELDS), milestoneId });
  res.status(201).json(task);
};

const update = async (req, res) => {
  const task = await Task.findByPk(parseId(req.params.id));
  if (!task) throw new AppError(404, 'Task not found');
  await task.update(pick(req.body, FIELDS));
  res.json(task);
};

const remove = async (req, res) => {
  const task = await Task.findByPk(parseId(req.params.id));
  if (!task) throw new AppError(404, 'Task not found');
  await task.destroy();
  res.status(204).send();
};

module.exports = wrapAll({ create, update, remove });
