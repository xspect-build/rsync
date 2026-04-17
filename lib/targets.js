'use strict';

const RELEASE_TAG = 'v0.6.0';
const RELEASE_VERSION = '0.6.0';
const RELEASE_BASE_URL = `https://github.com/oferchen/rsync/releases/download/${RELEASE_TAG}`;

const TARGETS = {
  'linux-x64': {
    platform: 'linux',
    arch: 'x64',
    assetName: 'oc-rsync-0.6.0-linux-x86_64-musl.tar.gz',
    binaryName: 'oc-rsync'
  },
  'linux-arm64': {
    platform: 'linux',
    arch: 'arm64',
    assetName: 'oc-rsync-0.6.0-linux-aarch64-musl.tar.gz',
    binaryName: 'oc-rsync'
  },
  'darwin-x64': {
    platform: 'darwin',
    arch: 'x64',
    assetName: 'oc-rsync-0.6.0-darwin-x86_64.tar.gz',
    binaryName: 'oc-rsync'
  },
  'darwin-arm64': {
    platform: 'darwin',
    arch: 'arm64',
    assetName: 'oc-rsync-0.6.0-darwin-aarch64.tar.gz',
    binaryName: 'oc-rsync'
  },
  'win32-x64': {
    platform: 'win32',
    arch: 'x64',
    assetName: 'oc-rsync-0.6.0-windows-x86_64.tar.gz',
    binaryName: 'oc-rsync.exe'
  }
};

function resolveTarget(platform = process.platform, arch = process.arch) {
  return TARGETS[`${platform}-${arch}`] || null;
}

function getAssetUrl(target) {
  return `${RELEASE_BASE_URL}/${target.assetName}`;
}

module.exports = {
  RELEASE_TAG,
  RELEASE_VERSION,
  RELEASE_BASE_URL,
  TARGETS,
  resolveTarget,
  getAssetUrl
};
