import { defineConfig } from 'vite';

export default defineConfig({
    // Base URL will be set by GitHub Pages 
    // The repo name becomes the base path
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});
