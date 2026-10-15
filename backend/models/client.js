module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define(
    'Client',
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
      company: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
    },
    { tableName: 'clients' }
  );
  return Client;
};
