const sequelize = require('./src/config/db');

async function check() {
    try {
        const [results] = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'enum_health_worker_referrals_status';
        `);
        console.log('Current ENUM values:', results.map(r => r.enumlabel));
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
check();
