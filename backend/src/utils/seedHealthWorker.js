const sequelize = require('../config/db');
const { User, HealthWorkerProfile } = require('../models');
const { hashPassword } = require('./hash');
const { ROLES } = require('../constants/roles');

async function seedHealthWorker() {
  const email = process.argv[2] || 'worker@sanjeevani.gov.in';
  const password = process.argv[3] || 'worker1234';
  const name = process.argv[4] || 'Sanjeevani Health Worker';

  await sequelize.authenticateDatabase();
  await sequelize.sync();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log(`User with email ${email} already exists.`);
    await sequelize.close();
    return;
  }

  const user = await User.create({ email, passwordHash: await hashPassword(password), role: ROLES.HEALTH_WORKER, isVerified: true });
  await HealthWorkerProfile.create({ userId: user.id, name, workerType: 'COMMUNITY_WORKER', isVerified: true });
  console.log(`Health Worker created: ${email}`);
  console.log(`Password: ${password}`);
  await sequelize.close();
}

seedHealthWorker().catch(async (error) => {
  console.error('Error seeding health worker:', error.message);
  await sequelize.close();
  process.exitCode = 1;
});