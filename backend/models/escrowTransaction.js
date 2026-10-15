// Immutable ledger of money moving in/out of escrow.
module.exports = (sequelize, DataTypes) => {
  const EscrowTransaction = sequelize.define(
    'EscrowTransaction',
    {
      type: {
        type: DataTypes.ENUM('deposit', 'release', 'refund'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          positive(value) {
            if (!(Number(value) > 0)) throw new Error('Transaction amount must be greater than 0');
          },
        },
      },
      note: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    { tableName: 'escrow_transactions' }
  );
  return EscrowTransaction;
};
