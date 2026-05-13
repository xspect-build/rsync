'use strict';

const fs = require('node:fs');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { TARGETS, getAssetUrl } = require('../lib/targets');

const packageRoot = path.join(__dirname, '..');
const targets = Object.values(TARGETS);
const DOWNLOAD_TIMEOUT_MS = 120000;
const EXECUTABLE_MODE = 0o755;

function run(command, args, options = {}) {
  const cwd = options.cwd || packageRoot;
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      ...(options.env || {})
    },
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error(`Command failed (cwd=${cwd}): ${command} ${args.join(' ')}`);
  }
}

function runCapture(command, args, options = {}) {
  const cwd = options.cwd || packageRoot;
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      ...(options.env || {})
    },
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(`Command failed (cwd=${cwd}): ${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }

  return result.stdout;
}

function downloadFile(url, destinationPath, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (!url.startsWith('https://')) {
      reject(new Error(`Refusing to download non-HTTPS URL: ${url}`));
      return;
    }

    const req = https.get(url, (res) => {
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
      fileStream.on('finish', () => fileStream.close(resolve));
      fileStream.on('error', reject);
    });

    req.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
      req.destroy(new Error(`Request timed out while downloading ${url}`));
    });

    req.on('error', reject);
  });
}

function getBuildTargets() {
  const targetOption = getOption('--target', null);
  if (!targetOption) {
    return targets;
  }

  return targetOption.split(',').map((targetKey) => {
    const target = TARGETS[targetKey.trim()];
    if (!target) {
      throw new Error(`Unknown target: ${targetKey}`);
    }

    return target;
  });
}

function findExtractedSourceDir(extractDir) {
  const entries = fs.readdirSync(extractDir, { withFileTypes: true });
  const sourceDir = entries.find((entry) => entry.isDirectory() && entry.name.startsWith('rsync-'));
  if (!sourceDir) {
    throw new Error('Could not find extracted rsync source directory');
  }

  return path.join(extractDir, sourceDir.name);
}

function buildEnvironment(target) {
  if (target.static) {
    return {
      CC: process.env.CC || 'musl-gcc',
      CFLAGS: process.env.CFLAGS || '-Os',
      LDFLAGS: process.env.LDFLAGS || '-static'
    };
  }

  return {};
}

function buildRsync(sourceDir, target) {
  const targetKey = `${target.platform}-${target.arch}`;
  const hostKey = `${process.platform}-${process.arch}`;
  if (targetKey !== hostKey) {
    throw new Error(`Target ${targetKey} must be built on matching host ${hostKey}`);
  }

  const env = buildEnvironment(target);
  const configureArgs = [
    '--disable-openssl',
    '--disable-xxhash',
    '--disable-zstd',
    '--disable-lz4'
  ];

  run('./configure', configureArgs, { cwd: sourceDir, env });
  run('make', ['-j', String(Math.max(os.cpus().length, 1)), 'rsync'], { cwd: sourceDir, env });

  const binaryPath = path.join(sourceDir, target.binaryName);
  if (target.static) {
    const fileOutput = runCapture('file', [binaryPath]);
    if (!fileOutput.includes('statically linked')) {
      throw new Error(`Linux binary is not statically linked: ${fileOutput.trim()}`);
    }
  }

  return binaryPath;
}

async function stageTarget(target) {
  const assetUrl = getAssetUrl(target);
  const packageDir = path.join(packageRoot, 'packages', target.packageName.split('/').pop());
  const binDir = path.join(packageDir, 'bin');
  const destinationBinaryPath = path.join(binDir, target.binaryName);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsync-release-'));
  const tempTarPath = path.join(tempDir, 'asset.tar.gz');
  const extractDir = path.join(tempDir, 'extract');

  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });

  try {
    await downloadFile(assetUrl, tempTarPath);
    run('tar', ['-xzf', tempTarPath, '-C', extractDir]);

    const sourceDir = findExtractedSourceDir(extractDir);
    const sourceBinaryPath = buildRsync(sourceDir, target);
    if (!sourceBinaryPath) {
      throw new Error(`Could not build ${target.binaryName}`);
    }

    fs.rmSync(destinationBinaryPath, { force: true });
    fs.copyFileSync(sourceBinaryPath, destinationBinaryPath);
    fs.chmodSync(destinationBinaryPath, EXECUTABLE_MODE);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function stageAll() {
  for (const target of getBuildTargets()) {
    console.log(`[release] staging ${target.packageName}`);
    await stageTarget(target);
  }
}

function packAll(distDir) {
  const absoluteDistDir = path.isAbsolute(distDir) ? distDir : path.join(packageRoot, distDir);
  fs.mkdirSync(absoluteDistDir, { recursive: true });

  for (const target of getBuildTargets()) {
    const packageDir = path.join(packageRoot, 'packages', target.packageName.split('/').pop());
    console.log(`[release] packing ${target.packageName}`);
    run('npm', ['pack', '--pack-destination', absoluteDistDir], { cwd: packageDir });
  }

  console.log('[release] packing @xspect-build/rsync');
  run('npm', ['pack', '--pack-destination', absoluteDistDir]);
}

function publishAll(tag) {
  const publishArgs = ['publish', '--access', 'public'];
  if (tag) {
    publishArgs.push('--tag', tag);
  }

  for (const target of getBuildTargets()) {
    const packageDir = path.join(packageRoot, 'packages', target.packageName.split('/').pop());
    console.log(`[release] publishing ${target.packageName}`);
    run('npm', publishArgs, { cwd: packageDir });
  }

  console.log('[release] publishing @xspect-build/rsync');
  run('npm', publishArgs);
}

function getOption(name, fallback = null) {
  for (let i = 0; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg.startsWith(`${name}=`)) {
      return arg.slice(name.length + 1);
    }

    if (arg === name && i + 1 < process.argv.length) {
      return process.argv[i + 1];
    }
  }

  return fallback;
}

async function main() {
  const command = process.argv[2];
  const distDir = getOption('--dist', 'dist');
  const tag = getOption('--tag', null);

  if (command === 'pack') {
    await stageAll();
    packAll(distDir);
    return;
  }

  if (command === 'publish') {
    await stageAll();
    publishAll(tag);
    return;
  }

  console.error('Usage: node scripts/release-packages.js <pack|publish> [--dist=<dir>] [--tag=<tag>] [--target=<target[,target...]>]');
  process.exit(1);
}

main().catch((error) => {
  console.error(`[release] failed: ${error.message}`);
  process.exit(1);
});
