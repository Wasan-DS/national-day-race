var socket = io();
socket.emit('identify', 'judge');

// نستقبل تحديث لحالة أي فريق (اسمه، تحديه الحالي، الإجابة المرجعية)
socket.on('judgeChallengeUpdate', function (data) {
  renderTeamPanel(data);
});

function renderTeamPanel(data) {
  var prefix = data.team; // 'team1' أو 'team2'

  var nameEl = document.getElementById(prefix + '-player-name');
  var progressEl = document.getElementById(prefix + '-progress');
  var typeEl = document.getElementById(prefix + '-type');
  var promptEl = document.getElementById(prefix + '-prompt');
  var answerEl = document.getElementById(prefix + '-answer');
  var statusEl = document.getElementById(prefix + '-status');
  var buttonsEl = document.getElementById(prefix + '-buttons');

  if (data.player && data.player.name) {
    nameEl.textContent = data.player.name + ' (' + data.player.major + ')';
  } else {
    nameEl.textContent = 'بانتظار التسجيل...';
  }

  progressEl.textContent = 'تحدي ' + (data.index + 1) + ' من ' + data.total;

  if (data.finished) {
    typeEl.textContent = '';
    promptEl.textContent = '';
    answerEl.textContent = '';
    statusEl.textContent = 'خلصت كل التحديات ✅';
    buttonsEl.style.display = 'none';
    return;
  }

  if (data.challenge) {
    typeEl.textContent = data.challenge.type;
    promptEl.textContent = data.challenge.prompt;
    answerEl.textContent = 'المرجع: ' + data.challenge.answer;
    statusEl.textContent = '';
    buttonsEl.style.display = 'flex';
  }
}

// أزرار النجاح/الفشل لكل فريق
document.querySelectorAll('.judge-btn').forEach(function (button) {
  button.addEventListener('click', function () {
    var team = button.dataset.team;
    var result = button.dataset.result;
    socket.emit('judgeDecision', { team: team, result: result });
  });
});