#!/usr/bin/env node

// D&D Journal Pi Deployment Script
// One-command deployment to Raspberry Pi

const { NodeSSH } = require('node-ssh');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();

const deployToPi = async () => {
  console.log(chalk.bold.green('🎲 D&D Journal Pi Deployment\n'));

  // Get Pi connection details
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: 'Pi IP address or hostname:',
      default: 'raspberrypi.local',
      validate: input => input.length > 0 || 'Please enter a valid host'
    },
    {
      type: 'input',
      name: 'username',
      message: 'Pi username:',
      default: 'pi',
      validate: input => input.length > 0 || 'Please enter a username'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Pi password (or press enter for SSH key):',
      mask: '*'
    },
    {
      type: 'input',
      name: 'deployPath',
      message: 'Deploy to directory:',
      default: '/home/pi/dnd-journal-sync',
      validate: input => input.length > 0 || 'Please enter a deploy path'
    },
    {
      type: 'confirm',
      name: 'autoStart',
      message: 'Auto-start server with PM2?',
      default: true
    }
  ]);

  try {
    console.log(chalk.yellow('\n📡 Connecting to Pi...'));
    
    // Connect to Pi
    const connectionConfig = {
      host: answers.host,
      username: answers.username
    };

    if (answers.password) {
      connectionConfig.password = answers.password;
    } else {
      connectionConfig.privateKey = fs.readFileSync(path.join(process.env.HOME, '.ssh/id_rsa'));
    }

    await ssh.connect(connectionConfig);
    console.log(chalk.green('✅ Connected to Pi!'));

    // Check if Node.js is installed
    console.log(chalk.yellow('\n🔍 Checking Node.js installation...'));
    const nodeVersion = await ssh.execCommand('node --version').catch(() => null);
    
    if (!nodeVersion || !nodeVersion.stdout) {
      console.log(chalk.red('❌ Node.js not found. Installing...'));
      await installNodeJs();
    } else {
      console.log(chalk.green(`✅ Node.js found: ${nodeVersion.stdout.trim()}`));
    }

    // Create deployment directory
    console.log(chalk.yellow('\n📁 Creating deployment directory...'));
    await ssh.execCommand(`mkdir -p ${answers.deployPath}`);

    // Upload server files
    console.log(chalk.yellow('\n📤 Uploading server files...'));
    await uploadFiles(answers.deployPath);

    // Install dependencies
    console.log(chalk.yellow('\n📦 Installing dependencies...'));
    await ssh.execCommand(`cd ${answers.deployPath} && npm install --production`);

    // Setup PM2 if requested
    if (answers.autoStart) {
      await setupPM2(answers.deployPath);
    }

    // Get Pi local IP for configuration
    const ipResult = await ssh.execCommand("hostname -I | awk '{print $1}'");
    const piIP = ipResult.stdout.trim();

    console.log(chalk.bold.green('\n🎉 Deployment completed successfully!'));
    console.log(chalk.cyan('\n📋 Configuration:'));
    console.log(chalk.gray(`   Pi IP: ${piIP}`));
    console.log(chalk.gray(`   Server URL: ws://${piIP}:1234`));
    console.log(chalk.gray(`   Web Interface: http://${piIP}:1234`));
    
    console.log(chalk.yellow('\n🔧 App Configuration:'));
    console.log(chalk.gray(`   Add to your app URL: ?pi=${piIP}`));
    console.log(chalk.gray(`   Or configure manually: yjsSync.configurePiServer('ws://${piIP}:1234')`));

    if (answers.autoStart) {
      console.log(chalk.green('\n✅ Server is running with PM2'));
      console.log(chalk.gray('   Check status: ssh pi@' + answers.host + ' "pm2 status dnd-journal-sync"'));
      console.log(chalk.gray('   View logs: ssh pi@' + answers.host + ' "pm2 logs dnd-journal-sync"'));
    } else {
      console.log(chalk.yellow('\n▶️  To start the server:'));
      console.log(chalk.gray(`   ssh ${answers.username}@${answers.host}`));
      console.log(chalk.gray(`   cd ${answers.deployPath}`));
      console.log(chalk.gray('   npm start'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Deployment failed:'), error.message);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
};

const installNodeJs = async () => {
  console.log(chalk.yellow('📥 Installing Node.js...'));
  
  // Install Node.js using NodeSource repository
  await ssh.execCommand('curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
  await ssh.execCommand('sudo apt-get install -y nodejs');
  
  // Verify installation
  const nodeVersion = await ssh.execCommand('node --version');
  if (nodeVersion.stdout) {
    console.log(chalk.green(`✅ Node.js installed: ${nodeVersion.stdout.trim()}`));
  } else {
    throw new Error('Node.js installation failed');
  }
};

const uploadFiles = async (deployPath) => {
  const filesToUpload = [
    { local: 'server/', remote: `${deployPath}/server/` },
    { local: 'package.json', remote: `${deployPath}/package.json` },
    { local: 'README.md', remote: `${deployPath}/README.md` },
    { local: 'SYNC_SETUP.md', remote: `${deployPath}/SYNC_SETUP.md` }
  ];

  for (const file of filesToUpload) {
    if (fs.existsSync(file.local)) {
      console.log(chalk.gray(`   Uploading ${file.local}...`));
      if (file.local.endsWith('/')) {
        // Directory
        await ssh.putDirectory(file.local, file.remote, {
          recursive: true,
          concurrency: 3
        });
      } else {
        // File
        await ssh.putFile(file.local, file.remote);
      }
    }
  }

  // Create a minimal package.json for production
  const productionPackage = {
    name: 'dnd-journal-sync',
    version: '1.0.0',
    description: 'D&D Journal sync server for Raspberry Pi',
    main: 'server/sync-server.js',
    scripts: {
      start: 'node server/sync-server.js',
      stop: 'pm2 stop dnd-journal-sync',
      restart: 'pm2 restart dnd-journal-sync',
      logs: 'pm2 logs dnd-journal-sync'
    },
    dependencies: {
      'y-websocket': '^1.5.0',
      'yjs': '^13.6.10',
      'express': '^4.18.2',
      'cors': '^2.8.5',
      'ws': '^8.14.2',
      'chalk': '^4.1.2'
    }
  };

  await ssh.execCommand(`cat > ${deployPath}/package.json << 'EOF'
${JSON.stringify(productionPackage, null, 2)}
EOF`);
};

const setupPM2 = async (deployPath) => {
  console.log(chalk.yellow('\n⚙️  Setting up PM2...'));
  
  // Install PM2 globally if not present
  const pm2Check = await ssh.execCommand('which pm2').catch(() => null);
  if (!pm2Check || !pm2Check.stdout) {
    console.log(chalk.yellow('📦 Installing PM2...'));
    await ssh.execCommand('sudo npm install -g pm2');
  }

  // Stop existing instance if running
  await ssh.execCommand('pm2 stop dnd-journal-sync').catch(() => {});
  await ssh.execCommand('pm2 delete dnd-journal-sync').catch(() => {});

  // Start with PM2
  console.log(chalk.yellow('🚀 Starting server with PM2...'));
  await ssh.execCommand(`cd ${deployPath} && pm2 start server/sync-server.js --name dnd-journal-sync`);
  
  // Setup startup script
  const startupResult = await ssh.execCommand('pm2 startup');
  if (startupResult.stdout.includes('sudo')) {
    const sudoCommand = startupResult.stdout.split('\n').find(line => line.includes('sudo'));
    if (sudoCommand) {
      await ssh.execCommand(sudoCommand);
    }
  }
  
  // Save PM2 configuration
  await ssh.execCommand('pm2 save');
  
  console.log(chalk.green('✅ PM2 configured for auto-start on boot'));
};

// Run deployment
if (require.main === module) {
  deployToPi().catch(error => {
    console.error(chalk.red('Deployment failed:'), error);
    process.exit(1);
  });
}

module.exports = { deployToPi };