const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'sanjeevani',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || process.env.DB_PSWD || 'admin123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {}, // 👈 Disables SSL for local development
  }
);

module.exports = sequelize;