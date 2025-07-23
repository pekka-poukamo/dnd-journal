#!/usr/bin/env node

// Simple Pi Setup Script
// For manual server setup on Raspberry Pi

const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const setupPi = () => {
  console.log(chalk.bold.green('🎲 D&D Journal Pi Setup\n'));

  try {
    // Check if we're on a Pi (ARM architecture)
    const arch = execSync('uname -m', { encoding: 'utf8' }).trim();
    if (!arch.includes('arm') && !arch.includes('aarch64')) {
      console.log(chalk.yellow('⚠️  This appears to not be a Raspberry Pi'));
      console.log(chalk.gray('   Continuing anyway for testing...'));
    }

    // Check Node.js version
    console.log(chalk.yellow('🔍 Checking Node.js...'));
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ Node.js: ${nodeVersion}`));

    // Install production dependencies
    console.log(chalk.yellow('\n📦 Installing dependencies...'));
    execSync('npm install --production', { stdio: 'inherit' });

    // Create data directory
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(chalk.blue('📁 Created data directory'));
    }

    // Check if PM2 is available
    console.log(chalk.yellow('\n⚙️  Checking PM2...'));
    try {
      execSync('pm2 --version', { stdio: 'ignore' });
      console.log(chalk.green('✅ PM2 is available'));
      
      console.log(chalk.yellow('\n🚀 Starting server with PM2...'));
      execSync('npm run pi:start', { stdio: 'inherit' });
      
      console.log(chalk.green('\n✅ Server started with PM2!'));
      console.log(chalk.cyan('📋 Useful commands:'));
      console.log(chalk.gray('   npm run pi:status  - Check server status'));
      console.log(chalk.gray('   npm run pi:logs    - View server logs'));
      console.log(chalk.gray('   npm run pi:restart - Restart server'));
      console.log(chalk.gray('   npm run pi:stop    - Stop server'));
      
    } catch (e) {
      console.log(chalk.yellow('📦 Installing PM2...'));
      execSync('sudo npm install -g pm2', { stdio: 'inherit' });
      
      execSync('npm run pi:start', { stdio: 'inherit' });
      console.log(chalk.green('\n✅ Server started with PM2!'));
    }

    // Get local IP
    try {
      const ip = execSync("hostname -I | awk '{print $1}'", { encoding: 'utf8' }).trim();
      
      console.log(chalk.bold.green('\n🎉 Setup completed!'));
      console.log(chalk.cyan('\n📋 Server Information:'));
      console.log(chalk.gray(`   Pi IP: ${ip}`));
      console.log(chalk.gray(`   Server URL: ws://${ip}:1234`));
      console.log(chalk.gray(`   Web Interface: http://${ip}:1234`));
      
      console.log(chalk.yellow('\n🔧 App Configuration:'));
      console.log(chalk.gray(`   Add to your app URL: ?pi=${ip}`));
      console.log(chalk.gray(`   Or configure manually in browser console:`));
      console.log(chalk.gray(`   yjsSync.configurePiServer('ws://${ip}:1234')`));
      
    } catch (e) {
      console.log(chalk.yellow('\n⚠️  Could not determine IP address'));
      console.log(chalk.gray('   Check manually with: hostname -I'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error.message);
    process.exit(1);
  }
};

// Run setup
if (require.main === module) {
  setupPi();
}

module.exports = { setupPi };