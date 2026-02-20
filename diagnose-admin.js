import postgres from 'postgres';

console.log('\n🔍 ADMIN ACCESS DIAGNOSTIC TOOL\n');
console.log('=' .repeat(60));

// Check environment
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set in environment');
  console.log('\n📋 To fix this:');
  console.log('   Set DATABASE_URL to your Railway PostgreSQL connection string');
  console.log('   Then run: node diagnose-admin.js');
  process.exit(1);
}

console.log('✅ DATABASE_URL found:', dbUrl.substring(0, 30) + '...');

const sql = postgres(dbUrl);

async function diagnose() {
  try {
    console.log('\n📊 CHECKING DATABASE CONNECTION...');
    const testQuery = await sql`SELECT 1 as test`;
    console.log('✅ Database connected successfully');

    console.log('\n📊 CHECKING USERS TABLE...');
    const users = await sql`
      SELECT id, "openId", role, email, name, "createdAt"
      FROM users
      ORDER BY id
    `;

    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('\n🔧 ACTION NEEDED:');
      console.log('   1. Sign in to your app at least once to create a user');
      console.log('   2. Then run this diagnostic again');
      await sql.end();
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);
    console.table(users.map(u => ({
      ID: u.id,
      OpenID: u.openId?.substring(0, 30) + (u.openId?.length > 30 ? '...' : ''),
      Role: u.role,
      Email: u.email || 'N/A',
      Name: u.name || 'N/A',
      Created: new Date(u.createdAt * 1000).toLocaleDateString()
    })));

    // Find admins
    const admins = users.filter(u => u.role === 'admin');
    const nonAdmins = users.filter(u => u.role !== 'admin');

    console.log('\n📊 ADMIN STATUS:');
    console.log(`   Admins: ${admins.length}`);
    console.log(`   Non-admins: ${nonAdmins.length}`);

    if (admins.length === 0) {
      console.log('\n⚠️  NO ADMIN USERS FOUND!');
      console.log('\n🔧 ACTION NEEDED:');

      if (users.length === 1) {
        const user = users[0];
        console.log(`\n   Promoting user: ${user.openId}`);
        await sql`
          UPDATE users
          SET role = 'admin'
          WHERE "openId" = ${user.openId}
        `;
        console.log('   ✅ User promoted to admin!');
      } else {
        console.log('\n   Multiple users found. Which one should be admin?');
        users.forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.openId} (${u.email || 'no email'})`);
        });
        console.log('\n   To promote a specific user, run:');
        console.log('   node --input-type=module -e "import postgres from \'postgres\'; const sql=postgres(process.env.DATABASE_URL); await sql`UPDATE users SET role=\'admin\' WHERE openId=\'<OPENID>\'`; console.log(\'done\'); await sql.end();"');
      }
    } else {
      console.log('\n✅ Admin users found:');
      admins.forEach(admin => {
        console.log(`   - ${admin.openId} (${admin.email || 'no email'})`);
      });
    }

    // Check if current session might be the issue
    console.log('\n📊 TROUBLESHOOTING STEPS:');
    console.log('   1. Clear your browser cookies and cache');
    console.log('   2. Sign out and sign in again');
    console.log('   3. Check browser console for errors (F12)');
    console.log('   4. Verify the "Admin" button appears on homepage after sign-in');
    console.log('   5. If button appears, check what happens when you click it');

    // Final state
    console.log('\n📊 FINAL USER STATE:');
    const finalUsers = await sql`
      SELECT id, "openId", role
      FROM users
      ORDER BY id
    `;
    console.table(finalUsers.map(u => ({
      ID: u.id,
      OpenID: u.openId?.substring(0, 40),
      Role: u.role
    })));

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnostic complete!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

diagnose();
