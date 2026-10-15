const PROJECT_STATUSES = ['open', 'in_progress', 'completed', 'cancelled'];

module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    'Project',
    {
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Title is required' },
          len: { args: [3, 150], msg: 'Title must be 3-150 characters' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      budget: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          positive(value) {
            if (!(Number(value) > 0)) throw new Error('Budget must be greater than 0');
          },
        },
      },
      status: {
        type: DataTypes.ENUM(...PROJECT_STATUSES),
        allowNull: false,
        defaultValue: 'open',
        validate: { isIn: { args: [PROJECT_STATUSES], msg: `Status must be one of: ${PROJECT_STATUSES.join(', ')}` } },
      },
      deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: { isDate: { msg: 'Deadline must be a valid date (YYYY-MM-DD)' } },
      },
    },
    {
      tableName: 'projects',
      validate: {
        // Custom data check: a NEW project cannot have a deadline in the past.
        deadlineNotInPast() {
          if (this.isNewRecord && this.deadline) {
            const today = new Date().toISOString().slice(0, 10);
            if (String(this.deadline) < today) {
              throw new Error('Deadline cannot be in the past');
            }
          }
        },
      },
    }
  );
  Project.STATUSES = PROJECT_STATUSES;
  return Project;
};
