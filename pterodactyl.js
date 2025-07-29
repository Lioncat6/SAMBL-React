// pterodactyl.js
// Stater for the pterodactyl panel. Should work in other applications, however.
const fs = require('fs');
const path = require('path');
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
const currentVersion = pkg.version;
const versionFile = path.resolve('.lastversion');
let lastVersion = null;

if (fs.existsSync(versionFile)) {
  lastVersion = fs.readFileSync(versionFile, 'utf8').trim();
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

if (lastVersion !== currentVersion) {
  console.log(`🟡 Version changed: ${lastVersion || 'none'} → ${currentVersion}`);
  runStep('Build', 'npm', ['run', 'build'], () => {
    fs.writeFileSync(versionFile, currentVersion);
  });
} else {
  console.log(`🟡 Version unchanged (${currentVersion}). Skipping build.`);
}

runStep('Start', 'npm', ['start', '--', '-p', '25565']);
