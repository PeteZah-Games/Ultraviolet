import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const DIST = 'dist';
const SRC = 'src';

async function getPackageVersion() {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  return pkg.version;
}

function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function prepareDist() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST);
}

async function copyStaticFiles() {
  return Promise.all([
    copyFile(`${SRC}/example.sw.js`, `${DIST}/example.sw.js`),
    copyFile(`${SRC}/config.js`, `${DIST}/config.js`)
  ]);
}
/**
 * Checks the env of the given varible
 * @param {string} envToCheck 
 * @returns {boolean}
 */
function envCheck(envToCheck) {
  const exists = process.argv.includes('--' + envToCheck)
  return exists;
} 
async function main() {
  const isDev = envCheck("dev")
  const isCI = envCheck("ci")
  const version = await getPackageVersion();
  const commit = getCommitHash();

  process.env.ULTRAVIOLET_VERSION = version;

  await prepareDist();
  await copyStaticFiles();

  const result = await build({
    platform: 'browser',
    target: ['esnext'],
    external: ['./uv.config.js'],
    sourcemap: isDev,
    minify: !isDev,
    entryPoints: {
      bundle: `${SRC}/rewrite/index.js`,
      client: `${SRC}/client/index.js`,
      handler: `${SRC}/handler.js`,
      sw: `${SRC}/sw.js`
    },
    define: {
      'process.env.ULTRAVIOLET_VERSION': JSON.stringify(version),
      'process.env.ULTRAVIOLET_COMMIT_HASH': JSON.stringify(commit)
    },
    bundle: true,
    drop: isDev ? undefined : ["console", "debugger"],
    format: 'esm',
    splitting: true,
    treeShaking: true,
    metafile: isDev,
    logLevel: isCI ? 'error' : isDev ? 'debug' : 'info',
    outdir: DIST
  });

  if (isDev) {
    await writeFile('metafile.json', JSON.stringify(result.metafile, null, 2));
  }
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
