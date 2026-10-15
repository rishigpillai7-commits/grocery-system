// Escrow lifecycle of a milestone payment:
// pending -> funded -> submitted -> released
//                  \-> disputed -> refunded / (back to funded by admin, not modelled)
const MILESTONE_STATUSES = ['pending', 'funded', 'submitted', 'disputed', 'released', 'refunded'];

module.exports = (sequelize, DataTypes) => {
  const Milestone = sequelize.define(
    'Milestone',
    {
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Milestone title is required' },
          len: { args: [3, 150], msg: 'Milestone title must be 3-150 characters' },
        },
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          positive(value) {
            if (!(Number(value) > 0)) throw new Error('Milestone amount must be greater than 0');
          },
        },
      },
      status: {
        type: DataTypes.ENUM(...MILESTONE_STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: { isDate: { msg: 'Due date must be a valid date (YYYY-MM-DD)' } },
      },
    },
    { tableName: 'milestones' }
  );
  Milestone.STATUSES = MILESTONE_STATUSES;
  return Milestone;
};
