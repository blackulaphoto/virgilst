import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('Make sure your .env file contains the Railway PostgreSQL connection string');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function fixAdminRole() {
  try {
    // First, let's see all users
    console.log('\n📋 Current users in database:');
    const users = await sql`
      SELECT id, "openId", role, "createdAt"
      FROM users
      ORDER BY id
    `;

    console.table(users);

    if (users.length === 0) {
      console.log('\n⚠️  No users found. You need to sign in first to create a user record.');
      await sql.end();
      return;
    }

    // Find Google OAuth users
    const googleUsers = users.filter(u => u.openId?.startsWith('google:'));

    if (googleUsers.length === 0) {
      console.log('\n⚠️  No Google users found. Please sign in with Google first.');
      await sql.end();
      return;
    }

    // If there's only one Google user, promote them automatically
    if (googleUsers.length === 1) {
      const user = googleUsers[0];
      console.log(`\n🎯 Promoting user ${user.openId} to admin...`);

      await sql`
        UPDATE users
        SET role = 'admin'
        WHERE "openId" = ${user.openId}
      `;

      console.log('✅ User promoted to admin successfully!');
    } else {
      // Multiple Google users - show them and ask which to promote
      console.log('\n🤔 Multiple Google users found. To promote a specific user to admin, run:');
      console.log('\nnode --input-type=module -e "import postgres from \'postgres\'; const sql=postgres(process.env.DATABASE_URL); await sql`UPDATE users SET role=\'admin\' WHERE openId=\'YOUR_OPENID_HERE\'`; console.log(\'done\'); await sql.end();"');
      console.log('\nReplace YOUR_OPENID_HERE with one of the openId values from the table above.');
    }

    // Show final state
    console.log('\n📋 Updated users:');
    const updatedUsers = await sql`
      SELECT id, "openId", role, "createdAt"
      FROM users
      ORDER BY id
    `;
    console.table(updatedUsers);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

fixAdminRole();
