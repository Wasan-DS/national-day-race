var socket = io();
socket.emit('identify', 'display');

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

// نحدد أقصى نقاط عشان نعرف "خط النهاية" (8 تحديات بالمجموع)
var maxScore = 8;

socket.on('updateScores', function (scores) {
  console.log('تحديث جديد للنقاط:', scores);
  updateTeamDisplay('team1', scores.team1);
  updateTeamDisplay('team2', scores.team2);
});

socket.on('playersUpdated', function (players) {
  updatePlayerName('team1', players.team1);
  updatePlayerName('team2', players.team2);
});

function updatePlayerName(teamId, player) {
  var nameElement = document.querySelector('#' + teamId + '-name');
  if (!nameElement) return;

  if (player && player.name) {
    nameElement.textContent = player.name + ' (' + player.major + ')';
  } else {
    nameElement.textContent = teamId === 'team1' ? 'فريق الصقر' : 'فريق النخلة';
  }
}

function updateTeamDisplay(teamId, score) {
  document.getElementById(teamId + '-score').textContent = score + ' نقطة';

  var progressPercent = (score / maxScore) * 100;

  var leftPosition = 85 - (progressPercent * 0.8);
  var avatar = document.getElementById(teamId + '-avatar');
  avatar.style.left = leftPosition + '%';
  avatar.style.right = 'auto';
}

socket.on('gameOver', function (data) {
  if (data.result === 'tie') {
    showTie();
  } else if (data.result === 'win') {
    showWinner(data.winner);
  }
});

function showWinner(teamId) {
  var overlay = document.getElementById('winner-overlay');
  var winnerText = document.getElementById('winner-text');
  var winnerEmoji = document.getElementById('winner-emoji');

  var nameElement = document.querySelector('#' + teamId + '-name');
  var displayName = nameElement ? nameElement.textContent : (teamId === 'team1' ? 'فريق الصقر' : 'فريق النخلة');

  winnerText.textContent = displayName + ' فاز! 🏆';
  winnerEmoji.textContent = '🏆';

  overlay.classList.add('show');
  launchConfetti();
  playWinSound();

  setTimeout(function () {
    overlay.classList.remove('show');
  }, 4000);
}

function showTie() {
  var overlay = document.getElementById('winner-overlay');
  var winnerText = document.getElementById('winner-text');
  var winnerEmoji = document.getElementById('winner-emoji');

  winnerText.textContent = 'تعادل! 🤝';
  winnerEmoji.textContent = '⚖️';

  overlay.classList.add('show');
  playTieSound();

  setTimeout(function () {
    overlay.classList.remove('show');
  }, 4000);
}

function launchConfetti() {
  var colors = ['#C9A227', '#1F5C46', '#F6F1E4', '#4ADE80'];

  for (var i = 0; i < 60; i++) {
    var confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = (Math.random() * 100) + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';

    document.body.appendChild(confetti);

    (function (el) {
      setTimeout(function () {
        el.remove();
      }, 4000);
    })(confetti);
  }
}

var resetButton = document.getElementById('reset-btn');
resetButton.addEventListener('click', function () {
  socket.emit('resetGame');
});

socket.on('restartQuestions', function () {
  document.getElementById('winner-overlay').classList.remove('show');
  updatePlayerName('team1', null);
  updatePlayerName('team2', null);
});

function playWinSound() {
  var notes = [523, 659, 784, 1047];

  notes.forEach(function (freq, i) {
    var oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);

    oscillator.start(audioContext.currentTime + i * 0.15);
    oscillator.stop(audioContext.currentTime + i * 0.15 + 0.3);
  });
}

function playTieSound() {
  var notes = [440, 440];

  notes.forEach(function (freq, i) {
    var oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.25);
    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + i * 0.25);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.25 + 0.2);

    oscillator.start(audioContext.currentTime + i * 0.25);
    oscillator.stop(audioContext.currentTime + i * 0.25 + 0.2);
  });
}