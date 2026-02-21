#!/bin/bash

# New password (already generated)
NEW_PASSWORD="GvAAOwCYJb9UuK1ZFa0dyNKqpYzoTF21"

echo ""
echo "🔐 Railway PostgreSQL Password Rotation"
echo ""
echo "New password: $NEW_PASSWORD"
echo ""
echo "Step 1: Connect to database and change password"
echo "----------------------------------------"
echo "Run this command:"
echo ""
echo "railway connect postgres"
echo ""
echo "Then in the psql shell, run:"
echo ""
echo "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';"
echo "\\q"
echo ""
echo "Step 2: Update Railway variable"
echo "----------------------------------------"
echo "Get your current DATABASE_URL and replace only the password part with:"
echo "$NEW_PASSWORD"
echo ""
echo "Then update it in Railway with:"
echo 'railway variables set DATABASE_URL="postgresql://postgres:NEW_PASSWORD@host:port/railway"'
echo ""
