/**
 * ============================================================
 *  European Roulette - Client (v9 - Realistic 3D Ball)
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
    ballAngle: 0,
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

            if (RED_NUMBERS.includes(num)) {
                btn.classList.add('red');
            } else {
                btn.classList.add('black');
            }

            numbersGrid.appendChild(btn);
        }
    }
}

// ============================================================
//  בניית הגלגל הריאליסטי עם SVG + כדור תלת-ממדי
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

    // ============================================================
    //  גרדיאנט כדור תלת-ממדי
    // ============================================================
    const ballGrad = document.createElementNS(svgNS, 'radialGradient');
    ballGrad.setAttribute('id', 'ballGrad');
    ballGrad.setAttribute('cx', '32%');
    ballGrad.setAttribute('cy', '28%');
    ballGrad.setAttribute('r', '70%');
    const bs1 = document.createElementNS(svgNS, 'stop');
    bs1.setAttribute('offset', '0%');
    bs1.setAttribute('stop-color', '#ffffff');
    const bs2 = document.createElementNS(svgNS, 'stop');
    bs2.setAttribute('offset', '30%');
    bs2.setAttribute('stop-color', '#f8f8f8');
    const bs3 = document.createElementNS(svgNS, 'stop');
    bs3.setAttribute('offset', '60%');
    bs3.setAttribute('stop-color', '#d8d8d8');
    const bs4 = document.createElementNS(svgNS, 'stop');
    bs4.setAttribute('offset', '85%');
    bs4.setAttribute('stop-color', '#a0a0a0');
    const bs5 = document.createElementNS(svgNS, 'stop');
    bs5.setAttribute('offset', '100%');
    bs5.setAttribute('stop-color', '#606060');
    ballGrad.appendChild(bs1);
    ballGrad.appendChild(bs2);
    ballGrad.appendChild(bs3);
    ballGrad.appendChild(bs4);
    ballGrad.appendChild(bs5);
    defs.appendChild(ballGrad);

    // ============================================================
    //  הילה זוהרת לכדור (Glow)
    // ============================================================
    const ballGlow = document.createElementNS(svgNS, 'radialGradient');
    ballGlow.setAttribute('id', 'ballGlow');
    ballGlow.setAttribute('cx', '50%');
    ballGlow.setAttribute('cy', '50%');
    const bg1 = document.createElementNS(svgNS, 'stop');
    bg1.setAttribute('offset', '0%');
    bg1.setAttribute('stop-color', 'rgba(255, 255, 255, 0.9)');
    bg1.setAttribute('stop-opacity', '0.9');
    const bg2 = document.createElementNS(svgNS, 'stop');
    bg2.setAttribute('offset', '70%');
    bg2.setAttribute('stop-color', 'rgba(255, 255, 255, 0.4)');
    bg2.setAttribute('stop-opacity', '0.4');
    const bg3 = document.createElementNS(svgNS, 'stop');
    bg3.setAttribute('offset', '100%');
    bg3.setAttribute('stop-color', 'rgba(255, 255, 255, 0)');
    bg3.setAttribute('stop-opacity', '0');
    ballGlow.appendChild(bg1);
    ballGlow.appendChild(bg2);
    ballGlow.appendChild(bg3);
    defs.appendChild(ballGlow);

    // ============================================================
    //  פילטר לצל של הכדור
    // ============================================================
    const shadowFilter = document.createElementNS(svgNS, 'filter');
    shadowFilter.setAttribute('id', 'ballShadow');
    shadowFilter.setAttribute('x', '-50%');
    shadowFilter.setAttribute('y', '-50%');
    shadowFilter.setAttribute('width', '200%');
    shadowFilter.setAttribute('height', '200%');
    const feGaussian = document.createElementNS(svgNS, 'feGaussianBlur');
    feGaussian.setAttribute('in', 'SourceAlpha');
    feGaussian.setAttribute('stdDeviation', '2');
    const feOffset = document.createElementNS(svgNS, 'feOffset');
    feOffset.setAttribute('dx', '1');
    feOffset.setAttribute('dy', '2');
    feOffset.setAttribute('result', 'offsetblur');
    const feFlood = document.createElementNS(svgNS, 'feFlood');
    feFlood.setAttribute('flood-color', 'rgba(0, 0, 0, 0.7)');
    const feComposite = document.createElementNS(svgNS, 'feComposite');
    feComposite.setAttribute('in', 'offsetblur');
    feComposite.setAttribute('in2', 'SourceGraphic');
    feComposite.setAttribute('operator', 'in');
    const feMerge = document.createElementNS(svgNS, 'feMerge');
    const feMergeNode1 = document.createElementNS(svgNS, 'feMergeNode');
    const feMergeNode2 = document.createElementNS(svgNS, 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    shadowFilter.appendChild(feGaussian);
    shadowFilter.appendChild(feOffset);
    shadowFilter.appendChild(feFlood);
    shadowFilter.appendChild(feComposite);
    shadowFilter.appendChild(feMerge);
    defs.appendChild(shadowFilter);

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

    // --- קבוצת הגלגל ---
    const wheelGroup = document.createElementNS(svgNS, 'g');
    wheelGroup.setAttribute('id', 'wheel-group');
    wheelGroup.style.transformOrigin = `${center}px ${center}px`;
    svg.appendChild(wheelGroup);

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
        wheelGroup.appendChild(polygon);

        const sep = document.createElementNS(svgNS, 'line');
        sep.setAttribute('x1', center + innerR * Math.cos(startRad));
        sep.setAttribute('y1', center + innerR * Math.sin(startRad));
        sep.setAttribute('x2', center + outerR * Math.cos(startRad));
        sep.setAttribute('y2', center + outerR * Math.sin(startRad));
        sep.setAttribute('stroke', 'rgba(212, 175, 55, 0.5)');
        sep.setAttribute('stroke-width', '0.8');
        wheelGroup.appendChild(sep);

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
        wheelGroup.appendChild(text);

        const dotX = center + (outerR - 6) * Math.cos(textRad);
        const dotY = center + (outerR - 6) * Math.sin(textRad);
        const dot = document.createElementNS(svgNS, 'circle');
        dot.setAttribute('cx', dotX);
        dot.setAttribute('cy', dotY);
        dot.setAttribute('r', '1.6');
        dot.setAttribute('fill', '#f9e79f');
        wheelGroup.appendChild(dot);
    });

    // --- טבעת פנימית ---
    const innerRing = document.createElementNS(svgNS, 'circle');
    innerRing.setAttribute('cx', center);
    innerRing.setAttribute('cy', center);
    innerRing.setAttribute('r', innerR);
    innerRing.setAttribute('fill', 'none');
    innerRing.setAttribute('stroke', '#d4af37');
    innerRing.setAttribute('stroke-width', '2');
    wheelGroup.appendChild(innerRing);

    // --- מרכז זהוב ---
    const hub = document.createElementNS(svgNS, 'circle');
    hub.setAttribute('cx', center);
    hub.setAttribute('cy', center);
    hub.setAttribute('r', innerR - 5);
    hub.setAttribute('fill', 'url(#hubGrad)');
    hub.setAttribute('stroke', '#5c4508');
    hub.setAttribute('stroke-width', '2');
    wheelGroup.appendChild(hub);

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
        wheelGroup.appendChild(spoke);
    }

    // --- ציר מרכזי ---
    const axle = document.createElementNS(svgNS, 'circle');
    axle.setAttribute('cx', center);
    axle.setAttribute('cy', center);
    axle.setAttribute('r', '18');
    axle.setAttribute('fill', 'url(#hubGrad)');
    axle.setAttribute('stroke', '#5c4508');
    axle.setAttribute('stroke-width', '1.5');
    wheelGroup.appendChild(axle);

    const axleDot = document.createElementNS(svgNS, 'circle');
    axleDot.setAttribute('cx', center);
    axleDot.setAttribute('cy', center);
    axleDot.setAttribute('r', '6');
    axleDot.setAttribute('fill', '#fff8dc');
    axleDot.setAttribute('opacity', '0.85');
    wheelGroup.appendChild(axleDot);

    // ============================================================
    //  הכדור - תלת-ממדי עם צל והילה
    // ============================================================
    const ballRadius = 7;
    const ballOrbit = outerR - 14;

    const ballGroup = document.createElementNS(svgNS, 'g');
    ballGroup.setAttribute('id', 'roulette-ball-group');
    ballGroup.style.transformOrigin = `${center}px ${center}px`;

    // --- צל הכדור (מאחוריו) ---
    const ballShadow = document.createElementNS(svgNS, 'ellipse');
    ballShadow.setAttribute('cx', center + 1);
    ballShadow.setAttribute('cy', center - ballOrbit + 2);
    ballShadow.setAttribute('rx', ballRadius * 1.1);
    ballShadow.setAttribute('ry', ballRadius * 0.7);
    ballShadow.setAttribute('fill', 'rgba(0, 0, 0, 0.5)');
    ballShadow.setAttribute('filter', 'url(#ballShadow)');
    ballGroup.appendChild(ballShadow);

    // --- הילה זוהרת ---
    const ballGlowCircle = document.createElementNS(svgNS, 'circle');
    ballGlowCircle.setAttribute('cx', center);
    ballGlowCircle.setAttribute('cy', center - ballOrbit);
    ballGlowCircle.setAttribute('r', ballRadius * 2.2);
    ballGlowCircle.setAttribute('fill', 'url(#ballGlow)');
    ballGlowCircle.setAttribute('opacity', '0.6');
    ballGroup.appendChild(ballGlowCircle);

    // --- הכדור עצמו ---
    const ball = document.createElementNS(svgNS, 'circle');
    ball.setAttribute('cx', center);
    ball.setAttribute('cy', center - ballOrbit);
    ball.setAttribute('r', ballRadius);
    ball.setAttribute('fill', 'url(#ballGrad)');
    ball.setAttribute('stroke', '#555');
    ball.setAttribute('stroke-width', '0.8');
    ball.setAttribute('filter', 'url(#ballShadow)');
    ballGroup.appendChild(ball);

    // --- נקודת אור קטנה (השתקפות) ---
    const ballHighlight = document.createElementNS(svgNS, 'ellipse');
    ballHighlight.setAttribute('cx', center - 2);
    ballHighlight.setAttribute('cy', center - ballOrbit - 2);
    ballHighlight.setAttribute('rx', '2.5');
    ballHighlight.setAttribute('ry', '1.8');
    ballHighlight.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
    ballHighlight.setAttribute('transform', `rotate(-30 ${center - 2} ${center - ballOrbit - 2})`);
    ballGroup.appendChild(ballHighlight);

    svg.appendChild(ballGroup);

    wheelNumbersEl.appendChild(svg);
}

// ============================================================
//  לחיצה על כפתור הימור
// ============================================================
function handleBetClick(btn) {
    if (!btn || state.isSpinning) return;

    const type = btn.dataset.type;
    const numbersRaw = btn.dataset.numbers;

    if (!type) return;

    let numbers = [];
    if (numbersRaw && numbersRaw.trim() !== '') {
        numbers = numbersRaw.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    }

    const key = type + '-' + (numbers.length > 0 ? numbers.join(',') : 'empty');

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
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.isSpinning) return;
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.betAmount = Number(chip.dataset.value) || 10;
            showToast('סכום הימור: ' + state.betAmount, 'info');
        });
    });
}

// ============================================================
//  Event Delegation - חיבור כל הכפתורים
// ============================================================
function attachBetListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('#spin-btn') || e.target.closest('#clear-btn')) {
            return;
        }
        if (e.target.closest('.chip')) {
            return;
        }
        const btn = e.target.closest('.bet-btn');
        if (!btn) return;
        e.preventDefault();
        handleBetClick(btn);
    });
}

// ============================================================
//  אנימציית סיבוב - איטית ומציאותית
// ============================================================
function startContinuousSpin() {
    const wheelGroup = document.getElementById('wheel-group');
    const ballGroup = document.getElementById('roulette-ball-group');

    const startTime = performance.now();
    // --- מהירויות איטיות יותר ---
    const wheelBaseSpeed = 360 * 0.5;    // גלגל - מאוד איטי
    const ballBaseSpeed = -360 * 2.5;    // כדור - מהיר יותר אך לא מוגזם

    function animate(now) {
        const elapsed = (now - startTime) / 1000;
        // האטה הדרגתית - איטית יותר לאורך זמן
        const wheelSpeed = wheelBaseSpeed * Math.max(0.4, 1 - elapsed * 0.08);
        const ballSpeed = ballBaseSpeed * Math.max(0.3, 1 - elapsed * 0.06);

        state.wheelAngle = (state.wheelAngle + wheelSpeed / 60) % 360;
        state.ballAngle = (state.ballAngle + ballSpeed / 60) % 360;

        if (wheelGroup) wheelGroup.style.transform = `rotate(${state.wheelAngle}deg)`;
        if (ballGroup) ballGroup.style.transform = `rotate(${state.ballAngle}deg)`;

        state.animationId = requestAnimationFrame(animate);
    }
    state.animationId = requestAnimationFrame(animate);
}

// ============================================================
//  עצירה - הכדור נוחת על המספר הזוכה
// ============================================================
function stopSpinOnNumber(winningNumber) {
    return new Promise(resolve => {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }

        const wheelGroup = document.getElementById('wheel-group');
        const ballGroup = document.getElementById('roulette-ball-group');

        const idx = Math.max(0, WHEEL_ORDER.indexOf(winningNumber));
        const anglePer = 360 / WHEEL_ORDER.length;

        // חישוב הזווית של המספר בגלגל
        const numberAngleInWheel = -90 + idx * anglePer;

        // הגלגל נעצר בזווית אקראית קלה
        const finalWheelAngle = state.wheelAngle + 360 * 1.5 + (Math.random() * 90 - 45);
        const numberAngleAfterWheel = numberAngleInWheel + finalWheelAngle;

        // הזווית הסופית של הכדור - שתי נפילות אקראיות קלות + סיבוב ארוך
        const targetBallAngle = -numberAngleAfterWheel;
        const currentBallAngle = state.ballAngle;
        const ballDelta = ((targetBallAngle - currentBallAngle) % 360 + 360) % 360;

        // --- סיבוב ארוך במיוחד ---
        const finalBallAngle = currentBallAngle + 360 * 8 + ballDelta;

        // --- אנימציה ---
        if (wheelGroup) {
            wheelGroup.style.transition = 'transform 6s cubic-bezier(0.15, 0.8, 0.2, 1)';
            wheelGroup.style.transform = `rotate(${finalWheelAngle}deg)`;
        }

        if (ballGroup) {
            ballGroup.style.transition = 'transform 6s cubic-bezier(0.2, 0.85, 0.15, 1)';
            ballGroup.style.transform = `rotate(${finalBallAngle}deg)`;
        }

        state.wheelAngle = finalWheelAngle % 360;
        state.ballAngle = finalBallAngle % 360;

        setTimeout(() => {
            if (wheelGroup) wheelGroup.style.transition = '';
            if (ballGroup) ballGroup.style.transition = '';
            resolve();
        }, 6100);
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
    const timeoutId = setTimeout(() => controller.abort(), 20000);

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
    buildNumbersGrid();
    buildWheel();
    attachBetListeners();

    spinBtn.addEventListener('click', spin);
    clearBtn.addEventListener('click', clearBets);

    setupChips();
    updateUI();

    console.log('✅ Royal Roulette v9 - Realistic Ball');
}

window.addEventListener('load', init);
