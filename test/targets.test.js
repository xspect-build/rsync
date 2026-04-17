'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveTarget, getAssetUrl, RELEASE_TAG } = require('../lib/targets');

test('resolves mainstream platform targets', () => {
  assert.equal(resolveTarget('linux', 'x64').assetName, 'oc-rsync-0.6.0-linux-x86_64-musl.tar.gz');
  assert.equal(resolveTarget('linux', 'arm64').assetName, 'oc-rsync-0.6.0-linux-aarch64-musl.tar.gz');
  assert.equal(resolveTarget('darwin', 'x64').assetName, 'oc-rsync-0.6.0-darwin-x86_64.tar.gz');
  assert.equal(resolveTarget('darwin', 'arm64').assetName, 'oc-rsync-0.6.0-darwin-aarch64.tar.gz');
  assert.equal(resolveTarget('win32', 'x64').assetName, 'oc-rsync-0.6.0-windows-x86_64.tar.gz');
});

test('returns null for unsupported platform targets', () => {
  assert.equal(resolveTarget('win32', 'arm64'), null);
  assert.equal(resolveTarget('linux', 'ppc64'), null);
});

test('builds release asset url', () => {
  const target = resolveTarget('darwin', 'arm64');
  assert.equal(
    getAssetUrl(target),
    `https://github.com/oferchen/rsync/releases/download/${RELEASE_TAG}/oc-rsync-0.6.0-darwin-aarch64.tar.gz`
  );
});
