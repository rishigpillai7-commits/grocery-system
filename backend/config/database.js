const { Sequelize } = require('sequelize');
const configs = require('./config');

const cfg = configs[process.env.NODE_ENV || 'development'];

// Single shared Sequelize instance (MySQL).
const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, {
  host: cfg.host,
  port: cfg.port,
  dialect: cfg.dialect,
  logging: cfg.logging,
  define: cfg.define,
});

module.exports = sequelize;
