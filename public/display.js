// نتصل بالسيرفر
const socket = io();

// سياق صوتي نستخدمه لأصوات الفوز والتعادل
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// نحدد أقصى نقاط عشان نعرف "خط النهاية" (كم سؤال بالمجموع = 5 أسئلة)
const maxScore = 5;

// نستمع لتحديثات النقاط الجاية من السيرفر
socket.on('updateScores', (scores) => {
  console.log('تحديث جديد للنقاط:', scores);

  updateTeamDisplay('team1', scores.team1);
  updateTeamDisplay('team2', scores.team2);
});

// دالة تحدث موقع الشخصية ورقم النقاط لفريق معين
function updateTeamDisplay(teamId, score) {
  document.getElementById(`${teamId}-score`).textContent = `${score} نقطة`;

  const progressPercent = (score / maxScore) * 100;

  const leftPosition = 85 - (progressPercent * 0.8);
  const avatar = document.getElementById(`${teamId}-avatar`);
  avatar.style.left = `${leftPosition}%`;
  avatar.style.right = 'auto';
}

// نستمع لنتيجة نهاية اللعبة (فوز أو تعادل) من السيرفر
socket.on('gameOver', (data) => {
  if (data.result === 'tie') {
    showTie();
  } else if (data.result === 'win') {
    showWinner(data.winner);
  }
});

// دالة تعرض شاشة الفوز
function showWinner(teamId) {
  const overlay = document.getElementById('winner-overlay');
  const winnerText = document.getElementById('winner-text');
  const winnerEmoji = document.getElementById('winner-emoji');

  if (teamId === 'team1') {
    winnerText.textContent = 'فريق الصقر فاز! 🦅';
    winnerEmoji.textContent = '🏆';
  } else {
    winnerText.textContent = 'فريق النخلة فاز! 🌴';
    winnerEmoji.textContent = '🏆';
  }

  overlay.classList.add('show');
  launchConfetti();
  playWinSound();

  // تختفي شاشة الفوز تلقائياً بعد 4 ثواني
  setTimeout(() => {
    overlay.classList.remove('show');
  }, 4000);
}

// دالة تعرض شاشة التعادل
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


// دالة تسوي تأثير الكونفيتي المتساقط
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

// زر إعادة التصفير
const resetButton = document.getElementById('reset-btn');
resetButton.addEventListener('click', () => {
  socket.emit('resetGame');
});

// نستمع لرسالة "إعادة تشغيل" من السيرفر ونخفي شاشة الفوز
socket.on('restartQuestions', () => {
  document.getElementById('winner-overlay').classList.remove('show');
});

// دالة تشغل صوت الفوز (نغمات متصاعدة احتفالية)
function playWinSound() {
  const notes = [523, 659, 784, 1047]; // نغمات دو-مي-صول-دو (لحن بسيط احتفالي)

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

// دالة تشغل صوت التعادل (نغمة محايدة مكررة مرتين)
function playTieSound() {
  const notes = [440, 440]; // نفس النغمة مرتين، يعطي إحساس "تعادل/تكرار"

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