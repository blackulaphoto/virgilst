const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'drizzle', 'schema.ts');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Track current table name
let currentTable = '';
const lines = schema.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Track which table we're in
  const tableMatch = line.match(/^export const (\w+) = sqliteTable/);
  if (tableMatch) {
    currentTable = tableMatch[1];
  }

  // Fix index names to be unique by prefixing with table name
  if (currentTable && line.includes('index("')) {
    // Replace index("name") with index("{tableName}_name")
    line = line.replace(/index\("([^"]+)"\)/g, (match, indexName) => {
      // Don't prefix if already prefixed with table name
      if (indexName.startsWith(currentTable + '_')) {
        return match;
      }
      return `index("${currentTable}_${indexName}")`;
    });
  }

  newLines.push(line);
}

schema = newLines.join('\n');
fs.writeFileSync(schemaPath, schema);
console.log('✓ Index names fixed to be unique');
