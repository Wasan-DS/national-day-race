
const socket = io();


const audioContext = new (window.AudioContext || window.webkitAudioContext)();


const maxScore = 5;


socket.on('updateScores', (scores) => {
  console.log('تحديث جديد للنقاط:', scores);
 
  updateTeamDisplay('team1', scores.team1);
  updateTeamDisplay('team2', scores.team2);
});

socket.on('playersUpdated', (players) => {
  updatePlayerName('team1', players.team1);
  updatePlayerName('team2', players.team2);
});

function updatePlayerName(teamId, player) {
  const nameElement = document.querySelector(`#${teamId}-name`);
  if (!nameElement) return;

  if (player && player.name) {
    nameElement.textContent = `${player.name} (${player.major})`;
  } else {
    nameElement.textContent = teamId === 'team1' ? 'فريق الصقر' : 'فريق النخلة';
  }
}

function updateTeamDisplay(teamId, score) {
  document.getElementById(`${teamId}-score`).textContent = `${score} نقطة`;

  const progressPercent = (score / maxScore) * 100;

  const leftPosition = 85 - (progressPercent * 0.8);
  const avatar = document.getElementById(`${teamId}-avatar`);
  avatar.style.left = `${leftPosition}%`;
  avatar.style.right = 'auto';
}


socket.on('gameOver', (data) => {
  if (data.result === 'tie') {
    showTie();
  } else if (data.result === 'win') {
    showWinner(data.winner);
  }
});


function showWinner(teamId) {
  const overlay = document.getElementById('winner-overlay');
  const winnerText = document.getElementById('winner-text');
  const winnerEmoji = document.getElementById('winner-emoji');

  const nameElement = document.querySelector(`#${teamId}-name`);
  const displayName = nameElement ? nameElement.textContent : (teamId === 'team1' ? 'فريق الصقر' : 'فريق النخلة');

  winnerText.textContent = `${displayName} فاز! 🏆`;
  winnerEmoji.textContent = '🏆';

  overlay.classList.add('show');
  launchConfetti();
  playWinSound();


  setTimeout(() => {
    overlay.classList.remove('show');
  }, 4000);
}


function showTie() {
  const overlay = document.getElementById('winner-overlay');
  const winnerText = document.getElementById('winner-text');
  const winnerEmoji = document.getElementById('winner-emoji');

  winnerText.textContent = 'تعادل! 🤝';
  winnerEmoji.textContent = '⚖️';

  overlay.classList.add('show');
  playTieSound();


  setTimeout(() => {
    overlay.classList.remove('show');
  }, 4000);
}


function launchConfetti() {
  const colors = ['#C9A227', '#1F5C46', '#F6F1E4', '#4ADE80'];

  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }
}


const resetButton = document.getElementById('reset-btn');
resetButton.addEventListener('click', () => {
  socket.emit('resetGame');
});


socket.on('restartQuestions', () => {
  document.getElementById('winner-overlay').classList.remove('show');
  updatePlayerName('team1', null);
  updatePlayerName('team2', null);
});


function playWinSound() {
  const notes = [523, 659, 784, 1047];

  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

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
  const notes = [440, 440];

  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

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