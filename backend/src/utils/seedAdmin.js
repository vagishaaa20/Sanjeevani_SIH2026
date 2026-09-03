const sequelize = require('../config/db');
const { User, AdminProfile } = require('../models');
const { hashPassword } = require('./hash');
const { ROLES } = require('../config/roles');

async function seedAdmin() {
  const email = process.argv[2] || 'admin@sanjeevani.gov.in';
  const password = process.argv[3] || 'admin1234';

  console.log(`Seeding admin account: ${email}...`);

  await sequelize.authenticateDatabase();
  await sequelize.sync();

  const t = await sequelize.transaction();
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`User with email ${email} already exists.`);
      await t.rollback();
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      role: ROLES.ADMIN,
      isVerified: true,
    }, { transaction: t });

    await AdminProfile.create({
      userId: user.id,
      facilityId: 'HQ-DELHI',
      permissionScope: { superAdmin: true },
    }, { transaction: t });

    await t.commit();
    console.log('✓ Admin user successfully seeded.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    await t.rollback();
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
