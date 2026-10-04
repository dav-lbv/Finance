import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {execSync} from 'child_process';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

// Version affichée dans Réglages (commit Vercel, sinon commit git local)
function appVersion(): string {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel) return fromVercel.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

// Sous-dossier d'hébergement (ex. GitHub Pages : /Finance/) ; '/' par défaut
const BASE = process.env.BASE_PATH || '/';

export default defineConfig(() => {
  return {
    base: BASE,
    define: {__APP_VERSION__: JSON.stringify(appVersion())},
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: BASE,
          name: 'Mon Kanda - Gestion financière',
          short_name: 'Mon Kanda',
          description: 'Gestion mensuelle de salaire, dépenses et calendrier d\'épargne',
          theme_color: '#3a3837',
          background_color: '#050506',
          display: 'standalone',
          orientation: 'portrait',
          start_url: BASE,
          scope: BASE,
          icons: [
            {
              src: 'pwa-192x192.png?v=2',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png?v=2',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png?v=2',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
