const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'drizzle', 'schema.ts');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace imports
schema = schema.replace(
  /import \{[^}]+\} from "drizzle-orm\/mysql-core"/g,
  'import { integer, sqliteTable, text, real, index } from "drizzle-orm/sqlite-core";\nimport { sql } from "drizzle-orm"'
);

// Replace table definitions
schema = schema.replace(/mysqlTable\(/g, 'sqliteTable(');

// Replace column types - need to handle arguments properly
schema = schema.replace(/\bint\("([^"]+)"\)/g, 'integer("$1")');
schema = schema.replace(/\bvarchar\("([^"]+)",\s*\{[^}]+\}\)/g, 'text("$1")');
schema = schema.replace(/\btimestamp\("([^"]+)"\)/g, 'integer("$1")');
schema = schema.replace(/\bdecimal\("([^"]+)",\s*\{[^}]+\}\)/g, 'real("$1")');
schema = schema.replace(/\bboolean\("([^"]+)"\)/g, 'integer("$1")'); // SQLite uses integer for boolean

// Replace enum definitions - convert to text with first argument
schema = schema.replace(/mysqlEnum\("([^"]+)",\s*\[[^\]]+\]\)/g, 'text("$1")');

// Replace timestamp defaults
schema = schema.replace(/\.defaultNow\(\)/g, '.default(sql`(unixepoch())`)')
schema = schema.replace(/\.onUpdateNow\(\)/g, ''); // SQLite doesn't support onUpdateNow

// Fix boolean defaults (false -> 0, true -> 1)
schema = schema.replace(/\.default\(false\)/g, '.default(0)');
schema = schema.replace(/\.default\(true\)/g, '.default(1)');

// Fix json type
schema = schema.replace(/\bjson\(/g, 'text(');

fs.writeFileSync(schemaPath, schema);
console.log('✓ Schema converted to SQLite');
