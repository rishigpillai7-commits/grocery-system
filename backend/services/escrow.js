const { Milestone } = require('../models');

const IN_ESCROW = ['funded', 'submitted', 'disputed'];

/**
 * Money summary for one project, computed from its milestones.
 *  allocated : sum of milestone amounts that still count against the budget (not refunded)
 *  inEscrow  : money currently held (funded / submitted / disputed)
 *  released  : money paid out to the freelancer
 *  unfunded  : milestones not yet funded by the client
 */
async function projectTotals(projectId, { excludeMilestoneId, transaction } = {}) {
  const milestones = await Milestone.findAll({
    where: { projectId },
    attributes: ['id', 'amount', 'status'],
    transaction,
  });

  const totals = { allocated: 0, inEscrow: 0, released: 0, unfunded: 0, refunded: 0, count: milestones.length };
  for (const m of milestones) {
    const amount = Number(m.amount);
    if (excludeMilestoneId && m.id === excludeMilestoneId) continue;
    if (m.status !== 'refunded') totals.allocated += amount;
    if (IN_ESCROW.includes(m.status)) totals.inEscrow += amount;
    if (m.status === 'released') totals.released += amount;
    if (m.status === 'pending') totals.unfunded += amount;
    if (m.status === 'refunded') totals.refunded += amount;
  }
  return totals;
}

module.exports = { projectTotals, IN_ESCROW };
