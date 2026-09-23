בבקשה, הנה **הכל בקובץ אחד** - פשוט העתק את **כל** התוכן הזה ושמור אותו בשם `README.md`:

```markdown
# 🎰 Royal Roulette - European Roulette Game

משחק רולטה אירופית מלא עם שרת Node.js ו-RNG בצד השרת.

---

## 🚀 הרצה מקומית

### דרישות
- Node.js 14 ומעלה
- npm

### שלבים

```bash
# 1. שכפל את הפרויקט
git clone https://github.com/shalev7940/roulette-game-0.3.git
cd roulette-game-0.3

# 2. התקן תלויות
npm install

# 3. הפעל את השרת
npm start
```

פתח דפדפן בכתובת: **http://localhost:3000**

**חשוב:** השרת חייב לרוץ ברקע. אם תסגור את הטרמינל, המשחק יפסיק לעבוד.

---

## 🌐 הרצה בענן (Render)

המשחק מועלה ופועל ב-Render:

**כתובת:** https://roulette-game-0-3.onrender.com

### העלאה מחדש (אם צריך):
1. העלה את הקוד ל-GitHub.
2. הירשם ל-https://render.com.
3. New → Web Service → בחר את הריפו.
4. **Root Directory:** `roulette-game 0.3`
5. **Build Command:** `npm install`
6. **Start Command:** `npm start`
7. **Instance Type:** `Free`

---

## 🎮 איך משחקים

1. **בחר צ'יפ** - לחץ על אחד מהצ'יפים: 1, 5, 10, 25, 100.
2. **הצב הימור** - לחץ על:
   - **מספר בודד** (straight) - 35:1
   - **אדום/שחור** - 1:1
   - **זוגי/אי-זוגי** - 1:1
   - **1-18 / 19-36** - 1:1
   - **תריסר** (1st/2nd/3rd 12) - 2:1
   - **טור** (2:1) - 2:1
3. **הימורים מרובים** - אפשר להציב כמה הימורים בסיבוב אחד.
4. **בטל הימור** - לחץ שוב על אותו כפתור.
5. **נקה הכל** - כפתור CLEAR.
6. **סובב** - כפתור SPIN.

לאחר הסיבוב:
- המספר הזוכה מוצג על הגלגל.
- הזכיות מוצגות.
- היתרה מתעדכנת.
- התוצאה נשמרת בהיסטוריה.

---

## 🔄 זרימת המשחק

```
┌─────────────────┐
│  המשתמש בוחר    │
│  הימור          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  הימור נשמר     │
│  ב-state.bets   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  המשתמש לוחץ    │
│  SPIN           │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  POST /api/spin         │
│  { bets, balance }      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  השרת:                  │
│  1. ולידציה             │
│  2. RNG (0-36)          │
│  3. חישוב זכיות         │
│  4. חישוב יתרה חדשה     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  JSON Response          │
│  { winningNumber,       │
│    totalWin,            │
│    newBalance, ... }    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────┐
│  הלקוח מציג:    │
│  - מספר זוכה    │
│  - זכיות        │
│  - יתרה חדשה    │
│  - היסטוריה     │
└─────────────────┘
```

---

## 🏗️ ארכיטקטורה

### Frontend
- **HTML5** - מבנה הדף.
- **CSS3** - עיצוב קזינו ריאליסטי עם רספונסיביות.
- **JavaScript (vanilla)** - לוגיקת המשחק, ניהול מצב, תקשורת עם השרת.
- **SVG** - גלגל רולטה דינמי עם 37 מקטעים.

### Backend
- **Node.js** - סביבת הרצה.
- **Express.js** - שרת HTTP ו-API.
- **CORS** - תמיכה בבקשות cross-origin.

### תקשורת
- **REST API** - בקשה אחת לכל סיבוב.
- **JSON** - פורמט התקשורת.
- **AbortController** - timeout של 15 שניות לבקשה.

### RNG (מקור האמת)
- **בצד השרת בלבד** - `Math.random()`.
- הלקוח **לא** יוצר מספרים אקראיים.
- השרת הוא מקור האמת הבלעדי לתוצאת הסיבוב.

---

## 📋 דוגמאות בקשות ותשובות

### בקשת סיבוב
```http
POST /api/spin
Content-Type: application/json

