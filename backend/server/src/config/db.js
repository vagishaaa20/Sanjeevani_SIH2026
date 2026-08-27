const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? false : false,
});

async function authenticateDatabase() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established.');
  } catch (error) {
    const details = error.message || (error.original && error.original.message) || String(error);
    console.error(`Unable to connect to PostgreSQL at ${env.db.host}:${env.db.port}/${env.db.name}: ${details}`);
    throw error;
  }
}

module.exports = sequelize;
module.exports.authenticateDatabase = authenticateDatabase;