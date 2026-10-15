const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { wrapAll } = require('../middleware/errorHandler');
const { parseId } = require('../utils/helpers');

const num = (v) => Number(v || 0);

/**
 * GET /api/reports/escrow-summary[?clientId=&freelancerId=]
 * RAW SQL: per-project escrow position (budget vs. in escrow vs. released vs. unfunded)
 * with grand totals. Uses JOINs, conditional aggregation and GROUP BY.
 */
const escrowSummary = async (req, res) => {
  const replacements = {};
  const conditions = [];
  if (req.query.clientId) {
    conditions.push('p.client_id = :clientId');
    replacements.clientId = parseId(req.query.clientId, 'clientId');
  }
  if (req.query.freelancerId) {
    conditions.push('p.freelancer_id = :freelancerId');
    replacements.freelancerId = parseId(req.query.freelancerId, 'freelancerId');
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await sequelize.query(
    `SELECT p.id,
            p.title,
            p.status,
            p.budget,
            c.name AS client_name,
            f.name AS freelancer_name,
            COUNT(m.id) AS milestone_count,
            COALESCE(SUM(CASE WHEN m.status IN ('funded','submitted','disputed') THEN m.amount END), 0) AS in_escrow,
            COALESCE(SUM(CASE WHEN m.status = 'released' THEN m.amount END), 0) AS released,
            COALESCE(SUM(CASE WHEN m.status = 'pending' THEN m.amount END), 0) AS unfunded
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       LEFT JOIN freelancers f ON f.id = p.freelancer_id
       LEFT JOIN milestones m ON m.project_id = p.id
       ${where}
      GROUP BY p.id, p.title, p.status, p.budget, c.name, f.name
      ORDER BY p.id`,
    { replacements, type: QueryTypes.SELECT }
  );

  const projects = rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    clientName: r.client_name,
    freelancerName: r.freelancer_name,
    budget: num(r.budget),
    milestoneCount: num(r.milestone_count),
    inEscrow: num(r.in_escrow),
    released: num(r.released),
    unfunded: num(r.unfunded),
  }));

  const totals = projects.reduce(
    (acc, p) => ({
      budget: acc.budget + p.budget,
      inEscrow: acc.inEscrow + p.inEscrow,
      released: acc.released + p.released,
      unfunded: acc.unfunded + p.unfunded,
    }),
    { budget: 0, inEscrow: 0, released: 0, unfunded: 0 }
  );

  res.json({ totals, projects });
};

/**
 * GET /api/reports/freelancer-earnings
 * RAW SQL: leaderboard of freelancers by released earnings.
 */
const freelancerEarnings = async (req, res) => {
  const rows = await sequelize.query(
    `SELECT f.id,
            f.name,
            f.skills,
            COUNT(DISTINCT p.id) AS project_count,
            COALESCE(SUM(CASE WHEN m.status = 'released' THEN m.amount END), 0) AS total_earned,
            COALESCE(SUM(CASE WHEN m.status IN ('funded','submitted','disputed') THEN m.amount END), 0) AS in_escrow
       FROM freelancers f
       LEFT JOIN projects p ON p.freelancer_id = f.id
       LEFT JOIN milestones m ON m.project_id = p.id
      GROUP BY f.id, f.name, f.skills
      ORDER BY total_earned DESC, f.name ASC`,
    { type: QueryTypes.SELECT }
  );

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      skills: r.skills,
      projectCount: num(r.project_count),
      totalEarned: num(r.total_earned),
      inEscrow: num(r.in_escrow),
    }))
  );
};

module.exports = wrapAll({ escrowSummary, freelancerEarnings });
