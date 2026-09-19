// نتصل بالسيرفر
const socket = io();

// نطلب الإحصائية الحالية فور ما نفتح الصفحة (لو فيه نتائج سابقة)
socket.emit('requestStats');

// نستمع لأي تحديث بالإحصائية (يوصل تلقائياً كل ما تنتهي جولة)
socket.on('statsUpdated', (majorStats) => {
  console.log('تحديث الإحصائية:', majorStats);
  renderChart(majorStats);
});

// دالة ترسم الرسم البياني بالكامل من جديد كل ما توصل بيانات محدثة
function renderChart(majorStats) {
  const container = document.getElementById('chart-container');
  const emptyMessage = document.getElementById('empty-message');

  const majors = Object.keys(majorStats);

  // لو ما فيه أي تخصص مسجل بعد، نبين رسالة "لا توجد نتائج"
  if (majors.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  // نحسب نسبة الفوز لكل تخصص، ونرتبهم من الأعلى نسبة للأقل
  const majorsWithRate = majors.map((major) => {
    const stats = majorStats[major];
    const totalGames = stats.wins + stats.losses + stats.ties;
    const winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;

    return { major, stats, totalGames, winRate };
  });

  majorsWithRate.sort((a, b) => b.winRate - a.winRate);

  // نمسح كل الأعمدة القديمة (إلا رسالة "لا توجد نتائج")
  const oldBars = container.querySelectorAll('.bar-row');
  oldBars.forEach((bar) => bar.remove());

  // نبني عمود جديد لكل تخصص
  majorsWithRate.forEach((item) => {
    const barRow = document.createElement('div');
    barRow.classList.add('bar-row');

    const roundedRate = Math.round(item.winRate);

    barRow.innerHTML = `
      <div class="bar-label">${item.major}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${roundedRate}%;">
          <span class="bar-percent">${roundedRate}%</span>
        </div>
      </div>
      <div class="bar-details">فوز ${item.stats.wins} · خسارة ${item.stats.losses} · تعادل ${item.stats.ties}</div>
    `;

    container.appendChild(barRow);
  });
}