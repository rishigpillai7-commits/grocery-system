'use strict';

/**
 * Creates every table of the Freelance Escrow schema.
 * Column names are snake_case (the models use `underscored: true`).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    };

    await queryInterface.createTable('clients', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      company: { type: Sequelize.STRING(120), allowNull: true },
      ...timestamps,
    });

    await queryInterface.createTable('freelancers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      skills: { type: Sequelize.STRING(255), allowNull: true },
      hourly_rate: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      ...timestamps,
    });

    await queryInterface.createTable('projects', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      budget: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'open',
      },
      deadline: { type: Sequelize.DATEONLY, allowNull: true },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      freelancer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'freelancers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ...timestamps,
    });

    await queryInterface.createTable('milestones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: Sequelize.STRING(150), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'funded', 'submitted', 'disputed', 'released', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ...timestamps,
    });

    await queryInterface.createTable('tasks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      is_done: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      milestone_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'milestones', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ...timestamps,
    });

    await queryInterface.createTable('escrow_transactions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      type: { type: Sequelize.ENUM('deposit', 'release', 'refund'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      note: { type: Sequelize.STRING(255), allowNull: true },
      milestone_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'milestones', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      ...timestamps,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('escrow_transactions');
    await queryInterface.dropTable('tasks');
    await queryInterface.dropTable('milestones');
    await queryInterface.dropTable('projects');
    await queryInterface.dropTable('freelancers');
    await queryInterface.dropTable('clients');
  },
};
