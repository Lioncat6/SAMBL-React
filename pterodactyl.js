// pterodactyl.js
// Stater for the pterodactyl panel. Should work in other applications, however.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

if (fs.existsSync('.env') && !process.env.FORCE_IGNORE_ENV) {
  try {
    require('dotenv').config();
    console.log('🟢 Loaded .env variables');
  } catch (err) {
    console.warn('🔴 Failed to load .env:', err.message);
  }
}

const pkg = require('./package.json');
const port = process.env.PORT || '3000';
const currentVersion = pkg.version;
const versionFile = path.resolve('.lastversion');
const lockFile = path.resolve('package-lock.json');
const lockHashFile = path.resolve('.lastlockhash');

let lastVersion = null;
if (fs.existsSync(versionFile)) {
  lastVersion = fs.readFileSync(versionFile, 'utf8').trim();
}

let lastLockHash = null;
if (fs.existsSync(lockHashFile)) {
  lastLockHash = fs.readFileSync(lockHashFile, 'utf8').trim();
}

function getLockHash() {
  if (!fs.existsSync(lockFile)) return null;
  const content = fs.readFileSync(lockFile);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function runStep(name, cmd, args, onSuccess) {
  console.log(`Running "${name}"...`);
  const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });

  proc.on('error', (err) => {
    console.error(`🔴 Error in "${name}": ${err.message}`);
    process.exit(1);
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`🔴 "${name}" exited with code ${code}`);
      process.exit(code);
    } else {
      console.log(`🟢 "${name}" completed`);
      onSuccess && onSuccess();
    }
  });
}

const currentLockHash = getLockHash();
if (currentLockHash !== lastLockHash) {
  console.log(`🟡 package-lock.json changed → installing dependencies`);
  runStep('Install', 'npm', ['install'], () => {
    fs.writeFileSync(lockHashFile, currentLockHash);
    proceedWithBuildAndStart();
  });
} else {
  console.log('🟢 Dependencies unchanged → skipping install');
  proceedWithBuildAndStart();
}

function proceedWithBuildAndStart() {
  if (lastVersion !== currentVersion) {
    console.log(`🟡 Version changed: ${lastVersion || 'none'} → ${currentVersion}`);
    runStep('Build', 'npm', ['run', 'build'], () => {
      fs.writeFileSync(versionFile, currentVersion);
      runStep('Start', 'npm', ['start', '--', '-p', port]);
    });
  } else {
    console.log(`🟢 Version unchanged (${currentVersion}) → skipping build`);
    runStep('Start', 'npm', ['start', '--', '-p', port]);
  }
}
