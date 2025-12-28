#!/bin/bash

# Live Bet Mentor - Automated VPS Setup Script
# Works on Ubuntu 22.04+ (DigitalOcean, AWS, etc.)

echo "🚀 Starting System Setup..."

# 1. Update and install basic dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y wget curl unzip gnupg2 libnss3 libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libpangocairo-1.0-0 python3-pip

# 2. Install Node.js (Latest LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Google Chrome (Required for Scraper)
echo "🌐 Installing Google Chrome..."
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y

# 4. Install PM2 Globally
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# 5. Install Python Scraper Dependencies
echo "🐍 Installing Python Dependencies..."
pip3 install undetected-chromedriver selenium

# 6. Verify Installations
echo "✅ Verification:"
node -v
npm -v
python3 --version
google-chrome --version
pm2 -v

echo "--------------------------------------------------"
echo "🎉 Setup Complete!"
echo "Next Steps:"
echo "1. Upload your project files to the server."
echo "2. Run 'npm install' in the project directory."
echo "3. Run 'pm2 start pm2.config.cjs' to launch everything."
echo "--------------------------------------------------"
