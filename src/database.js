// ============================================================
// SalahMinder — IndexedDB Database Layer
// All data stored locally — no internet required
// ============================================================

const DB_NAME = 'SalahMinderDB';
const DB_VERSION = 1;

let db = null;

export function openDatabase() {
    return new Promise((resolve, reject) => {
        if (db) { resolve(db); return; }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const database = e.target.result;

            // Prayer logs: { date, prayer, completed, timestamp }
            if (!database.objectStoreNames.contains('prayerLogs')) {
                const store = database.createObjectStore('prayerLogs', { keyPath: ['date', 'prayer'] });
                store.createIndex('byDate', 'date', { unique: false });
                store.createIndex('byPrayer', 'prayer', { unique: false });
            }

            // Qada records: { id, date, prayer, madeUp, madeUpDate }
            if (!database.objectStoreNames.contains('qada')) {
                const store = database.createObjectStore('qada', { keyPath: 'id', autoIncrement: true });
                store.createIndex('byPrayer', 'prayer', { unique: false });
                store.createIndex('byMadeUp', 'madeUp', { unique: false });
            }

            // Tasbih sessions: { id, date, dhikr, count, timestamp }
            if (!database.objectStoreNames.contains('tasbih')) {
                const store = database.createObjectStore('tasbih', { keyPath: 'id', autoIncrement: true });
                store.createIndex('byDate', 'date', { unique: false });
            }

            // Dhikr counters (istighfar, durud daily counts): { date, type, count }
            if (!database.objectStoreNames.contains('dhikrCounters')) {
                const store = database.createObjectStore('dhikrCounters', { keyPath: ['date', 'type'] });
                store.createIndex('byDate', 'date', { unique: false });
            }

            // Settings: { key, value }
            if (!database.objectStoreNames.contains('settings')) {
                database.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

// ---- Generic helpers ----
function getStore(storeName, mode = 'readonly') {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
}

function promisify(req) {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ---- Settings ----
export async function getSetting(key, defaultValue = null) {
    await openDatabase();
    const result = await promisify(getStore('settings').get(key));
    return result ? result.value : defaultValue;
}

export async function setSetting(key, value) {
    await openDatabase();
    return promisify(getStore('settings', 'readwrite').put({ key, value }));
}

export async function getAllSettings() {
    await openDatabase();
    const results = await promisify(getStore('settings').getAll());
    const settings = {};
    results.forEach(r => { settings[r.key] = r.value; });
    return settings;
}

// ---- Prayer Logs ----
export function getDateStr(date = new Date()) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

export async function markPrayer(date, prayer, completed) {
    await openDatabase();
    const dateStr = typeof date === 'string' ? date : getDateStr(date);
    const record = {
        date: dateStr,
        prayer,
        completed,
        timestamp: Date.now()
    };
    return promisify(getStore('prayerLogs', 'readwrite').put(record));
}

export async function getPrayerLog(date) {
    await openDatabase();
    const dateStr = typeof date === 'string' ? date : getDateStr(date);
    const store = getStore('prayerLogs');
    const index = store.index('byDate');
    const results = await promisify(index.getAll(dateStr));
    const log = {};
    results.forEach(r => { log[r.prayer] = r; });
    return log;
}

export async function getPrayerLogsRange(startDate, endDate) {
    await openDatabase();
    const store = getStore('prayerLogs');
    const results = await promisify(store.getAll());
    return results.filter(r => r.date >= startDate && r.date <= endDate);
}

// ---- Streak Calculation ----
export async function calculateStreak() {
    await openDatabase();
    const store = getStore('prayerLogs');
    const allLogs = await promisify(store.getAll());

    // Group by date
    const dateMap = {};
    allLogs.forEach(log => {
        if (!dateMap[log.date]) dateMap[log.date] = 0;
        if (log.completed) dateMap[log.date]++;
    });

    // Count streak backwards from today (or yesterday if today is incomplete)
    let streak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    // Check if today is complete, if not start from yesterday
    const todayStr = getDateStr(today);
    if (dateMap[todayStr] === 5) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateMap[todayStr] > 0) {
        // Today started but not complete, check from yesterday for streak
        checkDate.setDate(checkDate.getDate() - 1);
    } else {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Count consecutive days
    for (let i = 0; i < 365; i++) {
        const ds = getDateStr(checkDate);
        if (dateMap[ds] === 5) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

export async function getBestStreak() {
    await openDatabase();
    const store = getStore('prayerLogs');
    const allLogs = await promisify(store.getAll());

    const dateMap = {};
    allLogs.forEach(log => {
        if (!dateMap[log.date]) dateMap[log.date] = 0;
        if (log.completed) dateMap[log.date]++;
    });

    const dates = Object.keys(dateMap).filter(d => dateMap[d] === 5).sort();
    if (dates.length === 0) return 0;

    let best = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            current++;
            best = Math.max(best, current);
        } else {
            current = 1;
        }
    }
    return best;
}

// ---- Statistics ----
export async function getStatistics(period = 'week') {
    await openDatabase();
    const today = new Date();
    let startDate;

    if (period === 'week') {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        startDate = getDateStr(start);
    } else if (period === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = getDateStr(start);
    } else {
        const start = new Date(today.getFullYear(), 0, 1);
        startDate = getDateStr(start);
    }

    const endDate = getDateStr(today);
    const logs = await getPrayerLogsRange(startDate, endDate);

    const totalCompleted = logs.filter(l => l.completed).length;

    // Calculate total possible prayers
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const totalPossible = days * 5;
    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Per-prayer stats
    const prayerStats = {};
    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(p => {
        const prayerLogs = logs.filter(l => l.prayer === p);
        const completed = prayerLogs.filter(l => l.completed).length;
        prayerStats[p] = {
            completed,
            total: days,
            rate: days > 0 ? Math.round((completed / days) * 100) : 0
        };
    });

    // Most missed prayer
    let mostMissed = '--';
    let leastRate = 101;
    Object.entries(prayerStats).forEach(([name, stats]) => {
        if (stats.rate < leastRate && stats.total > 0) {
            leastRate = stats.rate;
            mostMissed = name;
        }
    });

    return {
        totalCompleted,
        totalPossible,
        completionRate,
        prayerStats,
        mostMissed,
        days
    };
}

// ---- Monthly Heatmap Data ----
export async function getMonthlyHeatmap(year, month) {
    await openDatabase();
    const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    const logs = await getPrayerLogsRange(startDate, endDate);
    const dateMap = {};
    logs.forEach(log => {
        if (!dateMap[log.date]) dateMap[log.date] = 0;
        if (log.completed) dateMap[log.date]++;
    });

    const days = [];
    for (let d = 1; d <= lastDay; d++) {
        const ds = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        days.push({ date: ds, day: d, count: dateMap[ds] || 0 });
    }
    return days;
}

// ---- Qada ----
export async function addQada(date, prayer) {
    await openDatabase();
    return promisify(getStore('qada', 'readwrite').add({
        date: typeof date === 'string' ? date : getDateStr(date),
        prayer,
        madeUp: false,
        madeUpDate: null,
        timestamp: Date.now()
    }));
}

export async function markQadaMadeUp(id) {
    await openDatabase();
    const store = getStore('qada', 'readwrite');
    const record = await promisify(store.get(id));
    if (record) {
        record.madeUp = true;
        record.madeUpDate = getDateStr(new Date());
        return promisify(store.put(record));
    }
}

export async function getPendingQada() {
    await openDatabase();
    const allQada = await promisify(getStore('qada').getAll());
    return allQada.filter(q => !q.madeUp);
}

export async function getAllQada() {
    await openDatabase();
    return promisify(getStore('qada').getAll());
}

// ---- Dhikr Counters ----
export async function incrementDhikr(type) {
    await openDatabase();
    const date = getDateStr();
    const store = getStore('dhikrCounters', 'readwrite');
    const existing = await promisify(store.get([date, type]));
    const count = existing ? existing.count + 1 : 1;
    await promisify(store.put({ date, type, count }));
    return count;
}

export async function getDhikrCount(type, date = null) {
    await openDatabase();
    const dateStr = date || getDateStr();
    const store = getStore('dhikrCounters');
    const result = await promisify(store.get([dateStr, type]));
    return result ? result.count : 0;
}

// ---- Tasbih ----
export async function saveTasbihSession(dhikr, count) {
    await openDatabase();
    return promisify(getStore('tasbih', 'readwrite').add({
        date: getDateStr(),
        dhikr,
        count,
        timestamp: Date.now()
    }));
}

export async function getTasbihToday() {
    await openDatabase();
    const store = getStore('tasbih');
    const index = store.index('byDate');
    const results = await promisify(index.getAll(getDateStr()));
    return results.reduce((sum, r) => sum + r.count, 0);
}
