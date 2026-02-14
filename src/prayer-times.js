// ============================================================
// SalahMinder — Astronomical Prayer Time Calculation Engine
// Supports: ISNA, MWL, Egypt, Makkah, Karachi methods
// 100% offline — no API required
// ============================================================

const METHODS = {
    ISNA: { name: 'ISNA', fajrAngle: 15, ishaAngle: 15, ishaMinutes: 0 },
    MWL: { name: 'MWL', fajrAngle: 18, ishaAngle: 17, ishaMinutes: 0 },
    Egypt: { name: 'Egypt', fajrAngle: 19.5, ishaAngle: 17.5, ishaMinutes: 0 },
    Makkah: { name: 'Makkah', fajrAngle: 18.5, ishaAngle: 0, ishaMinutes: 90 },
    Karachi: { name: 'Karachi', fajrAngle: 18, ishaAngle: 18, ishaMinutes: 0 }
};

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_ICONS = { Fajr: '🌅', Dhuhr: '☀️', Asr: '🌤️', Maghrib: '🌇', Isha: '🌙' };

function toRadians(deg) { return deg * Math.PI / 180; }
function toDegrees(rad) { return rad * 180 / Math.PI; }

function julianDate(year, month, day) {
    if (month <= 2) { year--; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * Math.sin(toRadians(g)) + 0.020 * Math.sin(toRadians(2 * g)));
    const e = 23.439 - 0.00000036 * D;
    const RA = toDegrees(Math.atan2(Math.cos(toRadians(e)) * Math.sin(toRadians(L)), Math.cos(toRadians(L)))) / 15;
    const d = toDegrees(Math.asin(Math.sin(toRadians(e)) * Math.sin(toRadians(L))));
    const EqT = q / 15 - fixHour(RA);
    return { declination: d, equation: EqT };
}

function fixAngle(a) { return a - 360 * Math.floor(a / 360); }
function fixHour(a) { return a - 24 * Math.floor(a / 24); }

function computeMidDay(eq) {
    return fixHour(12 - eq);
}

function computeTime(angle, midDay, lat, decl, direction) {
    const cosHA = (
        -Math.sin(toRadians(angle)) - Math.sin(toRadians(lat)) * Math.sin(toRadians(decl))
    ) / (
            Math.cos(toRadians(lat)) * Math.cos(toRadians(decl))
        );

    if (cosHA > 1 || cosHA < -1) return NaN;

    const HA = toDegrees(Math.acos(cosHA)) / 15;
    return midDay + (direction === 'ccw' ? -HA : HA);
}

function computeAsr(step, midDay, lat, decl) {
    const a = toDegrees(Math.atan(1 / (step + Math.tan(toRadians(Math.abs(lat - decl))))));
    return computeTime(90 - a, midDay, lat, decl, 'cw');
}

/**
 * Calculate all 5 prayer times for a given date and location
 * @param {Date} date - The date to calculate for
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} methodName - Calculation method key
 * @param {number} timezone - Timezone offset in hours (e.g. +6 for BST)
 * @returns {Object} Prayer times as { Fajr: "HH:MM", Dhuhr: "HH:MM", ... }
 */
export function calculatePrayerTimes(date, lat, lng, methodName = 'ISNA', timezone = null) {
    const method = METHODS[methodName] || METHODS.ISNA;

    if (timezone === null) {
        timezone = -date.getTimezoneOffset() / 60;
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const jd = julianDate(year, month, day) - lng / (15 * 24);
    const sun = sunPosition(jd + 1);

    const midDay = computeMidDay(sun.equation);
    const dhuhr = midDay + timezone - lng / 15;

    // Sunrise & Sunset
    const sunrise = dhuhr - computeTimeDiff(0.833, lat, sun.declination);
    const sunset = dhuhr + computeTimeDiff(0.833, lat, sun.declination);

    // Fajr
    const fajr = dhuhr - computeTimeDiff(method.fajrAngle, lat, sun.declination);

    // Asr (Shafi'i — shadow = object)
    const asr = computeAsrTime(1, dhuhr, lat, sun.declination, timezone, lng);

    // Maghrib = sunset
    const maghrib = sunset;

    // Isha
    let isha;
    if (method.ishaMinutes > 0) {
        isha = sunset + method.ishaMinutes / 60;
    } else {
        isha = dhuhr + computeTimeDiff(method.ishaAngle, lat, sun.declination);
    }

    return {
        Fajr: formatTime(fajr),
        Sunrise: formatTime(sunrise),
        Dhuhr: formatTime(dhuhr),
        Asr: formatTime(asr),
        Maghrib: formatTime(maghrib),
        Isha: formatTime(isha)
    };
}

function computeTimeDiff(angle, lat, decl) {
    const cosHA = (
        -Math.sin(toRadians(angle)) - Math.sin(toRadians(lat)) * Math.sin(toRadians(decl))
    ) / (
            Math.cos(toRadians(lat)) * Math.cos(toRadians(decl))
        );
    if (cosHA > 1 || cosHA < -1) return 0;
    return toDegrees(Math.acos(cosHA)) / 15;
}

function computeAsrTime(factor, midDay, lat, decl, tz, lng) {
    const angle = toDegrees(Math.atan(1 / (factor + Math.tan(toRadians(Math.abs(lat - decl))))));
    const diff = computeTimeDiff(90 - angle, lat, decl);
    return midDay + tz - lng / 15 + diff;
}

function formatTime(hours) {
    if (isNaN(hours)) return '--:--';
    hours = fixHour(hours);
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    return `${hStr}:${mStr}`;
}

/**
 * Parse "HH:MM" string to Date object for today
 */
export function parseTimeToDate(timeStr, date = new Date()) {
    if (!timeStr || timeStr === '--:--') return null;
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
}

/**
 * Get countdown string from now to a target date
 */
export function getCountdown(target) {
    if (!target) return '--';
    const now = new Date();
    let diff = target.getTime() - now.getTime();
    if (diff < 0) diff += 24 * 60 * 60 * 1000; // next day
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
}

/**
 * Get approximate Hijri date (simplified conversion)
 */
export function getHijriDate(date = new Date()) {
    const jd = julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const l = Math.floor(jd - 1948439.5 + 10632);
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const m = Math.floor((24 * l3) / 709);
    const d = l3 - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;

    const months = [
        'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
        'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
        'Ramadan', 'Shawwal', 'Dhul Qi\'dah', 'Dhul Hijjah'
    ];
    return `${d} ${months[m - 1] || ''} ${y} AH`;
}

export { PRAYER_NAMES, PRAYER_ICONS, METHODS };
