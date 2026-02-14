// ============================================================
// SalahMinder — Home Page Module
// Dashboard with prayer tracking, progress ring, and counters
// ============================================================

import { calculatePrayerTimes, parseTimeToDate, getCountdown, getHijriDate, PRAYER_NAMES, PRAYER_ICONS } from './prayer-times.js';
import { getPrayerLog, markPrayer, calculateStreak, getDateStr, incrementDhikr, getDhikrCount, getAllSettings } from './database.js';
import { getDailyVerse } from './quran.js';
import { schedulePrayerReminders, checkJummahReminder, checkRamadanReminders } from './notifications.js';
import { showToast } from './main.js';

let currentPrayerTimes = {};
let countdownInterval = null;

export async function initHome() {
    await renderGreeting();
    await calculateAndDisplayPrayers();
    await renderQuranVerse();
    await updateProgress();
    await updateStreak();
    await updateDhikrCounts();
    startCountdown();
    setupHomeListeners();
}

async function renderGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Assalamu Alaikum';
    if (hour < 12) greeting = 'Assalamu Alaikum ☀️ Good Morning';
    else if (hour < 17) greeting = 'Assalamu Alaikum 🌤️ Good Afternoon';
    else greeting = 'Assalamu Alaikum 🌙 Good Evening';

    document.getElementById('greetingText').textContent = greeting;
    document.getElementById('hijriDate').textContent = getHijriDate();
}

async function calculateAndDisplayPrayers() {
    const settings = await getAllSettings();
    const lat = parseFloat(settings.latitude) || 21.4225;
    const lng = parseFloat(settings.longitude) || 39.8262;
    const method = settings.calcMethod || 'ISNA';

    currentPrayerTimes = calculatePrayerTimes(new Date(), lat, lng, method);

    const todayLog = await getPrayerLog(new Date());
    const cardsContainer = document.getElementById('prayerCards');
    cardsContainer.innerHTML = '';

    PRAYER_NAMES.forEach(name => {
        const time = currentPrayerTimes[name] || '--:--';
        const isCompleted = todayLog[name]?.completed;

        const card = document.createElement('div');
        card.className = `prayer-card${isCompleted ? ' completed' : ''}`;
        card.dataset.prayer = name;
        card.innerHTML = `
      <div class="prayer-card-icon">${PRAYER_ICONS[name]}</div>
      <div class="prayer-card-info">
        <div class="prayer-card-name">${name}</div>
        <div class="prayer-card-time">${formatTime12h(time)}</div>
      </div>
      <div class="prayer-card-check">
        <span class="material-icons-round">check</span>
      </div>
    `;

        card.addEventListener('click', () => togglePrayer(name, card));
        cardsContainer.appendChild(card);
    });

    // Schedule notifications
    schedulePrayerReminders(currentPrayerTimes);
    checkJummahReminder();
    checkRamadanReminders(currentPrayerTimes);
}

async function togglePrayer(name, card) {
    const isCompleted = card.classList.contains('completed');
    const newState = !isCompleted;

    await markPrayer(new Date(), name, newState);

    card.classList.toggle('completed', newState);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(newState ? [50] : [30, 30, 30]);

    if (newState) {
        showToast(`${name} prayer marked as completed ✅`);
    } else {
        showToast(`${name} prayer unchecked`);
    }

    await updateProgress();
    await updateStreak();
}

async function updateProgress() {
    const todayLog = await getPrayerLog(new Date());
    const completed = PRAYER_NAMES.filter(n => todayLog[n]?.completed).length;

    document.getElementById('progressCount').textContent = `${completed}/5`;

    // Update ring
    const circumference = 2 * Math.PI * 85; // r=85
    const offset = circumference - (completed / 5) * circumference;
    document.getElementById('progressRing').style.strokeDashoffset = offset;
}

async function updateStreak() {
    const streak = await calculateStreak();
    document.getElementById('streakCount').textContent = streak;
}

function startCountdown() {
    clearInterval(countdownInterval);
    updateNextPrayer();
    countdownInterval = setInterval(updateNextPrayer, 30000);
}

function updateNextPrayer() {
    const now = new Date();
    let nextPrayer = null;
    let nextTime = null;

    for (const name of PRAYER_NAMES) {
        const time = currentPrayerTimes[name];
        if (!time || time === '--:--') continue;
        const prayerDate = parseTimeToDate(time);
        if (prayerDate && prayerDate > now) {
            nextPrayer = name;
            nextTime = prayerDate;
            break;
        }
    }

    if (!nextPrayer) {
        // After Isha, next is Fajr tomorrow
        nextPrayer = 'Fajr';
        const time = currentPrayerTimes['Fajr'];
        if (time && time !== '--:--') {
            nextTime = parseTimeToDate(time);
            if (nextTime) nextTime.setDate(nextTime.getDate() + 1);
        }
    }

    document.getElementById('nextPrayerName').textContent = nextPrayer || '--';
    document.getElementById('nextPrayerTime').textContent = nextTime ? formatTime12h(currentPrayerTimes[nextPrayer]) : '--:--';
    document.getElementById('nextPrayerCountdown').textContent = nextTime ? getCountdown(nextTime) : '--';

    // Update the color indicator
    const card = document.getElementById('nextPrayerCard');
    if (nextPrayer) {
        const colors = { Fajr: '#5C6BC0', Dhuhr: '#FF8F00', Asr: '#EF6C00', Maghrib: '#EF5350', Isha: '#5E35B1' };
        card.style.borderLeftColor = colors[nextPrayer] || 'var(--primary)';
    }
}

function renderQuranVerse() {
    const verse = getDailyVerse();
    document.getElementById('quranArabic').textContent = verse.arabic;
    document.getElementById('quranTranslation').textContent = `"${verse.translation}"`;
    document.getElementById('quranReference').textContent = `— ${verse.ref}`;
}

async function updateDhikrCounts() {
    const istighfar = await getDhikrCount('istighfar');
    const durud = await getDhikrCount('durud');
    document.getElementById('istighfarCount').textContent = istighfar;
    document.getElementById('durudCount').textContent = durud;
}

function setupHomeListeners() {
    document.getElementById('quickIstighfar').addEventListener('click', async () => {
        const count = await incrementDhikr('istighfar');
        document.getElementById('istighfarCount').textContent = count;
        if (navigator.vibrate) navigator.vibrate(30);
        showToast('أَسْتَغْفِرُ اللَّهَ');
    });

    document.getElementById('quickDurud').addEventListener('click', async () => {
        const count = await incrementDhikr('durud');
        document.getElementById('durudCount').textContent = count;
        if (navigator.vibrate) navigator.vibrate(30);
        showToast('اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ ﷺ');
    });
}

function formatTime12h(time24) {
    if (!time24 || time24 === '--:--') return '--:--';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function refreshHome() {
    initHome();
}
