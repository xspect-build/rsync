'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { resolveTarget, getAssetUrl, RELEASE_TAG, RELEASE_VERSION } = require('./targets');

function getInstalledBinaryPath() {
  const manifestPath = path.join(__dirname, '..', 'runtime', 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return path.join(__dirname, '..', manifest.binaryPath);
}

module.exports = {
  RELEASE_TAG,
  RELEASE_VERSION,
  resolveTarget,
  getAssetUrl,
  getInstalledBinaryPath
};
