'use strict';

const fs = require('node:fs');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');

const tar = require('tar');
const { resolveTarget, getAssetUrl, RELEASE_VERSION } = require('../lib/targets');

const packageRoot = path.join(__dirname, '..');
const installRoot = path.join(packageRoot, 'runtime');

function downloadFile(url, destinationPath, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (!url.startsWith('https://')) {
      reject(new Error(`Refusing to download non-HTTPS URL: ${url}`));
      return;
    }

    const req = https.get(
      url,
      {
        headers: {
          'user-agent': 'xspect-build-rsync-installer'
        }
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects <= 0) {
            reject(new Error(`Too many redirects while downloading ${url}`));
            return;
          }

          const redirectUrl = new URL(res.headers.location, url).toString();
          if (!redirectUrl.startsWith('https://')) {
            reject(new Error(`Refusing to follow non-HTTPS redirect: ${redirectUrl}`));
            return;
          }
          res.resume();
          downloadFile(redirectUrl, destinationPath, redirects - 1).then(resolve, reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}. Status code: ${res.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(destinationPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(resolve);
        });

        fileStream.on('error', (error) => {
          reject(error);
        });
      }
    );

    req.on('error', (error) => {
      reject(error);
    });
  });
}

function findBinary(rootDir, binaryName) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      const nested = findBinary(fullPath, binaryName);
      if (nested) {
        return nested;
      }
      continue;
    }

    if (entry.isFile() && entry.name === binaryName) {
      return fullPath;
    }
  }

  return null;
}

function assertSafeTarEntry(entryPath) {
  const normalized = path.posix.normalize(entryPath.replace(/\\/g, '/'));
  const isWindowsAbsolutePath = /^[a-zA-Z]:[\\/]/.test(entryPath);

  if (
    normalized === '..' ||
    normalized.startsWith('../') ||
    path.posix.isAbsolute(normalized) ||
    isWindowsAbsolutePath
  ) {
    throw new Error(`Unsafe archive entry path: ${entryPath}`);
  }
}

(async () => {
  const target = resolveTarget();

  if (!target) {
    console.warn(`[rsync] Unsupported platform ${process.platform}/${process.arch}. Skipping binary install.`);
    return;
  }

  const assetUrl = getAssetUrl(target);
  const secureTmpBase = path.join(os.tmpdir(), 'xspect-build-rsync');
  fs.mkdirSync(secureTmpBase, { recursive: true, mode: 0o700 });
  // recursive mkdir does not tighten permissions for pre-existing directories.
  fs.chmodSync(secureTmpBase, 0o700);

  const tempDir = fs.mkdtempSync(path.join(secureTmpBase, 'oc-rsync-'));
  const tempTarball = path.join(tempDir, 'archive.tar.gz');

  try {
    fs.rmSync(installRoot, { recursive: true, force: true });
    fs.mkdirSync(installRoot, { recursive: true });

    await downloadFile(assetUrl, tempTarball);

    await tar.x({
      file: tempTarball,
      cwd: installRoot,
      strict: true,
      filter: (entryPath) => {
        assertSafeTarEntry(entryPath);
        return true;
      }
    });

    const binaryPath = findBinary(installRoot, target.binaryName);

    if (!binaryPath) {
      throw new Error(`Could not find ${target.binaryName} after extracting ${target.assetName}`);
    }

    if (process.platform !== 'win32') {
      fs.chmodSync(binaryPath, 0o755);
    }

    const manifestPath = path.join(installRoot, 'manifest.json');
    const manifest = {
      releaseVersion: RELEASE_VERSION,
      platform: process.platform,
      arch: process.arch,
      assetName: target.assetName,
      binaryPath: path.relative(packageRoot, binaryPath).split(path.sep).join('/')
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`[rsync] Installed ${target.assetName}`);
  } catch (error) {
    console.error(`[rsync] Failed to install binary: ${error.message}`);
    process.exitCode = 1;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})();
