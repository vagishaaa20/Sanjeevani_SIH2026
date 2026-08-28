// backend/scripts/seedAdmin.js
const bcrypt = require('bcrypt'); // change to require('bcryptjs') if that's what your login route uses
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/db');
const User = require('../models/User');
const AdminProfile = require('../models/AdminProfile');
const { ROLES } = require('../config/roles');

async function seedAdmin() {
  await sequelize.authenticate();

  const email = 'admin@sanjeevani.gov.in';
  const plainPassword = 'admin1234';
  const saltRounds = 10;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log('Admin user already exists:', existing.id);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

  const user = await User.create({
    id: uuidv4(),
    email,
    passwordHash,
    role: ROLES.ADMIN, // confirm this matches the exact key name in your roles.js
    isVerified: true,
  });

  await AdminProfile.create({
    userId: user.id,
    facilityId: null,
    permissionScope: { all: true },
  });

  console.log('Admin user created:', user.id);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});