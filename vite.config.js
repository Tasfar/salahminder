import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './',
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
            manifest: {
                name: 'SalahMinder - Prayer Tracker',
                short_name: 'SalahMinder',
                description: 'Track your 5 daily prayers, build streaks, and strengthen your connection with Allah.',
                theme_color: '#1B5E20',
                background_color: '#0A1A0F',
                display: 'standalone',
                start_url: './',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
                navigateFallback: 'index.html'
            }
        })
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});
