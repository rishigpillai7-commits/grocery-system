module.exports = (sequelize, DataTypes) => {
  const Freelancer = sequelize.define(
    'Freelancer',
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
          len: { args: [2, 100], msg: 'Name must be 2-100 characters' },
        },
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: { msg: 'A valid email address is required' } },
      },
      skills: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        validate: {
          nonNegative(value) {
            if (!(Number(value) >= 0)) throw new Error('Hourly rate must be 0 or more');
          },
        },
      },
    },
    { tableName: 'freelancers' }
  );
  return Freelancer;
};
