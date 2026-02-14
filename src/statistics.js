// ============================================================
// SalahMinder — Statistics Module
// Weekly, monthly, yearly views with charts and heatmap
// ============================================================

import { getStatistics, getBestStreak, getMonthlyHeatmap, getPendingQada, addQada, markQadaMadeUp, getAllQada } from './database.js';
import { showToast } from './main.js';

let currentPeriod = 'week';
let heatmapYear, heatmapMonth;

export async function initStats() {
    const now = new Date();
    heatmapYear = now.getFullYear();
    heatmapMonth = now.getMonth();

    setupStatsTabs();
    setupQadaListeners();
    await refreshStats();
    await renderHeatmap();
    await renderQada();
}

function setupStatsTabs() {
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.addEventListener('click', async () => {
            document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentPeriod = tab.dataset.period;
            await refreshStats();
        });
    });
}

async function refreshStats() {
    const stats = await getStatistics(currentPeriod);
    const bestStreak = await getBestStreak();

    document.getElementById('statTotalPrayers').textContent = stats.totalCompleted;
    document.getElementById('statCompletionRate').textContent = `${stats.completionRate}%`;
    document.getElementById('statBestStreak').textContent = bestStreak;
    document.getElementById('statMostMissed').textContent = stats.mostMissed;

    renderPrayerBars(stats.prayerStats);
}

function renderPrayerBars(prayerStats) {
    const container = document.getElementById('prayerStatsChart');
    const colors = {
        Fajr: '#5C6BC0', Dhuhr: '#FF8F00', Asr: '#EF6C00',
        Maghrib: '#EF5350', Isha: '#5E35B1'
    };

    container.innerHTML = '<h3 style="font-size:16px;font-weight:700;margin-bottom:14px;color:var(--text-primary)">Per-Prayer Completion</h3>';

    Object.entries(prayerStats).forEach(([name, data]) => {
        const row = document.createElement('div');
        row.className = 'prayer-bar-row';
        row.innerHTML = `
      <span class="prayer-bar-label">${name}</span>
      <div class="prayer-bar-track">
        <div class="prayer-bar-fill" style="width:${data.rate}%;background:${colors[name]};"></div>
      </div>
      <span class="prayer-bar-value">${data.rate}%</span>
    `;
        container.appendChild(row);
    });
}

async function renderHeatmap() {
    const days = await getMonthlyHeatmap(heatmapYear, heatmapMonth);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    document.getElementById('heatmapMonth').textContent = `${monthNames[heatmapMonth]} ${heatmapYear}`;

    const grid = document.getElementById('heatmapGrid');
    grid.innerHTML = '';

    // Day headers
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => {
        const h = document.createElement('div');
        h.className = 'heatmap-cell header';
        h.textContent = d;
        grid.appendChild(h);
    });

    // Empty cells for first day offset
    const firstDay = new Date(heatmapYear, heatmapMonth, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell empty';
        grid.appendChild(cell);
    }

    // Day cells
    days.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.textContent = day.day;
        const opacity = day.count === 0 ? 0.08 : (day.count / 5);
        cell.style.opacity = Math.max(0.2, opacity);
        cell.style.background = day.count === 0 ? 'var(--border)' : 'var(--primary)';
        cell.title = `${day.date}: ${day.count}/5 prayers`;
        grid.appendChild(cell);
    });

    // Heatmap navigation
    document.getElementById('heatmapPrev').onclick = async () => {
        heatmapMonth--;
        if (heatmapMonth < 0) { heatmapMonth = 11; heatmapYear--; }
        await renderHeatmap();
    };
    document.getElementById('heatmapNext').onclick = async () => {
        heatmapMonth++;
        if (heatmapMonth > 11) { heatmapMonth = 0; heatmapYear++; }
        await renderHeatmap();
    };
}

async function renderQada() {
    const pending = await getPendingQada();

    // Summary
    const summary = document.getElementById('qadaSummary');
    const qadaCounts = { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 };
    pending.forEach(q => { if (qadaCounts[q.prayer] !== undefined) qadaCounts[q.prayer]++; });

    summary.innerHTML = '';
    Object.entries(qadaCounts).forEach(([name, count]) => {
        summary.innerHTML += `
      <div class="qada-item">
        <div class="qada-item-count">${count}</div>
        <div class="qada-item-name">${name}</div>
      </div>
    `;
    });

    // List
    const list = document.getElementById('qadaList');
    list.innerHTML = '';
    pending.slice(0, 20).forEach(q => {
        const entry = document.createElement('div');
        entry.className = 'qada-entry';
        entry.innerHTML = `
      <div class="qada-entry-info">
        <div class="qada-entry-prayer">${q.prayer}</div>
        <div class="qada-entry-date">${q.date}</div>
      </div>
      <button class="qada-entry-done" data-id="${q.id}" title="Mark as made up">
        <span class="material-icons-round">check</span>
      </button>
    `;
        entry.querySelector('.qada-entry-done').addEventListener('click', async () => {
            await markQadaMadeUp(q.id);
            showToast('Qada prayer marked as made up ✅');
            await renderQada();
        });
        list.appendChild(entry);
    });

    if (pending.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:16px;">No pending Qada prayers. Alhamdulillah! 🤲</p>';
    }
}

function setupQadaListeners() {
    const modal = document.getElementById('qadaModal');
    document.getElementById('addQadaBtn').addEventListener('click', () => {
        document.getElementById('qadaDate').valueAsDate = new Date();
        modal.classList.add('active');
    });
    document.getElementById('qadaModalClose').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

    document.getElementById('saveQadaBtn').addEventListener('click', async () => {
        const date = document.getElementById('qadaDate').value;
        const prayer = document.getElementById('qadaPrayer').value;
        if (!date) { showToast('Please select a date'); return; }
        await addQada(date, prayer);
        showToast(`${prayer} Qada added for ${date}`);
        modal.classList.remove('active');
        await renderQada();
    });
}

export function refreshStatsPage() {
    refreshStats();
    renderHeatmap();
    renderQada();
}
