/**
 * ============================================================
 *  European Roulette - Client (v5 Final)
 * ============================================================
 */

// ============================================================
//  מצב המשחק
// ============================================================
const state = {
    balance: 1000,
    bets: [],
    isSpinning: false,
    history: [],
    betAmount: 10,
    wheelAngle: 0,
    animationId: null
};

// ============================================================
//  DOM
// ============================================================
const $ = id => document.getElementById(id);
const balanceEl = $('balance');
const totalBetEl = $('total-bet');
const lastWinEl = $('last-win');
const numbersGrid = $('numbers-grid');
const spinBtn = $('spin-btn');
const clearBtn = $('clear-btn');
const resultArea = $('result-badge');
const winningNumberEl = $('winning-number');
const winDetailsEl = $('win-details');
const historyList = $('history-list');
const wheelEl = $('wheel');
const wheelContainer = $('wheel-container');
const wheelNumbersEl = $('wheel-numbers');
const toastEl = $('toast');
const chipsContainer = $('chips');

// ============================================================
//  קבועים
// ============================================================
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// ============================================================
//  Toast
// ============================================================
let toastTimeout = null;
function showToast(msg, type = 'info') {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast show ' + type;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.className = 'toast';
        toastTimeout = null;
    }, 2500);
}

// ============================================================
//  בניית לוח המספרים
// ============================================================
function buildNumbersGrid() {
    numbersGrid.innerHTML = '';
    for (let row = 0; row < 12; row++) {
        const base = (11 - row) * 3;
        for (let i = 0; i < 3; i++) {
            const num = base + (3 - i);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'bet-btn num-btn';
            btn.textContent = num;
            btn.dataset.type = 'straight';
            btn.dataset.numbers = num;
            btn.dataset.key = 'straight-' + num;

            if (RED_NUMBERS.includes(num)) {
                btn.classList.add('red');
            } else {
                btn.classList.add('black');
            }

            btn.addEventListener('click', () => handleBetClick(btn));
            numbersGrid.appendChild(btn);
        }
    }
}

