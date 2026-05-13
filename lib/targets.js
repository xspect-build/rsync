'use strict';

const RELEASE_TAG = 'v3.4.2';
const RELEASE_VERSION = RELEASE_TAG.slice(1);
const RELEASE_BASE_URL = `https://github.com/RsyncProject/rsync/releases/download/${RELEASE_TAG}`;
const SOURCE_ARCHIVE_NAME = `rsync-${RELEASE_VERSION}.tar.gz`;

const TARGETS = {
  'linux-x64': {
    platform: 'linux',
    arch: 'x64',
    packageName: '@xspect-build/rsync-linux-x64',
    binaryName: 'rsync',
    static: true
  },
  'linux-arm64': {
    platform: 'linux',
    arch: 'arm64',
    packageName: '@xspect-build/rsync-linux-arm64',
    binaryName: 'rsync',
    static: true
  },
  'darwin-x64': {
    platform: 'darwin',
    arch: 'x64',
    packageName: '@xspect-build/rsync-darwin-x64',
    binaryName: 'rsync'
  },
  'darwin-arm64': {
    platform: 'darwin',
    arch: 'arm64',
    packageName: '@xspect-build/rsync-darwin-arm64',
    binaryName: 'rsync'
  }
};

function resolveTarget(platform = process.platform, arch = process.arch) {
  return TARGETS[`${platform}-${arch}`] || null;
}

function getAssetUrl() {
  return `${RELEASE_BASE_URL}/${SOURCE_ARCHIVE_NAME}`;
}

module.exports = {
  RELEASE_TAG,
  RELEASE_VERSION,
  RELEASE_BASE_URL,
  SOURCE_ARCHIVE_NAME,
  TARGETS,
  resolveTarget,
  getAssetUrl
};
