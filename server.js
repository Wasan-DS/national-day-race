// نستدعي المكتبات اللي ثبتناها
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { pickChallengesForTeam } = require('./challenges-data');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// كم تحدي بالمجموع لكل فريق (نفس عدد أنواع التحديات = 8)
const TOTAL_CHALLENGES = 8;

let scores = { team1: 0, team2: 0 };
let finished = { team1: false, team2: false };
let players = {
  team1: { name: '', major: '' },
  team2: { name: '', major: '' }
};

// التحديات المختارة لكل فريق (8 تحديات لكل وحد) والمؤشر الحالي
let teamChallenges = { team1: [], team2: [] };
let currentIndex = { team1: 0, team2: 0 };

// إحصائية التخصصات
let majorStats = {};

function recordMajorResult(major, result) {
  if (!major) return;
  if (!majorStats[major]) {
    majorStats[major] = { wins: 0, losses: 0, ties: 0 };
  }
  if (result === 'win') majorStats[major].wins++;
  else if (result === 'loss') majorStats[major].losses++;
  else if (result === 'tie') majorStats[major].ties++;
}

// نحتفظ بمرجع الاتصال (Socket) الخاص بكل دور، عشان نرسل بيانات خاصة له بس
let roleSockets = { team1: null, team2: null, judge: [], display: [] };

// دالة ترسل للحكم بيانات التحدي الحالي لفريق معين (فيها الإجابة المرجعية)
function sendChallengeToJudges(team) {
  const challenge = teamChallenges[team][currentIndex[team]];
  const payload = {
    team: team,
    player: players[team],
    index: currentIndex[team],
    total: TOTAL_CHALLENGES,
    challenge: challenge || null,
    finished: finished[team]
  };
  roleSockets.judge.forEach((s) => s.emit('judgeChallengeUpdate', payload));
}

// دالة ترسل للفريق نص التحدي الحالي بس (بدون الإجابة)
function sendChallengeToTeam(team) {
  const challenge = teamChallenges[team][currentIndex[team]];
  if (!roleSockets[team]) return;
  roleSockets[team].emit('newChallenge', {
    index: currentIndex[team],
    total: TOTAL_CHALLENGES,
    type: challenge ? challenge.type : '',
    level: challenge ? challenge.level : '',
    prompt: challenge ? challenge.prompt : ''
  });
}

function checkGameOver() {
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
}

io.on('connection', (socket) => {
  console.log('جهاز جديد اتصل بالسيرفر');

  // كل صفحة تعرّف عن نفسها فور ما تتصل (فريق 1 / فريق 2 / حكم / عرض)
  socket.on('identify', (role) => {
    if (role === 'judge' || role === 'display') {
      roleSockets[role].push(socket);
    } else {
      roleSockets[role] = socket;
    }

    if (role === 'judge') {
      if (teamChallenges.team1.length > 0) sendChallengeToJudges('team1');
      if (teamChallenges.team2.length > 0) sendChallengeToJudges('team2');
    }
  });

  // لما فريق يسجل اسمه وتخصصه، نختار له 8 تحديات عشوائية ونبدأ
  socket.on('registerPlayer', (data) => {
    players[data.team] = { name: data.name, major: data.major };
    console.log(`${data.team} سجلت باسم ${data.name} (${data.major})`);

    teamChallenges[data.team] = pickChallengesForTeam();
    currentIndex[data.team] = 0;
    finished[data.team] = false;

    io.emit('playersUpdated', players);
    sendChallengeToTeam(data.team);
    sendChallengeToJudges(data.team);
  });

  // قرار الحكم: نجح أو فشل بالتحدي الحالي لفريق معين
  socket.on('judgeDecision', (data) => {
    const team = data.team;

    if (data.result === 'pass') {
      scores[team]++;
      io.emit('updateScores', scores);
    }

    currentIndex[team]++;

    if (currentIndex[team] >= TOTAL_CHALLENGES) {
      finished[team] = true;
      if (roleSockets[team]) {
        roleSockets[team].emit('teamFinished');
      }
      sendChallengeToJudges(team);
      checkGameOver();
    } else {
      sendChallengeToTeam(team);
      sendChallengeToJudges(team);
    }
  });

  socket.on('resetGame', () => {
    scores = { team1: 0, team2: 0 };
    finished = { team1: false, team2: false };
    players = {
      team1: { name: '', major: '' },
      team2: { name: '', major: '' }
    };
    teamChallenges = { team1: [], team2: [] };
    currentIndex = { team1: 0, team2: 0 };

    console.log('تم تصفير المسابقة');
    io.emit('updateScores', scores);
    io.emit('playersUpdated', players);
    io.emit('restartQuestions');
  });

  socket.on('requestStats', () => {
    socket.emit('statsUpdated', majorStats);
  });

  socket.on('disconnect', () => {
    if (roleSockets.team1 === socket) roleSockets.team1 = null;
    if (roleSockets.team2 === socket) roleSockets.team2 = null;
    roleSockets.judge = roleSockets.judge.filter((s) => s !== socket);
    roleSockets.display = roleSockets.display.filter((s) => s !== socket);
  });
});

server.listen(PORT, () => {
  console.log(`السيرفر شغال على المنفذ ${PORT}`);
});