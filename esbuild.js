const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const watch = process.argv.includes('--watch');

// Copy Mol* viewer files to dist
const molstarBuildDir = path.join(__dirname, 'node_modules', 'molstar', 'build', 'viewer');
const destDir = path.join(__dirname, 'dist');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const filesToCopy = ['molstar.js', 'molstar.css'];
for (const file of filesToCopy) {
  const src = path.join(molstarBuildDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/`);
  }
}

/** @type {import('esbuild').BuildOptions} */
const extensionBuildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: !watch,
};

/** @type {import('esbuild').BuildOptions} */
const webviewBuildOptions = {
  entryPoints: ['src/webview/main.js'],
  bundle: true,
  outfile: 'dist/grid.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: !watch,
};

if (watch) {
  Promise.all([
    esbuild.context(extensionBuildOptions),
    esbuild.context(webviewBuildOptions),
  ]).then(([extCtx, webCtx]) => {
    extCtx.watch();
    webCtx.watch();
    console.log('Watching for changes...');
  });
} else {
  Promise.all([
    esbuild.build(extensionBuildOptions),
    esbuild.build(webviewBuildOptions),
  ]).then(() => {
    console.log('Build complete.');
  });
}
