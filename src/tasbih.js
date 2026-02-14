// ============================================================
// SalahMinder — Tasbih Counter Module
// Dhikr counter with haptic feedback and progress ring
// ============================================================

import { saveTasbihSession, getTasbihToday } from './database.js';
import { showToast } from './main.js';

const DHIKR_MAP = {
    SubhanAllah: { arabic: 'سُبْحَانَ اللَّهِ', defaultTarget: 33 },
    Alhamdulillah: { arabic: 'الْحَمْدُ لِلَّهِ', defaultTarget: 33 },
    AllahuAkbar: { arabic: 'اللَّهُ أَكْبَرُ', defaultTarget: 33 },
    Istighfar: { arabic: 'أَسْتَغْفِرُ اللَّهَ', defaultTarget: 100 },
    Durud: { arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ', defaultTarget: 100 }
};

let currentDhikr = 'SubhanAllah';
let count = 0;
let target = 33;

export async function initTasbih() {
    await updateTotalToday();
    setupTasbihListeners();
    updateRing();
}

function setupTasbihListeners() {
    // Tap area
    const tapArea = document.getElementById('tasbihTapArea');
    tapArea.addEventListener('click', () => {
        count++;
        updateCountDisplay();
        updateRing();

        // Haptic feedback
        if (navigator.vibrate) {
            if (count % target === 0) {
                navigator.vibrate([100, 50, 100, 50, 100]); // Target reached pattern
            } else if (count % 33 === 0) {
                navigator.vibrate([100, 50, 100]); // 33 milestone
            } else {
                navigator.vibrate(15); // Normal tick
            }
        }

        // Target reached
        if (count === target) {
            showToast(`Target of ${target} reached! MashaAllah 🌟`);
            saveTasbihSession(currentDhikr, count);
            updateTotalToday();
        }
    });

    // Presets
    document.querySelectorAll('.tasbih-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tasbih-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Save current session if count > 0
            if (count > 0) {
                saveTasbihSession(currentDhikr, count);
                updateTotalToday();
            }

            currentDhikr = btn.dataset.dhikr;
            count = 0;
            target = DHIKR_MAP[currentDhikr]?.defaultTarget || 33;
            document.getElementById('tasbihDhikrArabic').textContent = DHIKR_MAP[currentDhikr]?.arabic || currentDhikr;
            document.getElementById('tasbihTarget').textContent = target;
            updateCountDisplay();
            updateRing();
        });
    });

    // Controls
    document.getElementById('tasbihReset').addEventListener('click', () => {
        if (count > 0) {
            saveTasbihSession(currentDhikr, count);
            updateTotalToday();
        }
        count = 0;
        updateCountDisplay();
        updateRing();
        if (navigator.vibrate) navigator.vibrate([50, 50]);
        showToast('Counter reset');
    });

    document.getElementById('tasbihMinus').addEventListener('click', () => {
        if (count > 0) {
            count--;
            updateCountDisplay();
            updateRing();
            if (navigator.vibrate) navigator.vibrate(20);
        }
    });

    // Target button
    document.getElementById('tasbihTargetBtn').addEventListener('click', () => {
        document.getElementById('targetModal').classList.add('active');
    });

    document.getElementById('targetModalClose').addEventListener('click', () => {
        document.getElementById('targetModal').classList.remove('active');
    });

    document.getElementById('targetModal').addEventListener('click', (e) => {
        if (e.target.id === 'targetModal') document.getElementById('targetModal').classList.remove('active');
    });

    document.querySelectorAll('.target-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.target-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('customTarget').value = '';
        });
    });

    document.getElementById('saveTargetBtn').addEventListener('click', () => {
        const custom = parseInt(document.getElementById('customTarget').value);
        const activePreset = document.querySelector('.target-preset.active');

        if (custom > 0) {
            target = custom;
        } else if (activePreset) {
            target = parseInt(activePreset.dataset.target);
        }

        document.getElementById('tasbihTarget').textContent = target;
        updateRing();
        document.getElementById('targetModal').classList.remove('active');
        showToast(`Target set to ${target}`);
    });
}

function updateCountDisplay() {
    document.getElementById('tasbihCount').textContent = count;
}

function updateRing() {
    const circumference = 2 * Math.PI * 110; // r=110
    const progress = Math.min(count / target, 1);
    const offset = circumference - progress * circumference;
    document.getElementById('tasbihRingFill').style.strokeDashoffset = offset;
}

async function updateTotalToday() {
    const total = await getTasbihToday();
    document.getElementById('tasbihTotalToday').textContent = total + count;
}

export function onLeaveTasbih() {
    // Save session when leaving page
    if (count > 0) {
        saveTasbihSession(currentDhikr, count);
        count = 0;
        updateCountDisplay();
        updateRing();
    }
}
