// نستدعي المكتبات اللي ثبتناها
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// نسوي تطبيق express
const app = express();

// نبني سيرفر http فوق تطبيق express
const server = http.createServer(app);

// نربط socket.io بنفس السيرفر عشان يقدر يسوي تواصل حي
const io = new Server(server);

// نقول للسيرفر: أي ملفات داخل مجلد "public" اعرضها للمتصفح
app.use(express.static('public'));

// نحدد رقم "المنفذ" (Port) اللي بيشتغل عليه السيرفر محلياً
const PORT = process.env.PORT || 3000;

// نخزن نقاط كل فريق (تبدأ من صفر)
let scores = {
  team1: 0,
  team2: 0
};

io.on('connection', (socket) => {
  console.log('جهاز جديد اتصل بالسيرفر');

  socket.on('correctAnswer', (teamName) => {
    scores[teamName]++;
    console.log(`${teamName} جاوب صح! النقاط الحالية:`, scores);
    io.emit('updateScores', scores);
  });

  socket.on('resetGame', () => {
    scores.team1 = 0;
    scores.team2 = 0;
    console.log('تم تصفير المسابقة');
    io.emit('updateScores', scores);
    io.emit('restartQuestions');
  });
});

// نشغل السيرفر
server.listen(PORT, () => {
  console.log(`السيرفر شغال على المنفذ ${PORT}`);
});