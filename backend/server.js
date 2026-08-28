const env = require('./src/config/env');
const app = require('./src/app');
const sequelize = require('./src/config/db');
require('./src/models');

async function startServer() {
  await sequelize.authenticate();
  console.log('PostgreSQL connection established.');
  await sequelize.sync();
  app.listen(env.port, () => console.log(`Sanjeevani API listening at http://localhost:${env.port}`));
}

startServer().catch((error) => {
  const details = error.message || (error.original && error.original.message) || String(error);
  console.error('Backend startup failed:', details);
  process.exitCode = 1;
});

module.exports = startServer;