{
  "bets": [
    { "type": "straight", "numbers": [7], "amount": 10 },
    { "type": "red", "numbers": [], "amount": 20 }
  ],
  "balance": 1000
}
```

### תשובת שרת (הצלחה)
```json
{
  "success": true,
  "data": {
    "winningNumber": 23,
    "totalBet": 30,
    "totalWin": 20,
    "newBalance": 990,
    "betResults": [
      {
        "type": "straight",
        "numbers": [7],
        "amount": 10,
        "win": 0,
        "isWinner": false
      },
      {
        "type": "red",
        "numbers": [],
        "amount": 20,
        "win": 20,
        "isWinner": true
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### תשובת שרת (שגיאה)
```json
{
  "success": false,
  "error": "Insufficient balance"
}
```

### סוגי הימורים נתמכים

| סוג | קוד | תשלום | דוגמה |
|------|-----|--------|--------|
| מספר בודד | `straight` | 35:1 | `{ "type": "straight", "numbers": [7], "amount": 10 }` |
| אדום | `red` | 1:1 | `{ "type": "red", "numbers": [], "amount": 20 }` |
| שחור | `black` | 1:1 | `{ "type": "black", "numbers": [], "amount": 20 }` |
| זוגי | `even` | 1:1 | `{ "type": "even", "numbers": [], "amount": 20 }` |
| אי-זוגי | `odd` | 1:1 | `{ "type": "odd", "numbers": [], "amount": 20 }` |
| 1-18 | `low` | 1:1 | `{ "type": "low", "numbers": [], "amount": 20 }` |
| 19-36 | `high` | 1:1 | `{ "type": "high", "numbers": [], "amount": 20 }` |
| תריסר ראשון | `dozen` | 2:1 | `{ "type": "dozen", "numbers": [1], "amount": 20 }` |
| תריסר שני | `dozen` | 2:1 | `{ "type": "dozen", "numbers": [2], "amount": 20 }` |
| תריסר שלישי | `dozen` | 2:1 | `{ "type": "dozen", "numbers": [3], "amount": 20 }` |
| טור 1 | `column` | 2:1 | `{ "type": "column", "numbers": [1], "amount": 20 }` |
| טור 2 | `column` | 2:1 | `{ "type": "column", "numbers": [2], "amount": 20 }` |
| טור 3 | `column` | 2:1 | `{ "type": "column", "numbers": [3], "amount": 20 }` |

---

## 🔍 חקר המשחק הקיים (Spinomenal)

ניתחתי את Spinomenal European Roulette עם Chrome DevTools.
הממצאים המלאים מתועדים ב-[SPINOMENAL_RESEARCH.md](./SPINOMENAL_RESEARCH.md).

**תקציר הממצאים:**
- Spinomenal משתמשת ב-**WebSocket** לתקשורת עם השרת (לא REST API גלוי).
- RNG בצד השרת.
- תמיכה בכל סוגי ההימורים הסטנדרטיים.
- מצב Fun Mode עם יתרה התחלתית של 5,000.
- טווח הימורים: 0.01 - 100.

**המימוש שלי:**
- REST API מבוסס JSON (בגלל שהמטלה דורשת פורמט "דומה לסטנדרט").
- RNG בצד השרת ✓
- כל סוגי ההימורים הנדרשים ✓
- רספונסיבי לדסקטופ ולמובייל ✓

---

## 📁 מבנה הפרויקט

```
roulette-game-0.3/
├── package.json               # תלויות וסקריפטים
├── README.md                  # הקובץ הזה
├── SPINOMENAL_RESEARCH.md     # תיעוד חקר Spinomenal
├── client/                    # צד הלקוח
│   ├── index.html             # מסך המשחק
│   ├── style.css              # עיצוב
│   └── script.js              # לוגיקה
└── server/                    # צד השרת
    └── server.js              # Express + RNG
```

---

## 📱 תמיכה במובייל

המשחק **רספונסיבי לחלוטין**:

- **דסקטופ** - רשת 12 עמודות עם כפתורים גדולים.
- **טאבלט** - רשת מתאימה את עצמה.
- **מובייל (portrait)** - רשת 6 עמודות, כפתורים בגודל מגע נוח.
- **מובייל קטן** - התאמות נוספות לגדלים קטנים.

### איך לבדוק במובייל:
1. הרץ את השרת על המחשב.
2. מצא את כתובת ה-IP המקומית: `ipconfig` (Windows) או `ifconfig` (Mac/Linux).
3. גלוש מהנייד ל: `http://<your-ip>:3000`.

---

## 🛠️ פתרון בעיות

### השרת לא עולה
**שגיאה:** `npm : File ... npm.ps1 cannot be loaded`
**פתרון:** הרץ ב-CMD במקום PowerShell, או הרץ `npm.cmd start`.

### השרת לא מגיב
**שגיאה:** "שגיאת תקשורת עם השרת"
**פתרון:** ודא שהשרת רץ (`npm start`) ושהוא לא נסגר.

### המשחק לא נטען ב-Render
**שגיאה:** "Application loading..."
**פתרון:** ב-Free tier, השרת נרדם אחרי 15 דקות. הביקור הראשון ייקח 30-60 שניות.

### פורט 3000 תפוס
**שגיאה:** `EADDRINUSE`
**פתרון:** סגור תהליכים אחרים או שנה את הפורט ב-`server/server.js`.

---

## 📜 רישיון

פרויקט למטרת לימוד בלבד (Vibe Coding Exercise).

**אין** שימוש בקוד, אמנות, סאונד, או נכסים של Spinomenal.
כל הקוד נכתב מאפס.

---

## 👤 יוצר

**Shalev** - Vibe Coding Exercise
```
