// ============================================================
// SalahMinder — Main Application Entry Point
// Navigation, theme, PWA install, and module initialization
// ============================================================

import './styles.css';
import { openDatabase, getSetting, setSetting } from './database.js';
import { initHome, refreshHome } from './home.js';
import { initStats, refreshStatsPage } from './statistics.js';
import { initTasbih, onLeaveTasbih } from './tasbih.js';
import { initSettings } from './settings.js';
import { initNotifications, startDhikrReminders } from './notifications.js';

let currentPage = 'homePage';
let deferredPrompt = null;

// ---- Toast Utility (exported for other modules) ----
export function showToast(message, duration = 2500) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    msg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ---- Navigation ----
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.page;
            if (target === currentPage) return;

            // Save tasbih session when leaving
            if (currentPage === 'tasbihPage') onLeaveTasbih();

            // Switch pages
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            currentPage = target;

            // Refresh page content
            if (target === 'homePage') refreshHome();
            if (target === 'statsPage') refreshStatsPage();

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ---- Theme ----
async function initTheme() {
    const saved = await getSetting('theme', 'light');
    document.documentElement.dataset.theme = saved;

    document.getElementById('darkModeToggle').addEventListener('click', async () => {
        const current = document.documentElement.dataset.theme;
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        await setSetting('theme', next);

        // Sync settings page toggle
        const sw = document.getElementById('darkModeSwitch');
        if (sw) sw.checked = next === 'dark';
    });
}

// ---- PWA Install Prompt ----
function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show install banner
        const banner = document.getElementById('installBanner');
        banner.style.display = 'block';
    });

    document.getElementById('installAccept').addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            showToast('SalahMinder installed! 📱');
        }
        deferredPrompt = null;
        document.getElementById('installBanner').style.display = 'none';
    });

    document.getElementById('installDismiss').addEventListener('click', () => {
        document.getElementById('installBanner').style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
        showToast('SalahMinder installed successfully! 🎉');
        document.getElementById('installBanner').style.display = 'none';
    });
}


// ---- Default Settings ----
async function setDefaultSettings() {
    const lat = await getSetting('latitude');
    if (!lat) {
        // Default to Makkah coordinates
        await setSetting('latitude', '21.4225');
        await setSetting('longitude', '39.8262');
        await setSetting('cityName', 'Makkah');
        await setSetting('calcMethod', 'ISNA');
        await setSetting('notifBefore', '10');
        await setSetting('quietHoursEnabled', true);
        await setSetting('quietStart', '23:00');
        await setSetting('quietEnd', '04:00');
        await setSetting('jummahReminder', true);
    }
}

// ---- App Initialization ----
async function initApp() {
    try {
        // Open database
        await openDatabase();

        // Set defaults
        await setDefaultSettings();

        // Initialize theme
        await initTheme();

        // Setup navigation
        setupNavigation();

        // Setup PWA
        setupPWAInstall();
        // Service worker handled by vite-plugin-pwa

        // Initialize all pages
        await initHome();
        await initStats();
        await initTasbih();
        await initSettings();

        // Initialize notifications
        await initNotifications();
        await startDhikrReminders();

        console.log('SalahMinder initialized successfully ✅');
    } catch (error) {
        console.error('Init error:', error);
        showToast('App initialization error. Please refresh.');
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
