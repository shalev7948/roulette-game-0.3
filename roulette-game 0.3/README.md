# 🎰 Royal Roulette - European Roulette Game

משחק רולטה אירופית מלא עם שרת Node.js ו-RNG בצד השרת.

## 🚀 הרצה מקומית

### דרישות
- Node.js 14+

### שלבים

\`\`\`bash
# 1. שכפל את הפרויקט
git clone https://github.com/YOUR_USERNAME/roulette-game.git
cd roulette-game

# 2. התקן תלויות
npm install

# 3. הפעל את השרת
npm start
\`\`\`

פתח דפדפן בכתובת: **http://localhost:3000**

## 🌐 הרצה בענן (Render)

1. העלה את הקוד ל-GitHub.
2. הירשם ל-https://render.com.
3. New → Web Service → בחר את הריפו.
4. Build Command: \`npm install\`
5. Start Command: \`npm start\`
6. Instance Type: \`Free\`

## 🎮 איך משחקים

1. בחר צ'יפ (1, 5, 10, 25, 100).
2. לחץ על מספר, אדום/שחור, זוגי/אי-זוגי, 1-18/19-36, תריסר או טור.
3. לחץ **SPIN**.
4. התוצאה מגיעה מהשרת ומתעדכנת במסך.

## 🏗️ ארכיטקטורה

- **Frontend:** HTML, CSS, JavaScript (vanilla).
- **Backend:** Node.js + Express.
- **תקשורת:** POST `/api/spin` עם JSON.
- **RNG:** בצד השרת בלבד (מקור אמת).

### דוגמת בקשה

\`\`\`json
{
  "bets": [
    { "type": "straight", "numbers": [7], "amount": 10 },
    { "type": "red", "numbers": [], "amount": 20 }
  ],
  "balance": 1000
}
\`\`\`

### דוגמת תשובה

\`\`\`json
{
  "success": true,
  "data": {
    "winningNumber": 23,
    "totalBet": 30,
    "totalWin": 20,
    "newBalance": 990,
    "betResults": [...]
  }
}
\`\`\`

## 📱 תמיכה במובייל

המשחק רספונסיבי לחלוטין – עובד בדסקטופ ובמובייל (כולל portrait).

## 📜 רישיון

פרויקט למטרת לימוד בלבד.