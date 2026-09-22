/**
 * ============================================================
 *  European Roulette - Client (v3 - All bugs fixed)
 * ============================================================
 *  - בניית הלוח והגלגל
 *  - ניהול הימורים
 *  - תקשורת עם השרת
 *  - אנימציית סיבוב רציפה
 * ============================================================
 */

// ============================================================
//  מצב המשחק
// ============================================================
const state = {
    balance: 1000,
    bets: [],              // [{ type, numbers, amount, key }]
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
//  בניית לוח המספרים 1-36
//  סדר: 12 עמודות × 3 שורות
//  שורה עליונה: 3, 2, 1
//  שורה תחתונה: 36, 35, 34
// ============================================================
function buildNumbersGrid() {
    numbersGrid.innerHTML = '';
    for (let row = 0; row < 12; row++) {
        for (let i = 0; i < 3; i++) {
            const num = row * 3 + (3 - i);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'bet-btn num-btn';
            btn.textContent = num;
            btn.dataset.type = 'straight';
            btn.dataset.numbers = num;
            btn.dataset.key = 'straight-' + num;
            btn.setAttribute('aria-label', 'הימור על ' + num);

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
//  בניית הגלגל
// ============================================================
function buildWheel() {
    wheelNumbersEl.innerHTML = '';
    const total = WHEEL_ORDER.length; // 37
    const radius = 40; // אחוז מהרדיוס

    WHEEL_ORDER.forEach((num, idx) => {
        const angle = (idx / total) * 360;
        const span = document.createElement('span');
        span.className = 'wnum';
        span.textContent = num;
        span.style.transform =
            `rotate(${angle}deg) translateY(-${radius}%) rotate(-${angle}deg)`;

        if (num === 0) {
            span.style.color = '#2ecc71';
        } else if (RED_NUMBERS.includes(num)) {
            span.style.color = '#ff6b6b';
        } else {
            span.style.color = '#fff';
        }

        wheelNumbersEl.appendChild(span);
    });
}

// ============================================================
//  לחיצה על כפתור הימור
// ============================================================
function handleBetClick(btn) {
    if (!btn || state.isSpinning) return;

    const type = btn.dataset.type;
    const numbersRaw = btn.dataset.numbers || '';
    const key = btn.dataset.key || (type + '-' + numbersRaw);

    if (!type || !key) {
        console.warn('Invalid bet button', btn);
        return;
    }

    const numbers = numbersRaw === '' ? [] : numbersRaw.split(',').map(Number);

    // חיפוש הימור קיים
    const existingIdx = state.bets.findIndex(b => b.key === key);

    if (existingIdx >= 0) {
        // הסרה
        state.bets.splice(existingIdx, 1);
        btn.classList.remove('selected');
        btn.removeAttribute('data-chip');
    } else {
        // הוספה
        if (state.betAmount <= 0) {
            showToast('בחר צ\'יפ תקין', 'error');
            return;
        }

        const currentTotal = state.bets.reduce((s, b) => s + b.amount, 0);
        if (currentTotal + state.betAmount > state.balance) {
            showToast('אין מספיק יתרה!', 'error');
            return;
        }

        state.bets.push({
            type,
            numbers,
            amount: state.betAmount,
            key
        });
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
//  אנימציית סיבוב רציפה
// ============================================================
function startContinuousSpin() {
    const startTime = performance.now();
    const baseSpeed = 360 * 3; // 1080°/שנייה

    function animate(now) {
        const elapsed = (now - startTime) / 1000;
        const speed = baseSpeed * Math.max(0.3, 1 - elapsed * 0.15);
        state.wheelAngle = (state.wheelAngle + speed / 60) % 360;
        wheelEl.style.transform = `rotate(${state.wheelAngle}deg)`;
        state.animationId = requestAnimationFrame(animate);
    }
    state.animationId = requestAnimationFrame(animate);
}

// ============================================================
//  עצירה חלקה על המספר הזוכה
// ============================================================
function stopSpinOnNumber(winningNumber) {
    return new Promise(resolve => {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }

        const idx = Math.max(0, WHEEL_ORDER.indexOf(winningNumber));
        const anglePerNum = 360 / WHEEL_ORDER.length;

        // הזווית הסופית: סיבוב שלם + הזווית של המספר
        const targetMod = (360 - (idx * anglePerNum)) % 360;
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
//  סיבוב - פונקציה ראשית
// ============================================================
async function spin() {
    if (state.isSpinning || state.bets.length === 0) return;

    state.isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = '⏳ SPINNING...';
    resultArea.classList.add('hidden');

    // אנימציית הגדלה על ה-container (לא על ה-wheel)
    wheelContainer.classList.add('growing');
    startContinuousSpin();

    // --- AbortController עם timeout ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
            } catch (_) { /* ignore */ }
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

        // המתנה אנימציה + עצירה על המספר הזוכה
        await stopSpinOnNumber(data.winningNumber);

        // עדכון יתרה (מהשרת - מקור האמת)
        state.balance = data.newBalance;
        lastWinEl.textContent = data.totalWin > 0 ? '+' + data.totalWin : '—';

        // הצגת תוצאה
        displayResult(data);

        // היסטוריה
        state.history.unshift(data.winningNumber);
        if (state.history.length > 12) state.history.pop();
        updateHistory();

        // ניקוי הימורים
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
        // עצירה במקרה של שגיאה
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
//  אירועים ואתחול
// ============================================================
function init() {
    spinBtn.addEventListener('click', spin);
    clearBtn.addEventListener('click', clearBets);

    buildNumbersGrid();
    buildWheel();
    setupChips();
    updateUI();

    console.log('✅ Royal Roulette אותחל');
}

// הפעלה בטוחה
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}