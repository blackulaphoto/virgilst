#!/bin/bash

echo ""
echo "🔐 Railway PostgreSQL Password Rotation"
echo ""

# Generate a strong random password
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo "Generated new password: $NEW_PASSWORD"
echo ""
echo "⚠️  WARNING: This will change your database password!"
echo "   All services will need to be redeployed with the new password."
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelled."
    exit 0
fi

echo ""
echo "🔄 Connecting to database via Railway..."

# Get the current DATABASE_URL from Railway
CURRENT_URL=$(railway variables get DATABASE_URL 2>/dev/null)

if [ -z "$CURRENT_URL" ]; then
    echo "❌ Could not get DATABASE_URL from Railway"
    echo "   Make sure you're in the correct project and environment"
    exit 1
fi

echo "✅ Connected to Railway project"

# Parse the connection string
if [[ $CURRENT_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    USERNAME="${BASH_REMATCH[1]}"
    OLD_PASSWORD="${BASH_REMATCH[2]}"
    HOST="${BASH_REMATCH[3]}"
    PORT="${BASH_REMATCH[4]}"
    DATABASE="${BASH_REMATCH[5]}"
else
    echo "❌ Could not parse DATABASE_URL"
    exit 1
fi

echo ""
echo "📋 Database Info:"
echo "   User: $USERNAME"
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Database: $DATABASE"
echo ""

# Change the password using Railway's run command
echo "🔄 Changing password..."

railway run bash -c "PGPASSWORD='$OLD_PASSWORD' psql -h $HOST -p $PORT -U $USERNAME -d $DATABASE -c \"ALTER USER $USERNAME WITH PASSWORD '$NEW_PASSWORD';\""

if [ $? -ne 0 ]; then
    echo "❌ Failed to change password"
    exit 1
fi

echo "✅ Password changed successfully!"

# Build new connection string
NEW_URL="postgresql://$USERNAME:$NEW_PASSWORD@$HOST:$PORT/$DATABASE"

echo ""
echo "🔄 Updating Railway environment variables..."

# Update the DATABASE_URL in Railway
railway variables set DATABASE_URL="$NEW_URL"

if [ $? -eq 0 ]; then
    echo "✅ Environment variable updated!"
else
    echo "❌ Failed to update environment variable"
    echo "   Please update DATABASE_URL manually in Railway dashboard:"
    echo "   $NEW_URL"
    exit 1
fi

echo ""
echo "✅ Password rotation complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Railway will automatically redeploy your services"
echo "   2. Verify your app is working after deployment"
echo "   3. Old password in git history is now useless"
echo ""
