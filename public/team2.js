const socket = io();

// نسوي سياق صوتي واحد بس نستخدمه لكل الأصوات (بدل ما نسوي وحدة جديدة كل مرة)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let currentQuestionIndex = 0;
let hasAnswered = false; // متغير يتتبع هل جاوبنا على السؤال الحالي أو لا

function showQuestion() {
  const question = questions[currentQuestionIndex];
  document.getElementById('question-text').textContent = question.text;
  document.querySelector('.question-number').textContent = `السؤال ${currentQuestionIndex + 1}`;

  const optionButtons = document.querySelectorAll('.option-btn');
  optionButtons.forEach((button, index) => {
    button.textContent = question.options[index];
    button.disabled = false; // نفعل الأزرار من جديد
    button.style.opacity = '1';
  });

  hasAnswered = false; // نصفر متغير "جاوبنا" عشان السؤال الجديد
}

showQuestion();

const optionButtons = document.querySelectorAll('.option-btn');
optionButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    checkAnswer(index);
  });
});

function checkAnswer(selectedIndex) {
  // لو سبق وجاوبنا على هذا السؤال، تجاهل أي ضغطة إضافية
  if (hasAnswered) return;
  hasAnswered = true; // نسجل إننا جاوبنا

  // نعطل كل الأزرار عشان ما يضغطون مرة ثانية
  const optionButtons = document.querySelectorAll('.option-btn');
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
    oscillator.type = 'sawtooth'; // نوع موجة مختلف يعطي صوت أوضح للخطأ
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
  showQuestion();
});