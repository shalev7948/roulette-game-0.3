/**
 * ============================================================
 *  European Roulette - Server (v3 - All bugs fixed)
 * ============================================================
 *  מקור האמת: RNG, חישוב זכיות, ולידציה של הימורים.
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '../client')));

// ============================================================
//  נתוני הרולטה האירופית
// ============================================================
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const VALID_BET_TYPES = ['straight', 'red', 'black', 'odd', 'even', 'low', 'high', 'dozen', 'column'];

// ============================================================
//  RNG - מחולל מספרים אקראיים
// ============================================================
function spinWheel() {
    return Math.floor(Math.random() * 37); // 0-36
}

// ============================================================
//  ניקוי והמרה של מערך מספרים
// ============================================================
function sanitizeNumbers(raw) {
    if (Array.isArray(raw)) {
        return raw
            .map(Number)
            .filter(n => Number.isInteger(n) && n >= 0 && n <= 36);
    }
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed === '') return [];
        return trimmed
            .split(',')
            .map(s => Number(s.trim()))
            .filter(n => Number.isInteger(n) && n >= 0 && n <= 36);
    }
    return [];
}

// ============================================================
//  ולידציה של הימור בודד + נרמול
// ============================================================
function normalizeBet(bet) {
    if (!bet || typeof bet !== 'object') return null;
    if (typeof bet.type !== 'string') return null;

    const type = bet.type.toLowerCase().trim();
    if (!VALID_BET_TYPES.includes(type)) return null;

    const amount = Math.floor(Number(bet.amount));
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const numbers = sanitizeNumbers(bet.numbers);

    // בדיקות ספציפיות לפי סוג
    if (type === 'straight' && numbers.length === 0) return null;
    if (type === 'dozen' && (numbers.length === 0 || ![1, 2, 3].includes(numbers[0]))) return null;
    if (type === 'column' && (numbers.length === 0 || ![1, 2, 3].includes(numbers[0]))) return null;

    return { type, numbers, amount };
}

// ============================================================
//  חישוב זכייה להימור בודד
// ============================================================
function calculateBetWin(bet, winningNumber) {
    const { type, numbers, amount } = bet;

    // --- מקרה מיוחד: יצא 0 ---
    if (winningNumber === 0) {
        if (type === 'straight' && numbers.includes(0)) {
            return amount * 36; // 35:1 + קרן
        }
        return 0;
    }

    const isRed = RED_NUMBERS.includes(winningNumber);
    const isOdd = winningNumber % 2 !== 0;

    switch (type) {
        case 'straight':
            return numbers.includes(winningNumber) ? amount * 36 : 0;
        case 'red':
            return isRed ? amount * 2 : 0;
        case 'black':
            return !isRed ? amount * 2 : 0;
        case 'odd':
            return isOdd ? amount * 2 : 0;
        case 'even':
            return !isOdd ? amount * 2 : 0;
        case 'low':
            return (winningNumber >= 1 && winningNumber <= 18) ? amount * 2 : 0;
        case 'high':
            return (winningNumber >= 19 && winningNumber <= 36) ? amount * 2 : 0;
        case 'dozen': {
            const dozen = numbers[0];
            if (dozen === 1 && winningNumber >= 1 && winningNumber <= 12) return amount * 3;
            if (dozen === 2 && winningNumber >= 13 && winningNumber <= 24) return amount * 3;
            if (dozen === 3 && winningNumber >= 25 && winningNumber <= 36) return amount * 3;
            return 0;
        }
        case 'column': {
            const col = numbers[0];
            if (col === 1 && winningNumber % 3 === 1) return amount * 3;
            if (col === 2 && winningNumber % 3 === 2) return amount * 3;
            if (col === 3 && winningNumber % 3 === 0) return amount * 3;
            return 0;
        }
        default:
            return 0;
    }
}

// ============================================================
//  Endpoint: POST /api/spin
// ============================================================
app.post('/api/spin', (req, res) => {
    try {
        console.log('\n📥 בקשת סיבוב התקבלה');

        const { bets, balance } = req.body || {};

        // --- ולידציה כללית ---
        if (!bets || !Array.isArray(bets) || bets.length === 0) {
            return res.status(400).json({ success: false, error: 'No bets placed' });
        }
        if (bets.length > 100) {
            return res.status(400).json({ success: false, error: 'Too many bets' });
        }
        if (typeof balance !== 'number' || !Number.isFinite(balance) || balance < 0) {
            return res.status(400).json({ success: false, error: 'Invalid balance' });
        }

        // --- נרמול וסינון הימורים ---
        const validBets = bets
            .map(normalizeBet)
            .filter(b => b !== null);

        if (validBets.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid bets' });
        }

        const totalBet = validBets.reduce((sum, bet) => sum + bet.amount, 0);

        if (totalBet > balance) {
            return res.status(400).json({ success: false, error: 'Insufficient balance' });
        }

        // --- RNG (מקור האמת) ---
        const winningNumber = spinWheel();
        console.log('🎲 מספר זוכה:', winningNumber);

        // --- חישוב זכיות ---
        let totalWin = 0;
        const betResults = validBets.map(bet => {
            const win = calculateBetWin(bet, winningNumber);
            totalWin += win;
            return {
                type: bet.type,
                numbers: bet.numbers,
                amount: bet.amount,
                win: win,
                isWinner: win > 0
            };
        });

        const newBalance = Math.round((balance - totalBet + totalWin) * 100) / 100;
        console.log('💰 הימור:', totalBet, '| זכייה:', totalWin, '| יתרה חדשה:', newBalance);

        res.json({
            success: true,
            data: {
                winningNumber,
                totalBet,
                totalWin,
                newBalance,
                betResults,
                timestamp: new Date().toISOString()
            }
        });

    } catch (err) {
        console.error('❌ שגיאה בשרת:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================================
//  Catch-all ל-GET בלבד - מחזיר index.html
// ============================================================
app.get('*', (req, res) => {
    // לא לחזור על בקשות API
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ============================================================
//  טיפול בשגיאות - לא מחזיר HTML ל-API
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ שגיאה כללית:', err);
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({ success: false, error: 'Server error' });
    }
    res.status(500).send('Server error');
});

// ============================================================
//  הפעלת השרת
// ============================================================
app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('✅ שרת הרולטה פועל!');
    console.log('🌐 פתח דפדפן: http://localhost:' + PORT);
    console.log('========================================');
    console.log('');
});