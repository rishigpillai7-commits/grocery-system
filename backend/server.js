require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✔ MySQL connection established');
    app.listen(PORT, () => console.log(`✔ API running on http://localhost:${PORT}/api`));
  } catch (err) {
    console.error('✘ Could not connect to MySQL:', err.message);
    console.error('  Check DB_USER / DB_PASS / DB_NAME in backend/.env and that MySQL is running,');
    console.error('  then run: npm run setup');
    process.exit(1);
  }
})();
