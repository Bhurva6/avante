#!/bin/bash
# Email Alert System - Quick Setup Guide
# This script helps configure the email alert system

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Email Alert System - Configuration Guide              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating .env file..."
    cat > .env << 'ENVFILE'
# SMTP Configuration for Email Alerts
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
ADMIN_EMAIL=admin@avante.com
ENVFILE
    echo "✅ .env file created. Please update with your email credentials."
    echo ""
else
    echo "✅ .env file exists"
fi

echo "📧 Email Configuration Steps:"
echo ""
echo "1. Gmail Account Setup:"
echo "   - Go to https://myaccount.google.com/security"
echo "   - Enable 2-Factor Authentication (if not already enabled)"
echo "   - Go to https://myaccount.google.com/apppasswords"
echo "   - Select 'Mail' and 'Windows Computer' (or your OS)"
echo "   - Generate an app password"
echo "   - Copy the 16-character password (with spaces)"
echo ""
echo "2. Update .env file:"
echo "   SENDER_EMAIL=your-email@gmail.com        # Your Gmail address"
echo "   SENDER_PASSWORD=xxxx xxxx xxxx xxxx       # App password (16 chars)"
echo "   ADMIN_EMAIL=admin@avante.com              # Admin to receive requests"
echo ""
echo "3. Restart Flask application:"
echo "   python3 app.py"
echo ""
echo "4. Test Email Sending:"
echo "   - Submit signup request"
echo "   - Check admin inbox for notification"
echo "   - Check user inbox for approval/rejection"
echo ""

# Check if environment variables are set
if [ -z "$SENDER_PASSWORD" ]; then
    echo "⚠️  SENDER_PASSWORD not set in environment"
    echo "   Run: export SENDER_PASSWORD='your-app-password'"
    echo "   Then restart the Flask application"
else
    echo "✅ SENDER_PASSWORD is set"
fi

if [ -z "$ADMIN_EMAIL" ]; then
    echo "⚠️  ADMIN_EMAIL not set in environment"
    echo "   Run: export ADMIN_EMAIL='admin@avante.com'"
    echo "   Then restart the Flask application"
else
    echo "✅ ADMIN_EMAIL is set"
fi

echo ""
echo "📚 For detailed documentation, see: EMAIL_ALERT_SYSTEM.md"
