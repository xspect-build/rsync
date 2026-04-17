#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const { getInstalledBinaryPath } = require('../lib');

const binaryPath = getInstalledBinaryPath();

if (!binaryPath) {
  console.error('[rsync] Binary is not installed. Reinstall the package to trigger postinstall.');
  process.exit(1);
}

const result = spawnSync(binaryPath, process.argv.slice(2), {
  stdio: 'inherit'
});

if (result.error) {
  console.error(`[rsync] Failed to execute ${binaryPath}: ${result.error.message}`);
  process.exit(1);
}

if (result.signal) {
  process.kill(process.pid, result.signal);
}

process.exit(result.status ?? 1);