// ============================================================
//  בניית הגלגל הריאליסטי עם SVG
// ============================================================
function buildWheel() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const size = 400;
    const center = size / 2;
    const outerR = 195;
    const innerR = 130;
    const textR = 165;
    const total = WHEEL_ORDER.length;
    const anglePer = 360 / total;

    wheelNumbersEl.innerHTML = '';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('class', 'wheel-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';

    const defs = document.createElementNS(svgNS, 'defs');

    // גרדיאנט זהב
    const goldGrad = document.createElementNS(svgNS, 'radialGradient');
    goldGrad.setAttribute('id', 'goldGrad');
    goldGrad.setAttribute('cx', '35%');
    goldGrad.setAttribute('cy', '30%');
    const gs1 = document.createElementNS(svgNS, 'stop');
    gs1.setAttribute('offset', '0%');
    gs1.setAttribute('stop-color', '#f9e79f');
    const gs2 = document.createElementNS(svgNS, 'stop');
    gs2.setAttribute('offset', '50%');
    gs2.setAttribute('stop-color', '#d4af37');
    const gs3 = document.createElementNS(svgNS, 'stop');
    gs3.setAttribute('offset', '100%');
    gs3.setAttribute('stop-color', '#8b6914');
    goldGrad.appendChild(gs1);
    goldGrad.appendChild(gs2);
    goldGrad.appendChild(gs3);
    defs.appendChild(goldGrad);

    // גרדיאנט למרכז
    const hubGrad = document.createElementNS(svgNS, 'radialGradient');
    hubGrad.setAttribute('id', 'hubGrad');
    hubGrad.setAttribute('cx', '35%');
    hubGrad.setAttribute('cy', '30%');
    const hs1 = document.createElementNS(svgNS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', '#fff8dc');
    const hs2 = document.createElementNS(svgNS, 'stop');
    hs2.setAttribute('offset', '60%');
    hs2.setAttribute('stop-color', '#d4af37');
    const hs3 = document.createElementNS(svgNS, 'stop');
    hs3.setAttribute('offset', '100%');
    hs3.setAttribute('stop-color', '#5c4508');
    hubGrad.appendChild(hs1);
    hubGrad.appendChild(hs2);
    hubGrad.appendChild(hs3);
    defs.appendChild(hubGrad);

    svg.appendChild(defs);

    // --- טבעת זהב חיצונית ---
    const outerRing = document.createElementNS(svgNS, 'circle');
    outerRing.setAttribute('cx', center);
    outerRing.setAttribute('cy', center);
    outerRing.setAttribute('r', outerR + 8);
    outerRing.setAttribute('fill', 'url(#goldGrad)');
    outerRing.setAttribute('stroke', '#6b4a0f');
    outerRing.setAttribute('stroke-width', '2');
    svg.appendChild(outerRing);

    // --- 37 מקטעים ---
    const startOffset = -90 - (anglePer / 2);

    WHEEL_ORDER.forEach((num, idx) => {
        const startAngle = startOffset + idx * anglePer;
        const endAngle = startAngle + anglePer;
        const midAngle = (startAngle + endAngle) / 2;

        let fillColor;
        if (num === 0) {
            fillColor = '#0d8a3e';
        } else if (RED_NUMBERS.includes(num)) {
            fillColor = '#c8102e';
        } else {
            fillColor = '#1a1a1a';
        }

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = center + innerR * Math.cos(startRad);
        const y1 = center + innerR * Math.sin(startRad);
        const x2 = center + outerR * Math.cos(startRad);
        const y2 = center + outerR * Math.sin(startRad);
        const x3 = center + outerR * Math.cos(endRad);
        const y3 = center + outerR * Math.sin(endRad);
        const x4 = center + innerR * Math.cos(endRad);
        const y4 = center + innerR * Math.sin(endRad);

        const polygon = document.createElementNS(svgNS, 'polygon');
        polygon.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`);
        polygon.setAttribute('fill', fillColor);
        polygon.setAttribute('stroke', '#d4af37');
        polygon.setAttribute('stroke-width', '0.6');
        svg.appendChild(polygon);

        // --- מפריד בין המקטעים ---
        const sep = document.createElementNS(svgNS, 'line');
        sep.setAttribute('x1', center + innerR * Math.cos(startRad));
        sep.setAttribute('y1', center + innerR * Math.sin(startRad));
        sep.setAttribute('x2', center + outerR * Math.cos(startRad));
        sep.setAttribute('y2', center + outerR * Math.sin(startRad));
        sep.setAttribute('stroke', 'rgba(212, 175, 55, 0.5)');
        sep.setAttribute('stroke-width', '0.8');
        svg.appendChild(sep);

        // --- טקסט המספר ---
        const textRad = (midAngle * Math.PI) / 180;
        const tx = center + textR * Math.cos(textRad);
        const ty = center + textR * Math.sin(textRad);

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', tx);
        text.setAttribute('y', ty);
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('transform', `rotate(${midAngle + 90} ${tx} ${ty})`);
        text.textContent = num;
        svg.appendChild(text);

        // --- מסמר חיצוני ---
        const dotX = center + (outerR - 6) * Math.cos(textRad);
        const dotY = center + (outerR - 6) * Math.sin(textRad);
        const dot = document.createElementNS(svgNS, 'circle');
        dot.setAttribute('cx', dotX);
        dot.setAttribute('cy', dotY);
        dot.setAttribute('r', '1.6');
        dot.setAttribute('fill', '#f9e79f');
        svg.appendChild(dot);
    });

    // --- טבעת פנימית ---
    const innerRing = document.createElementNS(svgNS, 'circle');
    innerRing.setAttribute('cx', center);
    innerRing.setAttribute('cy', center);
    innerRing.setAttribute('r', innerR);
    innerRing.setAttribute('fill', 'none');
    innerRing.setAttribute('stroke', '#d4af37');
    innerRing.setAttribute('stroke-width', '2');
    svg.appendChild(innerRing);

    // --- מרכז זהוב ---
    const hub = document.createElementNS(svgNS, 'circle');
    hub.setAttribute('cx', center);
    hub.setAttribute('cy', center);
    hub.setAttribute('r', innerR - 5);
    hub.setAttribute('fill', 'url(#hubGrad)');
    hub.setAttribute('stroke', '#5c4508');
    hub.setAttribute('stroke-width', '2');
    svg.appendChild(hub);

    // --- 8 זרועות ---
    for (let s = 0; s < 8; s++) {
        const sAngle = (s * 45) * Math.PI / 180;
        const x1 = center + 25 * Math.cos(sAngle);
        const y1 = center + 25 * Math.sin(sAngle);
        const x2 = center + (innerR - 20) * Math.cos(sAngle);
        const y2 = center + (innerR - 20) * Math.sin(sAngle);

        const spoke = document.createElementNS(svgNS, 'line');
        spoke.setAttribute('x1', x1);
        spoke.setAttribute('y1', y1);
        spoke.setAttribute('x2', x2);
        spoke.setAttribute('y2', y2);
        spoke.setAttribute('stroke', 'url(#goldGrad)');
        spoke.setAttribute('stroke-width', '4');
        spoke.setAttribute('stroke-linecap', 'round');
        spoke.setAttribute('opacity', '0.85');
        svg.appendChild(spoke);
    }

    // --- ציר מרכזי ---
    const axle = document.createElementNS(svgNS, 'circle');
    axle.setAttribute('cx', center);
    axle.setAttribute('cy', center);
    axle.setAttribute('r', '18');
    axle.setAttribute('fill', 'url(#hubGrad)');
    axle.setAttribute('stroke', '#5c4508');
    axle.setAttribute('stroke-width', '1.5');
    svg.appendChild(axle);

    const axleDot = document.createElementNS(svgNS, 'circle');
    axleDot.setAttribute('cx', center);
    axleDot.setAttribute('cy', center);
    axleDot.setAttribute('r', '6');
    axleDot.setAttribute('fill', '#fff8dc');
    axleDot.setAttribute('opacity', '0.85');
    svg.appendChild(axleDot);

    wheelNumbersEl.appendChild(svg);
}

// ============================================================
//  לחיצה על כפתור הימור
// ============================================================
function handleBetClick(btn) {
    if (!btn || state.isSpinning) return;

    const type = btn.dataset.type;
    const numbersRaw = btn.dataset.numbers;
    const key = btn.dataset.key || (type + '-' + numbersRaw);

    if (!type || !key) return;

    let numbers = [];
    if (numbersRaw && numbersRaw.trim() !== '') {
        numbers = numbersRaw.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    }

    const existingIdx = state.bets.findIndex(b => b.key === key);

    if (existingIdx >= 0) {
        state.bets.splice(existingIdx, 1);
        btn.classList.remove('selected');
        btn.removeAttribute('data-chip');
    } else {
        if (state.betAmount <= 0) {
            showToast('בחר צ\'יפ תקין', 'error');
            return;
        }

        const currentTotal = state.bets.reduce((s, b) => s + b.amount, 0);
        if (currentTotal + state.betAmount > state.balance) {
            showToast('אין מספיק יתרה!', 'error');
            return;
        }

        state.bets.push({ type, numbers, amount: state.betAmount, key });
        btn.classList.add('selected');
        btn.setAttribute('data-chip', state.betAmount);
    }

    updateUI();
}

// ============================================================
//  עדכון ממשק
// ============================================================
function updateUI() {
    const totalBet = state.bets.reduce((s, b) => s + b.amount, 0);
    balanceEl.textContent = Math.floor(state.balance);
    totalBetEl.textContent = totalBet;

    spinBtn.disabled = state.bets.length === 0 || state.isSpinning;
    clearBtn.disabled = state.bets.length === 0 || state.isSpinning;
}

// ============================================================
//  ניקוי הימורים
// ============================================================
function clearBets() {
    if (state.isSpinning) return;
    state.bets = [];
    document.querySelectorAll('.bet-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
        btn.removeAttribute('data-chip');
    });
    resultArea.classList.add('hidden');
    updateUI();
}

// ============================================================
//  בחירת צ'יפ
// ============================================================
function setupChips() {
    if (!chipsContainer) return;
    const chips = chipsContainer.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (state.isSpinning) return;
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.betAmount = Number(chip.dataset.value) || 10;
            showToast('סכום הימור: ' + state.betAmount, 'info');
        });
    });
}

// ============================================================
//  אנימציית סיבוב
// ============================================================
function startContinuousSpin() {
    const startTime = performance.now();
    const baseSpeed = 360 * 3;

    function animate(now) {
        const elapsed = (now - startTime) / 1000;
        const speed = baseSpeed * Math.max(0.3, 1 - elapsed * 0.15);
        state.wheelAngle = (state.wheelAngle + speed / 60) % 360;
        wheelEl.style.transform = `rotate(${state.wheelAngle}deg)`;
        state.animationId = requestAnimationFrame(animate);
    }
    state.animationId = requestAnimationFrame(animate);
}

function stopSpinOnNumber(winningNumber) {
    return new Promise(resolve => {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }

        const idx = Math.max(0, WHEEL_ORDER.indexOf(winningNumber));
        const anglePer = 360 / WHEEL_ORDER.length;
        const targetMod = (360 - (idx * anglePer)) % 360;
        const currentMod = state.wheelAngle % 360;
        const delta = (targetMod - currentMod + 360) % 360;
        const finalAngle = state.wheelAngle + 360 * 5 + delta;

        wheelEl.style.transition = 'transform 4s cubic-bezier(0.15, 0.8, 0.15, 1)';
        wheelEl.style.transform = `rotate(${finalAngle}deg)`;
        state.wheelAngle = finalAngle % 360;

        setTimeout(() => {
            wheelEl.style.transition = '';
            resolve();
        }, 4100);
    });
}

// ============================================================
//  סיבוב
// ============================================================
async function spin() {
    if (state.isSpinning || state.bets.length === 0) return;

    state.isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = '⏳ SPINNING...';
    resultArea.classList.add('hidden');

    wheelContainer.classList.add('growing');
    startContinuousSpin();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch('/api/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bets: state.bets.map(b => ({
                    type: b.type,
                    numbers: b.numbers,
                    amount: b.amount
                })),
                balance: state.balance
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errMsg = 'HTTP ' + response.status;
            try {
                const errBody = await response.json();
                errMsg = errBody.error || errMsg;
            } catch (_) {}
            showToast('שגיאת שרת: ' + errMsg, 'error');
            await stopSpinOnNumber(Math.floor(Math.random() * 37));
            return;
        }

        const result = await response.json();

        if (!result || !result.success) {
            showToast('שגיאה: ' + ((result && result.error) || 'Unknown'), 'error');
            await stopSpinOnNumber(Math.floor(Math.random() * 37));
            return;
        }

        const data = result.data;
        await stopSpinOnNumber(data.winningNumber);

        state.balance = data.newBalance;
        lastWinEl.textContent = data.totalWin > 0 ? '+' + data.totalWin : '—';

        displayResult(data);

        state.history.unshift(data.winningNumber);
        if (state.history.length > 12) state.history.pop();
        updateHistory();

        state.bets = [];
        document.querySelectorAll('.bet-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
            btn.removeAttribute('data-chip');
        });

    } catch (err) {
        clearTimeout(timeoutId);
        console.error('❌', err);
        if (err.name === 'AbortError') {
            showToast('פסק זמן - השרת לא הגיב', 'error');
        } else {
            showToast('שגיאת תקשורת עם השרת', 'error');
        }
        await stopSpinOnNumber(Math.floor(Math.random() * 37));
    } finally {
        state.isSpinning = false;
        spinBtn.textContent = '🎲 SPIN';
        wheelContainer.classList.remove('growing');
        updateUI();
    }
}

// ============================================================
//  הצגת תוצאה
// ============================================================
function displayResult(data) {
    resultArea.classList.remove('hidden');
    const num = data.winningNumber;
    winningNumberEl.textContent = num;

    if (num === 0) {
        winningNumberEl.style.color = '#2ecc71';
    } else if (RED_NUMBERS.includes(num)) {
        winningNumberEl.style.color = '#e74c3c';
    } else {
        winningNumberEl.style.color = '#ffffff';
    }

    const net = data.totalWin - data.totalBet;

    if (data.totalWin > 0) {
        winDetailsEl.innerHTML =
            `<div style="color:#4ade80;font-weight:bold;">🎉 WIN ${data.totalWin}</div>
             <div style="font-size:0.85em;margin-top:4px;">
                הימור: ${data.totalBet} | רווח נטו: ${net >= 0 ? '+' : ''}${net}
             </div>`;
    } else {
        winDetailsEl.innerHTML =
            `<div style="color:#e74c3c;font-weight:bold;">😢 LOSS</div>
             <div style="font-size:0.85em;margin-top:4px;">הפסדת ${data.totalBet}</div>`;
    }
}

// ============================================================
//  היסטוריה
// ============================================================
function updateHistory() {
    historyList.innerHTML = '';
    if (state.history.length === 0) {
        historyList.innerHTML = '<span class="no-history">—</span>';
        return;
    }

    state.history.forEach(num => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = num;

        if (num === 0) {
            item.style.background = '#0e8a4a';
        } else if (RED_NUMBERS.includes(num)) {
            item.style.background = '#b71c1c';
        } else {
            item.style.background = '#0a0a0a';
        }

        historyList.appendChild(item);
    });
}

// ============================================================
//  אתחול
// ============================================================
function init() {
    spinBtn.addEventListener('click', spin);
    clearBtn.addEventListener('click', clearBets);

    buildNumbersGrid();
    buildWheel();
    setupChips();
    updateUI();

    console.log('✅ Royal Roulette v5 אותחל');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
