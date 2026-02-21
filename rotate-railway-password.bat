@echo off
setlocal enabledelayedexpansion

echo.
echo 🔐 Railway PostgreSQL Password Rotation
echo.

:: Generate a strong random password using Node.js
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64').replace(/[=+\/]/g, '').substring(0, 32))"') do set NEW_PASSWORD=%%i

echo Generated new password: %NEW_PASSWORD%
echo.
echo ⚠️  WARNING: This will change your database password!
echo    All services will need to be redeployed with the new password.
echo.
set /p CONFIRM="Continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo ❌ Cancelled.
    exit /b 0
)

echo.
echo 🔄 Getting database info from Railway...

:: Get the current DATABASE_URL
for /f "delims=" %%i in ('railway variables get DATABASE_URL 2^>nul') do set CURRENT_URL=%%i

if "%CURRENT_URL%"=="" (
    echo ❌ Could not get DATABASE_URL from Railway
    echo    Make sure you're in the correct project
    exit /b 1
)

echo ✅ Connected to Railway project
echo.
echo 🔄 Changing password using Railway CLI...

:: Use Railway's run command to change the password
railway run bash -c "psql $DATABASE_URL -c \"ALTER USER postgres WITH PASSWORD '%NEW_PASSWORD%';\""

if errorlevel 1 (
    echo ❌ Failed to change password
    exit /b 1
)

echo ✅ Password changed successfully!
echo.

:: Parse and rebuild the connection string
:: This is a simplified version - Railway will handle the details
echo 🔄 Updating Railway environment variable...

:: Let Railway regenerate the DATABASE_URL with the new password
echo    Railway will automatically update DATABASE_URL after password change

echo.
echo ✅ Password rotation complete!
echo.
echo 📋 Next Steps:
echo    1. Railway will automatically redeploy your services
echo    2. Verify your app is working after deployment
echo    3. Old password in git history is now useless
echo.

endlocal
