/**
 * ============================================================
 *  European Roulette - Client (v4 - תיקון כל הבעיות)
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

// סדר המספרים על גלגל רולטה אירופי (נגד כיוון השעון)
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
//  בניית לוח המספרים - סדר נכון כמו רולטה אמיתית
//  הטור הימני: 3, 6, 9, ..., 36
//  האמצעי:     2, 5, 8, ..., 35
//  השמאלי:     1, 4, 7, ..., 34
//  
//  ויזואלית מלמעלה למטה: 36,35,34 ... 3,2,1
//  כלומר שורה עליונה = 36,35,34; שורה תחתונה = 3,2,1
// ============================================================
function buildNumbersGrid() {
    numbersGrid.innerHTML = '';
    
    // 12 שורות, כל שורה 3 מספרים
    // שורה r (0-11) מכילה את המספרים: 
    //   שמאלי: (11-r)*3 + 1
    //   אמצעי: (11-r)*3 + 2
    //   ימני:  (11-r)*3 + 3
    // סדר ויזואלי בתוך השורה: ימני, אמצעי, שמאלי (כדי ש-3,2,1 יופיעו משמאל לימין)
    for (let row = 0; row < 12; row++) {
        const base = (11 - row) * 3; // 33, 30, 27, ...
        // שלושה מספרים: base+3, base+2, base+1
        for (let i = 0; i < 3; i++) {
            const num = base + (3 - i); // 3,2,1 או 6,5,4 וכן הלאה
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
//  בניית הגלגל - מספרים סביב ההיקף
// ============================================================
function buildWheel() {
    wheelNumbersEl.innerHTML = '';
    const total = WHEEL_ORDER.length; // 37
    const container = wheelNumbersEl;
    const radiusPercent = 38; // אחוז מהרדיוס של ההיקף

    WHEEL_ORDER.forEach((num, idx) => {
        const angle = (idx / total) * 360;
        const span = document.createElement('span');
        span.className = 'wnum';
        span.textContent = num;
        
        // המיקום: מתחילים ממרכז, ומזיזים החוצה בזווית
        span.style.transform = 
            `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radiusPercent * 2}px) rotate(-${angle}deg)`;
        
        if (num === 0) {
            span.style.color = '#2ecc71';
        } else if (RED_NUMBERS.includes(num)) {
            span.style.color = '#ff6b6b';
        } else {
            span.style.color = '#fff';
        }

        container.appendChild(span);
    });
}

// ============================================================
//  לחיצה על כפתור הימור
// ============================================================
function handleBetClick(btn) {
    if (!btn || state.isSpinning) return;

    const type = btn.dataset.type;
    const numbersRaw = btn.dataset.numbers;
    const key = btn.dataset.key || (type + '-' + numbersRaw);

    if (!type || !key) {
        console.warn('Invalid bet button', btn);
        return;
    }

    // המרה נכונה: "" => [], "5" => [5], "1,2" => [1,2]
    let numbers = [];
    if (numbersRaw && numbersRaw.trim() !== '') {
        numbers = numbersRaw.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    }

    // חיפוש הימור קיים לפי key
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
    const baseSpeed = 360 * 3; // 1080° לשנייה

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

    console.log('✅ Royal Roulette אותחל');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
