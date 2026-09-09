const sequelize = require('./src/config/db');
async function querySchema() {
  await sequelize.authenticateDatabase();
  const res = await sequelize.query(`
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND (
          tc.table_name IN ('health_worker_coverages', 'areas', 'villages', 'districts', 'states', 'patient_profiles', 'health_worker_profiles') 
          OR ccu.table_name IN ('health_worker_coverages', 'areas', 'villages', 'districts', 'states')
      );
  `);
  console.log(JSON.stringify(res[0], null, 2));

  // Get schema of tables for the down script
  const tables = ['states', 'districts', 'villages', 'areas', 'health_worker_coverages'];
  for (const t of tables) {
    const columns = await sequelize.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${t}';
    `);
    console.log(`\nTable ${t}:`, JSON.stringify(columns[0], null, 2));
  }
  await sequelize.close();
}
querySchema().catch(console.error);
