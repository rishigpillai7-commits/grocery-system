const { EscrowTransaction, Milestone, Project } = require('../models');
const { AppError, wrapAll } = require('../middleware/errorHandler');
const { parseId } = require('../utils/helpers');

const TYPES = ['deposit', 'release', 'refund'];

// GET /api/transactions?projectId=&type=
const list = async (req, res) => {
  const where = {};
  if (req.query.type) {
    if (!TYPES.includes(req.query.type)) {
      throw new AppError(400, `type must be one of: ${TYPES.join(', ')}`);
    }
    where.type = req.query.type;
  }

  const milestoneInclude = {
    model: Milestone,
    as: 'milestone',
    attributes: ['id', 'title', 'projectId'],
    include: [{ model: Project, as: 'project', attributes: ['id', 'title'] }],
  };
  if (req.query.projectId) {
    milestoneInclude.where = { projectId: parseId(req.query.projectId, 'projectId') };
  }

  const rows = await EscrowTransaction.findAll({
    where,
    include: [milestoneInclude],
    order: [['id', 'DESC']],
  });
  res.json(rows);
};

module.exports = wrapAll({ list });
