const env = require('./src/config/env');
const app = require('./src/app');
const sequelize = require('./src/config/db');
require('./src/models');

async function startServer() {
  await sequelize.authenticate();
  console.log('PostgreSQL connection established.');
  await sequelize.sync();

  // Safely ensure new columns exist in PostgreSQL without destructive alter
  try {
    await sequelize.query('ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "bloodGroup" VARCHAR(10);');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "duration" VARCHAR(120);');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "painLevel" INTEGER;');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "affectedArea" VARCHAR(120);');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "attachments" JSONB DEFAULT \'[]\'::jsonb;');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "triageAnalysis" JSONB;');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "originalAiAnalysis" JSONB;');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "hitlStatus" VARCHAR(50) DEFAULT \'PENDING\';');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "hitlReviewerId" UUID;');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "hitlReviewerName" VARCHAR(200);');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "hitlReviewedAt" TIMESTAMP WITH TIME ZONE;');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "hitlOverrideNotes" TEXT;');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "isHitlOverridden" BOOLEAN DEFAULT FALSE;');
    await sequelize.query('ALTER TABLE "patient_requests" ADD COLUMN IF NOT EXISTS "hitlTimerExpiresAt" TIMESTAMP WITH TIME ZONE;');
  } catch (colErr) {
    console.warn('Column check warning (non-fatal):', colErr.message);
  }

  // Seed default verified reviewer if not already present
  try {
    const { User, ReviewerProfile } = require('./src/models');
    const { hashPassword } = require('./src/utils/hash');
    const existingReviewer = await User.findOne({ where: { email: 'reviewer@sanjeevani.gov.in' } });
    if (!existingReviewer) {
      const revUser = await User.create({
        email: 'reviewer@sanjeevani.gov.in',
        passwordHash: await hashPassword('reviewer1234'),
        role: 'hitl_reviewer',
        isVerified: true
      });
      await ReviewerProfile.create({
        userId: revUser.id,
        fullName: 'Dr. Anand Verma (MD, Reviewer)',
        city: 'Delhi',
        professionalCategory: 'Senior Medical Auditor',
        verificationStatus: 'VERIFIED',
        supervisionRequired: false
      });
      console.log('✓ Seeded default verified Reviewer (reviewer@sanjeevani.gov.in / reviewer1234)');
    }
  } catch (seedErr) {
    console.warn('Reviewer seed notice:', seedErr.message);
  }

  app.listen(env.port, () => console.log(`Sanjeevani API listening at http://localhost:${env.port}`));
}

startServer().catch((error) => {
  const details = error.message || (error.original && error.original.message) || String(error);
  console.error('Backend startup failed:', details);
  process.exitCode = 1;
});

module.exports = startServer;