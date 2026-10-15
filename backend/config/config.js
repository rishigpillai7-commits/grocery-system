require('dotenv').config();

// Shared by the app (config/database.js) and by sequelize-cli (.sequelizerc).
const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'freelance_escrow',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
  define: {
    underscored: true, // createdAt -> created_at, clientId -> client_id
    timestamps: true,
  },
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
