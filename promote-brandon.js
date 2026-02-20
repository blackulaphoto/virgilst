import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

console.log('\n🔧 Promoting Brandon Vasquez to admin...\n');

try {
  await sql`
    UPDATE users
    SET role = 'admin'
    WHERE "openId" = 'google:105670340387881902123'
  `;

  console.log('✅ Success! Brandon Vasquez is now an admin.\n');

  // Verify the change
  const user = await sql`
    SELECT id, "openId", role, email, name
    FROM users
    WHERE "openId" = 'google:105670340387881902123'
  `;

  console.log('Updated user:');
  console.table(user);

  console.log('\n📋 NEXT STEPS:');
  console.log('   1. Go to your app in the browser');
  console.log('   2. Sign out completely');
  console.log('   3. Sign in again with Google');
  console.log('   4. You should now see the "Admin" button in the top nav');
  console.log('   5. Click it to access the admin dashboard\n');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await sql.end();
}
