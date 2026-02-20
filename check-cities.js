import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

console.log('\n🔍 Checking cities in treatment_centers table...\n');

try {
  const cities = await sql`
    SELECT DISTINCT city
    FROM treatment_centers
    WHERE city IS NOT NULL
    ORDER BY city
  `;

  console.log('Cities found:');
  cities.forEach(row => console.log(`  - ${row.city}`));

  console.log('\n🔍 Searching for "sherman oaks" (case-insensitive)...\n');

  const shermanOaks = await sql`
    SELECT id, name, city, type
    FROM treatment_centers
    WHERE LOWER(city) LIKE '%sherman oaks%'
  `;

  console.log(`Found ${shermanOaks.length} centers matching "sherman oaks":`);
  shermanOaks.forEach(c => console.log(`  - ${c.name} (${c.city}) - ${c.type}`));

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await sql.end();
}
