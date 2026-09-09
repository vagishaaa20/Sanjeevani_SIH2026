const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = require('./src/config/db');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        await sequelize.query(`
            ALTER TABLE health_worker_referrals 
            ADD COLUMN IF NOT EXISTS "toDoctorId" UUID REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('Added toDoctorId column');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

run();
