import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

async function rotatePassword() {
  console.log('\n🔐 Railway PostgreSQL Password Rotation\n');

  // Generate strong password
  const newPassword = crypto.randomBytes(32).toString('base64').replace(/[=+\/]/g, '').substring(0, 32);

  console.log(`Generated password: ${newPassword}\n`);
  console.log('⚠️  This will change your database password!');
  console.log('Press Ctrl+C to cancel, or press Enter to continue...\n');

  await new Promise(resolve => process.stdin.once('data', resolve));

  try {
    console.log('🔄 Changing password via Railway...\n');

    // Use Railway run to execute the password change
    const command = `railway run psql $DATABASE_URL -c "ALTER USER postgres WITH PASSWORD '${newPassword}';"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('ALTER ROLE')) {
      throw new Error(stderr);
    }

    console.log('✅ Password changed successfully!\n');
    console.log('📋 New PASSWORD (save this):');
    console.log(`   ${newPassword}\n`);
    console.log('🔄 Now update your Railway DATABASE_URL variable:');
    console.log('   1. Go to Railway dashboard → Your service → Variables');
    console.log('   2. Update DATABASE_URL with new password');
    console.log('   3. Or get current URL and manually replace the password part\n');

    // Try to get current DATABASE_URL
    try {
      const { stdout: currentUrl } = await execAsync('railway variables get DATABASE_URL');
      const urlMatch = currentUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

      if (urlMatch) {
        const [, user, , host, port, db] = urlMatch;
        const newUrl = `postgresql://${user}:${newPassword}@${host}:${port}/${db}`;
        console.log('📋 New DATABASE_URL:');
        console.log(`   ${newUrl}\n`);
        console.log('Run this to update it:');
        console.log(`   railway variables set DATABASE_URL="${newUrl}"\n`);
      }
    } catch (e) {
      console.log('Could not auto-generate new URL. Update manually in Railway dashboard.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

rotatePassword();
