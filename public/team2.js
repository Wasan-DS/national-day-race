const socket = io();
socket.emit('identify', 'team2');

const startButton = document.getElementById('start-btn');
startButton.addEventListener('click', () => {
  const nameInput = document.getElementById('player-name');
  const majorInput = document.getElementById('player-major');

  const name = nameInput.value.trim();
  const major = majorInput.value.trim();

  if (name === '' || major === '') {
    alert('لازم تكتبين اسمك وتخصصك قبل ما تبدين');
    return;
  }

  socket.emit('registerPlayer', { team: 'team2', name: name, major: major });

  document.getElementById('team-title').textContent = name;

  document.getElementById('registration-box').style.display = 'none';
  document.getElementById('quiz-box').style.display = 'block';
});

socket.on('newChallenge', (data) => {
  document.querySelector('.question-number').textContent = `تحدي ${data.index + 1} من ${data.total}`;
  document.getElementById('question-text').textContent = data.prompt;
  document.getElementById('feedback').textContent = 'انتظري قرار الحكم...';
  document.getElementById('feedback').style.color = '#C9A227';
});

socket.on('teamFinished', () => {
  document.getElementById('question-text').textContent = 'خلصتِ كل التحديات! 🎉';
  document.getElementById('feedback').textContent = 'بانتظار نتيجة الفريق الثاني...';
  document.getElementById('feedback').style.color = '#C9A227';
});

socket.on('restartQuestions', () => {
  document.getElementById('team-title').textContent = 'فريق النخلة';
  document.getElementById('registration-box').style.display = 'block';
  document.getElementById('quiz-box').style.display = 'none';
  document.getElementById('player-name').value = '';
  document.getElementById('player-major').value = '';
  document.getElementById('feedback').textContent = '';
});