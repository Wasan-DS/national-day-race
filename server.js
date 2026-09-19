// نستدعي المكتبات اللي ثبتناها
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');



const app = express();


const server = http.createServer(app);


const io = new Server(server);


app.use(express.static('public'));


const PORT = process.env.PORT || 3000;


let scores = {
  team1: 0,
  team2: 0
};


let finished = {
  team1: false,
  team2: false
};

// نخزن معلومات اللاعبة (الاسم والتخصص) لكل فريق
let players = {
  team1: { name: '', major: '' },
  team2: { name: '', major: '' }
};

// إحصائية التخصصات: كل تخصص كم مرة فاز وكم مرة خسر
let majorStats = {};

// دالة تسجل نتيجة تخصص معين (فوز أو خسارة أو تعادل)
function recordMajorResult(major, result) {
  if (!major) return;

  if (!majorStats[major]) {
    majorStats[major] = { wins: 0, losses: 0, ties: 0 };
  }

  if (result === 'win') majorStats[major].wins++;
  else if (result === 'loss') majorStats[major].losses++;
  else if (result === 'tie') majorStats[major].ties++;
}

io.on('connection', (socket) => {
  console.log('جهاز جديد اتصل بالسيرفر');

  socket.on('registerPlayer', (data) => {
    players[data.team] = { name: data.name, major: data.major };
    console.log(`${data.team} سجلت باسم ${data.name} (${data.major})`);
    io.emit('playersUpdated', players);
  });

  socket.on('correctAnswer', (teamName) => {
    scores[teamName]++;
    console.log(`${teamName} جاوب صح! النقاط الحالية:`, scores);
    io.emit('updateScores', scores);
  });

 
  socket.on('quizFinished', (teamName) => {
    finished[teamName] = true;
    console.log(`${teamName} خلص كل الأسئلة`);

   
    if (finished.team1 && finished.team2) {
      const team1Major = players.team1.major;
      const team2Major = players.team2.major;

      if (scores.team1 === scores.team2) {
        recordMajorResult(team1Major, 'tie');
        recordMajorResult(team2Major, 'tie');
        io.emit('gameOver', { result: 'tie' });
      } else if (scores.team1 > scores.team2) {
        recordMajorResult(team1Major, 'win');
        recordMajorResult(team2Major, 'loss');
        io.emit('gameOver', { result: 'win', winner: 'team1' });
      } else {
        recordMajorResult(team2Major, 'win');
        recordMajorResult(team1Major, 'loss');
        io.emit('gameOver', { result: 'win', winner: 'team2' });
      }

      io.emit('statsUpdated', majorStats);
    }
  });

  socket.on('resetGame', () => {
    scores.team1 = 0;
    scores.team2 = 0;
    finished.team1 = false;
    finished.team2 = false;
    players.team1 = { name: '', major: '' };
    players.team2 = { name: '', major: '' };
    console.log('تم تصفير المسابقة');
    io.emit('updateScores', scores);
    io.emit('playersUpdated', players);
    io.emit('restartQuestions');
  });

  socket.on('requestStats', () => {
    socket.emit('statsUpdated', majorStats);
  });
});


server.listen(PORT, () => {
  console.log(`السيرفر شغال على المنفذ ${PORT}`);
});