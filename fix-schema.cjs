const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'drizzle', 'schema.ts');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Fix fields that have type but no argument: email: text, -> email: text("email"),
// Match pattern: fieldName: type, or fieldName: type.
const typeRegex = /(\w+):\s+(text|integer|real),/g;
schema = schema.replace(typeRegex, '$1: $2("$1"),');

const typeRegex2 = /(\w+):\s+(text|integer|real)\./g;
schema = schema.replace(typeRegex2, '$1: $2("$1").');

// Fix missing parentheses: real( -> real("fieldName")
// This is trickier, need context
const lines = schema.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Match: fieldName: real(, or real(. or real()
  const match = line.match(/^\s*(\w+):\s+(text|integer|real)\(([,\.\)])?/);
  if (match && match[3]) {
    const fieldName = match[1];
    const type = match[2];
    const after = match[3];

    // Replace with proper field name
    lines[i] = line.replace(
      new RegExp(`${fieldName}:\\s+${type}\\(${after === ')' ? '\\)' : after}`),
      `${fieldName}: ${type}("${fieldName}")${after === ')' ? ')' : after}`
    );
  }
}

schema = lines.join('\n');

fs.writeFileSync(schemaPath, schema);
console.log('✓ Schema syntax fixed');
