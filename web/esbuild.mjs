import { build } from 'esbuild';

await build({
  entryPoints: {
    client: 'src/loader.ts',
    admin: 'src/admin.ts'
  },
  bundle: true,
  format: 'iife',
  target: ['es2022'],
  outdir: '../src/Jellyfin.Plugin.BackgroundBlurEditor/Web/dist',
  minify: true,
  sourcemap: false,
  legalComments: 'none'
});
