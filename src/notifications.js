// ============================================================
// SalahMinder — Notification System
// Prayer reminders, dhikr reminders, and special notifications
// ============================================================

import { getSetting } from './database.js';

let reminderIntervals = {};

export async function initNotifications() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

export function showNotification(title, body, tag = 'salahminder') {
    if (Notification.permission !== 'granted') return;

    try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, {
                    body,
                    icon: '/icon.svg',
                    badge: '/icon.svg',
                    tag,
                    vibrate: [200, 100, 200],
                    renotify: true
                });
            });
        } else {
            new Notification(title, { body, icon: '/icon.svg', tag });
        }
    } catch (e) {
        console.warn('Notification failed:', e);
    }
}

// Schedule prayer reminders
export async function schedulePrayerReminders(prayerTimes) {
    const enabled = await getSetting('notifEnabled', false);
    if (!enabled) return;

    const beforeMins = parseInt(await getSetting('notifBefore', '10'));
    const now = new Date();

    Object.entries(prayerTimes).forEach(([name, time]) => {
        if (name === 'Sunrise' || !time || time === '--:--') return;

        const [h, m] = time.split(':').map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(h, m - beforeMins, 0, 0);

        const diff = prayerDate.getTime() - now.getTime();
        if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
            clearTimeout(reminderIntervals[`prayer_${name}`]);
            reminderIntervals[`prayer_${name}`] = setTimeout(() => {
                showNotification(
                    `${name} Prayer Time 🕌`,
                    `${name} prayer is in ${beforeMins} minutes at ${time}. Prepare for salah.`,
                    `prayer_${name}`
                );
            }, diff);
        }
    });
}

// Dhikr reminders
export async function startDhikrReminders() {
    // Clear existing
    clearInterval(reminderIntervals.istighfar);
    clearInterval(reminderIntervals.durud);

    const istighfarEnabled = await getSetting('istighfarEnabled', false);
    const durudEnabled = await getSetting('durudEnabled', false);
    const quietEnabled = await getSetting('quietHoursEnabled', true);
    const quietStart = await getSetting('quietStart', '23:00');
    const quietEnd = await getSetting('quietEnd', '04:00');

    if (istighfarEnabled) {
        const interval = parseInt(await getSetting('istighfarInterval', '60'));
        reminderIntervals.istighfar = setInterval(() => {
            if (!isQuietHours(quietEnabled, quietStart, quietEnd)) {
                showNotification(
                    'Istighfar Reminder 📿',
                    'أَسْتَغْفِرُ اللَّهَ - Astaghfirullah. Seek Allah\'s forgiveness.',
                    'istighfar'
                );
            }
        }, interval * 60 * 1000);
    }

    if (durudEnabled) {
        const interval = parseInt(await getSetting('durudInterval', '60'));
        reminderIntervals.durud = setInterval(() => {
            if (!isQuietHours(quietEnabled, quietStart, quietEnd)) {
                showNotification(
                    'Durud Sharif Reminder 🤲',
                    'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ - Send blessings upon the Prophet ﷺ',
                    'durud'
                );
            }
        }, interval * 60 * 1000);
    }
}

function isQuietHours(enabled, start, end) {
    if (!enabled) return false;
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const current = h * 60 + m;

    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    if (startMin > endMin) {
        // Overnight (e.g. 23:00 to 04:00)
        return current >= startMin || current <= endMin;
    }
    return current >= startMin && current <= endMin;
}

// Jummah reminder
export async function checkJummahReminder() {
    const enabled = await getSetting('jummahReminder', true);
    if (!enabled) return;

    const now = new Date();
    if (now.getDay() === 5) { // Friday
        const target = new Date(now);
        target.setHours(11, 30, 0, 0); // Remind at 11:30 AM
        const diff = target.getTime() - now.getTime();
        if (diff > 0 && diff < 60 * 60 * 1000) {
            setTimeout(() => {
                showNotification(
                    'Jummah Mubarak! 🕌',
                    'Don\'t forget to perform Ghusl, recite Surah Al-Kahf, and attend Jummah prayer.',
                    'jummah'
                );
            }, diff);
        }
    }
}

// Ramadan notifications
export async function checkRamadanReminders(prayerTimes) {
    const ramadanMode = await getSetting('ramadanMode', false);
    if (!ramadanMode) return;

    const now = new Date();

    // Suhoor reminder (30 mins before Fajr)
    if (prayerTimes.Fajr && prayerTimes.Fajr !== '--:--') {
        const [h, m] = prayerTimes.Fajr.split(':').map(Number);
        const suhoor = new Date(now);
        suhoor.setHours(h, m - 30, 0, 0);
        const diff = suhoor.getTime() - now.getTime();
        if (diff > 0 && diff < 2 * 60 * 60 * 1000) {
            setTimeout(() => {
                showNotification(
                    'Suhoor Time 🌙',
                    `Fajr is at ${prayerTimes.Fajr}. Complete your Suhoor soon!`,
                    'suhoor'
                );
            }, diff);
        }
    }

    // Iftar reminder (at Maghrib)
    if (prayerTimes.Maghrib && prayerTimes.Maghrib !== '--:--') {
        const [h, m] = prayerTimes.Maghrib.split(':').map(Number);
        const iftar = new Date(now);
        iftar.setHours(h, m, 0, 0);
        const diff = iftar.getTime() - now.getTime();
        if (diff > 0 && diff < 2 * 60 * 60 * 1000) {
            setTimeout(() => {
                showNotification(
                    'Iftar Time! 🌅',
                    'It\'s time to break your fast. Bismillah! اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
                    'iftar'
                );
            }, diff);
        }
    }
}

export function clearAllReminders() {
    Object.keys(reminderIntervals).forEach(key => {
        clearTimeout(reminderIntervals[key]);
        clearInterval(reminderIntervals[key]);
    });
    reminderIntervals = {};
}
