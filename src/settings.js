// ============================================================
// SalahMinder — Settings Module
// Location, calculation method, notifications, and preferences
// ============================================================

import { setSetting, getAllSettings } from './database.js';
import { initNotifications, startDhikrReminders, clearAllReminders } from './notifications.js';
import { showToast } from './main.js';

export async function initSettings() {
    await loadSettings();
    setupSettingsListeners();
}

async function loadSettings() {
    const settings = await getAllSettings();

    // Populate fields
    document.getElementById('cityName').value = settings.cityName || '';
    document.getElementById('latitude').value = settings.latitude || '';
    document.getElementById('longitude').value = settings.longitude || '';
    document.getElementById('calcMethod').value = settings.calcMethod || 'ISNA';
    document.getElementById('notifEnabled').checked = settings.notifEnabled === true || settings.notifEnabled === 'true';
    document.getElementById('notifBefore').value = settings.notifBefore || '10';
    document.getElementById('istighfarEnabled').checked = settings.istighfarEnabled === true || settings.istighfarEnabled === 'true';
    document.getElementById('istighfarInterval').value = settings.istighfarInterval || '60';
    document.getElementById('durudEnabled').checked = settings.durudEnabled === true || settings.durudEnabled === 'true';
    document.getElementById('durudInterval').value = settings.durudInterval || '60';
    document.getElementById('quietHoursEnabled').checked = settings.quietHoursEnabled !== false && settings.quietHoursEnabled !== 'false';
    document.getElementById('quietStart').value = settings.quietStart || '23:00';
    document.getElementById('quietEnd').value = settings.quietEnd || '04:00';
    document.getElementById('ramadanMode').checked = settings.ramadanMode === true || settings.ramadanMode === 'true';
    document.getElementById('jummahReminder').checked = settings.jummahReminder !== false && settings.jummahReminder !== 'false';
    document.getElementById('darkModeSwitch').checked = document.documentElement.dataset.theme === 'dark';
}

function setupSettingsListeners() {
    // Auto-detect location
    document.getElementById('detectLocationBtn').addEventListener('click', () => {
        if ('geolocation' in navigator) {
            showToast('Detecting location...');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    document.getElementById('latitude').value = pos.coords.latitude.toFixed(4);
                    document.getElementById('longitude').value = pos.coords.longitude.toFixed(4);
                    showToast('Location detected! ✅');
                },
                (err) => {
                    showToast('Location access denied. Please enter manually.');
                },
                { timeout: 10000 }
            );
        } else {
            showToast('Geolocation not available. Please enter coordinates manually.');
        }
    });

    // Dark mode toggle in settings
    document.getElementById('darkModeSwitch').addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
        setSetting('theme', theme);
    });

    // Save button
    document.getElementById('saveSettingsBtn').addEventListener('click', saveAllSettings);
}

async function saveAllSettings() {
    const fields = [
        { id: 'cityName', key: 'cityName' },
        { id: 'latitude', key: 'latitude' },
        { id: 'longitude', key: 'longitude' },
        { id: 'calcMethod', key: 'calcMethod' },
        { id: 'notifBefore', key: 'notifBefore' },
        { id: 'istighfarInterval', key: 'istighfarInterval' },
        { id: 'durudInterval', key: 'durudInterval' },
        { id: 'quietStart', key: 'quietStart' },
        { id: 'quietEnd', key: 'quietEnd' }
    ];

    const checkboxes = [
        { id: 'notifEnabled', key: 'notifEnabled' },
        { id: 'istighfarEnabled', key: 'istighfarEnabled' },
        { id: 'durudEnabled', key: 'durudEnabled' },
        { id: 'quietHoursEnabled', key: 'quietHoursEnabled' },
        { id: 'ramadanMode', key: 'ramadanMode' },
        { id: 'jummahReminder', key: 'jummahReminder' }
    ];

    // Validate coordinates
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);
    if (document.getElementById('latitude').value && (isNaN(lat) || lat < -90 || lat > 90)) {
        showToast('Invalid latitude. Must be between -90 and 90.');
        return;
    }
    if (document.getElementById('longitude').value && (isNaN(lng) || lng < -180 || lng > 180)) {
        showToast('Invalid longitude. Must be between -180 and 180.');
        return;
    }

    // Save all fields
    for (const field of fields) {
        await setSetting(field.key, document.getElementById(field.id).value);
    }
    for (const cb of checkboxes) {
        await setSetting(cb.key, document.getElementById(cb.id).checked);
    }

    // Request notification permission if enabled
    const notifEnabled = document.getElementById('notifEnabled').checked;
    if (notifEnabled) {
        const granted = await initNotifications();
        if (!granted) {
            showToast('Notification permission denied by browser');
            document.getElementById('notifEnabled').checked = false;
            await setSetting('notifEnabled', false);
        }
    }

    // Restart dhikr reminders
    clearAllReminders();
    await startDhikrReminders();

    showToast('Settings saved! ✅');
}
