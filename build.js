import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
// read version from package.json
const pkg = JSON.parse(await readFile('package.json'));
process.env.ULTRAVIOLET_VERSION = pkg.version;

const isDevelopment = process.argv.includes('--dev');

await rm('dist', { recursive: true, force: true });
await mkdir('dist');

// don't compile these files
await copyFile('src/sw.js', 'dist/sw.js');
await copyFile('src/uv.config.js', 'dist/uv.config.js');

let loglevel;

if (isDevelopment) {
  loglevel = 'debug';
} else {
  loglevel = 'info';
}

let builder = await build({
  platform: 'browser',
  target: ['esnext'],
  external: ['./uv.config.js'],
  sourcemap: isDevelopment,
  minify: !isDevelopment,
  entryPoints: {
    'uv.bundle': './src/rewrite/index.js',
    'uv.client': './src/client/index.js',
    'uv.handler': './src/uv.handler.js',
    'uv.sw': './src/uv.sw.js'
  },
  define: {
    'process.env.ULTRAVIOLET_VERSION': JSON.stringify(process.env.ULTRAVIOLET_VERSION),
    'process.env.ULTRAVIOLET_COMMIT_HASH': (() => {
      try {
        let hash = JSON.stringify(
          execSync('git rev-parse --short HEAD', {
            encoding: 'utf-8'
          }).replace(/\r?\n|\r/g, '')
        );

        return hash;
      } catch {
        return 'unknown';
      }
    })()
  },
  bundle: true,
  format: 'esm',
  treeShaking: true,
  metafile: isDevelopment,
  logLevel: loglevel,
  outdir: 'dist/'
  //plugins: [htmlInJs()],
});
if (isDevelopment) {
  await writeFile('metafile.json', JSON.stringify(builder.metafile));
}
