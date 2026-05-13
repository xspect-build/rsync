'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveTarget, getAssetUrl, RELEASE_TAG } = require('../lib/targets');

test('resolves mainstream platform targets and package names', () => {
  assert.equal(resolveTarget('linux', 'x64').packageName, '@xspect-build/rsync-linux-x64');
  assert.equal(resolveTarget('linux', 'arm64').packageName, '@xspect-build/rsync-linux-arm64');
  assert.equal(resolveTarget('darwin', 'x64').packageName, '@xspect-build/rsync-darwin-x64');
  assert.equal(resolveTarget('darwin', 'arm64').packageName, '@xspect-build/rsync-darwin-arm64');
  assert.equal(resolveTarget('linux', 'x64').binaryName, 'rsync');
  assert.equal(resolveTarget('linux', 'x64').static, true);
});

test('returns null for unsupported platform targets', () => {
  assert.equal(resolveTarget('win32', 'x64'), null);
  assert.equal(resolveTarget('win32', 'arm64'), null);
  assert.equal(resolveTarget('linux', 'ppc64'), null);
});

test('builds release asset url', () => {
  const target = resolveTarget('darwin', 'arm64');
  assert.equal(
    getAssetUrl(target),
    `https://github.com/RsyncProject/rsync/releases/download/${RELEASE_TAG}/rsync-3.4.2.tar.gz`
  );
});
