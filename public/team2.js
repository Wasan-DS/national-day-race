const socket = io();


const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let currentQuestionIndex = 0;
let hasAnswered = false;

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

  showQuestion();
});

function showQuestion() {
  const question = questions[currentQuestionIndex];
  document.getElementById('question-text').textContent = question.text;
  document.querySelector('.question-number').textContent = `السؤال ${currentQuestionIndex + 1}`;

  const optionButtons = document.querySelectorAll('#quiz-box .option-btn');
  optionButtons.forEach((button, index) => {
    button.textContent = question.options[index];
    button.disabled = false;
    button.style.opacity = '1';
  });

  hasAnswered = false;
}

const optionButtons = document.querySelectorAll('#quiz-box .option-btn');
optionButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    checkAnswer(index);
  });
});

function checkAnswer(selectedIndex) {
  
  if (hasAnswered) return;
  hasAnswered = true;

  const optionButtons = document.querySelectorAll('#quiz-box .option-btn');
  optionButtons.forEach((button) => {
    button.disabled = true;
    button.style.opacity = '0.5';
  });

  const question = questions[currentQuestionIndex];
  const feedback = document.getElementById('feedback');

  if (selectedIndex === question.correctIndex) {
    feedback.textContent = '✅ إجابة صحيحة!';
    feedback.style.color = '#4ADE80';
    playSound('correct');
    socket.emit('correctAnswer', 'team2');
  } else {
    feedback.textContent = '❌ إجابة خاطئة';
    feedback.style.color = '#F87171';
    playSound('wrong');
  }

  setTimeout(() => {
    goToNextQuestion();
  }, 2000);
}

function goToNextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    document.getElementById('feedback').textContent = '';
    showQuestion();
  } else {
    document.getElementById('question-text').textContent = 'خلصت الأسئلة! 🎉';
    document.getElementById('options-container').style.display = 'none';
    socket.emit('quizFinished', 'team2');
  }
}

function playSound(type) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (type === 'correct') {
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1108, audioContext.currentTime + 0.1);
  } else {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
  }

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

socket.on('restartQuestions', () => {
  currentQuestionIndex = 0;
  hasAnswered = false;
  document.getElementById('feedback').textContent = '';
  document.getElementById('options-container').style.display = 'flex';
  document.getElementById('team-title').textContent = 'فريق النخلة';

  document.getElementById('registration-box').style.display = 'block';
  document.getElementById('quiz-box').style.display = 'none';
  document.getElementById('player-name').value = '';
  document.getElementById('player-major').value = '';

  showQuestion();
});