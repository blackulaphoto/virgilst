import postgres from 'postgres';

// Get DATABASE_URL from Railway
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not set');
  console.log('Run: railway run node change-db-password.js');
  process.exit(1);
}

const newPassword = 'GvAAOwCYJb9UuK1ZFa0dyNKqpYzoTF21';

console.log('\n🔐 Changing PostgreSQL password...\n');

const sql = postgres(dbUrl);

try {
  await sql`ALTER USER postgres WITH PASSWORD ${newPassword}`;
  console.log('✅ Password changed successfully!');
  console.log('\nNew password:', newPassword);
  console.log('\nNow update the DATABASE_URL in Railway with this new password.\n');
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await sql.end();
}
