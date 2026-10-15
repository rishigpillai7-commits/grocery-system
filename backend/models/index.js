const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = require('./client')(sequelize, DataTypes);
const Freelancer = require('./freelancer')(sequelize, DataTypes);
const Project = require('./project')(sequelize, DataTypes);
const Milestone = require('./milestone')(sequelize, DataTypes);
const Task = require('./task')(sequelize, DataTypes);
const EscrowTransaction = require('./escrowTransaction')(sequelize, DataTypes);

/* ---------------- Associations ----------------
 * Client     1 : M  Project            (a client creates many projects)
 * Freelancer 1 : M  Project            (a freelancer is hired on many projects)
 * Project    1 : M  Milestone          (milestone payments held in escrow)
 * Milestone  1 : M  Task               (tasks tracked under each milestone)
 * Milestone  1 : M  EscrowTransaction  (ledger of deposits / releases / refunds)
 */
Client.hasMany(Project, {
  foreignKey: { name: 'clientId', allowNull: false },
  as: 'projects',
  onDelete: 'RESTRICT',
});
Project.belongsTo(Client, {
  foreignKey: { name: 'clientId', allowNull: false },
  as: 'client',
});

Freelancer.hasMany(Project, {
  foreignKey: { name: 'freelancerId', allowNull: true },
  as: 'projects',
  onDelete: 'SET NULL',
});
Project.belongsTo(Freelancer, {
  foreignKey: { name: 'freelancerId', allowNull: true },
  as: 'freelancer',
});

Project.hasMany(Milestone, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'milestones',
  onDelete: 'CASCADE',
});
Milestone.belongsTo(Project, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'project',
});

Milestone.hasMany(Task, {
  foreignKey: { name: 'milestoneId', allowNull: false },
  as: 'tasks',
  onDelete: 'CASCADE',
});
Task.belongsTo(Milestone, {
  foreignKey: { name: 'milestoneId', allowNull: false },
  as: 'milestone',
});

Milestone.hasMany(EscrowTransaction, {
  foreignKey: { name: 'milestoneId', allowNull: false },
  as: 'transactions',
  onDelete: 'RESTRICT',
});
EscrowTransaction.belongsTo(Milestone, {
  foreignKey: { name: 'milestoneId', allowNull: false },
  as: 'milestone',
});

module.exports = {
  sequelize,
  Client,
  Freelancer,
  Project,
  Milestone,
  Task,
  EscrowTransaction,
};
