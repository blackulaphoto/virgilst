import postgres from 'postgres';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function rotatePassword() {
  console.log('\n🔐 PostgreSQL Password Rotation Tool\n');

  const currentUrl = process.env.DATABASE_URL;
  if (!currentUrl) {
    console.error('❌ DATABASE_URL environment variable not found!');
    console.log('Please set it first: export DATABASE_URL="your-current-connection-string"');
    process.exit(1);
  }

  console.log('Current DATABASE_URL found.');

  // Parse current URL
  const urlMatch = currentUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!urlMatch) {
    console.error('❌ Could not parse DATABASE_URL');
    process.exit(1);
  }

  const [, username, oldPassword, host, port, database] = urlMatch;

  console.log(`\nConnection Details:`);
  console.log(`  User: ${username}`);
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Database: ${database}`);

  // Get new password
  console.log('\n📝 Enter your new password:');
  console.log('   (Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))")\n');

  const newPassword = await question('New Password: ');

  if (!newPassword || newPassword.length < 20) {
    console.error('❌ Password must be at least 20 characters long!');
    process.exit(1);
  }

  console.log('\n⚠️  WARNING: This will change the database password.');
  console.log('   Make sure you update all services that use this database!\n');

  const confirm = await question('Type "yes" to continue: ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled.');
    process.exit(0);
  }

  try {
    console.log('\n🔄 Connecting to database...');
    const sql = postgres(currentUrl);

    console.log('✅ Connected!');
    console.log('🔄 Changing password...');

    await sql`ALTER USER ${sql(username)} WITH PASSWORD ${newPassword}`;

    console.log('✅ Password changed successfully!');

    await sql.end();

    // Build new URL
    const newUrl = `postgresql://${username}:${newPassword}@${host}:${port}/${database}`;

    console.log('\n✅ Password rotation complete!\n');
    console.log('📋 Next Steps:\n');
    console.log('1. Update Railway Environment Variables:');
    console.log('   - Go to your app service → Variables');
    console.log('   - Update DATABASE_URL with the new value below\n');
    console.log('2. New DATABASE_URL:');
    console.log(`\n${newUrl}\n`);
    console.log('3. Redeploy your service after updating the variable\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

rotatePassword();
