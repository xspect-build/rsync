'use strict';

const { resolveTarget, RELEASE_TAG, RELEASE_VERSION } = require('./targets');

function isMissingPackage(error, packageName) {
  return (
    error &&
    error.code === 'MODULE_NOT_FOUND' &&
    typeof error.message === 'string' &&
    error.message.includes(`'${packageName}'`)
  );
}

function getInstalledBinaryPath(platform = process.platform, arch = process.arch) {
  const target = resolveTarget(platform, arch);

  if (!target) {
    return null;
  }

  try {
    const entry = require(target.packageName);
    return typeof entry === 'string' ? entry : entry && entry.binaryPath ? entry.binaryPath : null;
  } catch (error) {
    if (isMissingPackage(error, target.packageName)) {
      return null;
    }

    throw error;
  }
}

module.exports = {
  RELEASE_TAG,
  RELEASE_VERSION,
  resolveTarget,
  getInstalledBinaryPath
};
