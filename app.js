const TOTAL_QUESTIONS = 10;
const TIME_PER_Q      = 20;
const RING_CIRCUMFERENCE = 125.66;

let questions   = [];
let currentIdx  = 0;
let score       = 0;
let answered    = false;
let timerID     = null;
let timeLeft    = TIME_PER_Q;
let results     = [];

const landingScreen  = document.getElementById('landingScreen');
const quizScreen     = document.getElementById('quizScreen');
const resultsScreen  = document.getElementById('resultsScreen');

const startBtn       = document.getElementById('startBtn');
const nextBtn        = document.getElementById('nextBtn');
const retryBtn       = document.getElementById('retryBtn');
const downloadBtn    = document.getElementById('downloadBtn');
const themeToggle    = document.getElementById('themeToggle');
const themeIcon      = document.getElementById('themeIcon');

const qCounter       = document.getElementById('qCounter');
const scoreBadge     = document.getElementById('scoreBadge');
const timerNum       = document.getElementById('timerNum');
const ringFill       = document.getElementById('ringFill');
const segBar         = document.getElementById('segBar');

const qCategory      = document.getElementById('qCategory');
const qText          = document.getElementById('qText');
const optionsGrid    = document.getElementById('optionsGrid');
const feedbackMsg    = document.getElementById('feedbackMsg');
const feedbackIcon   = document.getElementById('feedbackIcon');
const feedbackText   = document.getElementById('feedbackText');

const trophyIcon     = document.getElementById('trophyIcon');
const resultsTitle   = document.getElementById('resultsTitle');
const resultsScore   = document.getElementById('resultsScore');
const finalScore     = document.getElementById('finalScore');
const resultsGrade   = document.getElementById('resultsGrade');
const resultsBreakdown = document.getElementById('resultsBreakdown');

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeIcon.textContent = dark ? '☀️' : '🌙';
}

let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(isDark);

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  applyTheme(isDark);
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function switchScreen(hide1, hide2, show1) {
  hide(hide1); hide(hide2); show(show1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildSegBar() {
  segBar.innerHTML = '';
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    const seg = document.createElement('div');
    seg.classList.add('seg');
    seg.id = `seg-${i}`;
    seg.style.background = `var(--seg-${i + 1})`;
    seg.style.opacity = '.3';
    segBar.appendChild(seg);
  }
}

function updateSeg(idx, state) {
  const seg = document.getElementById(`seg-${idx}`);
  if (!seg) return;
  seg.style.opacity = '1';
  seg.style.background = state === 'correct'
    ? 'var(--success)'
    : state === 'wrong'
      ? 'var(--danger)'
      : `var(--seg-${idx + 1})`;
  seg.style.transform = state === 'active' ? 'scaleY(1.4)' : '';
}

function startTimer() {
  timeLeft = TIME_PER_Q;
  updateTimerUI();
  timerID = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) {
      clearInterval(timerID);
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerID);
}

function updateTimerUI() {
  timerNum.textContent = timeLeft;
  const fraction = timeLeft / TIME_PER_Q;
  const offset   = RING_CIRCUMFERENCE * (1 - fraction);
  ringFill.style.strokeDashoffset = offset;
  let stroke;
  if (fraction > 0.6)      stroke = 'var(--success)';
  else if (fraction > 0.3) stroke = 'var(--accent)';
  else                     stroke = 'var(--danger)';
  ringFill.style.stroke = stroke;
  timerNum.style.color  = stroke;
}

function initQuiz() {
  questions  = shuffle(QUESTION_BANK).slice(0, TOTAL_QUESTIONS);
  currentIdx = 0;
  score      = 0;
  results    = [];
  buildSegBar();
  loadQuestion();
}

function loadQuestion() {
  answered = false;
  hide(feedbackMsg);
  hide(nextBtn);
  feedbackMsg.className = 'feedback-msg hidden';

  const q = questions[currentIdx];

  qCounter.textContent   = `Question ${currentIdx + 1} / ${TOTAL_QUESTIONS}`;
  scoreBadge.textContent = `Score: ${score}`;
  qCategory.textContent  = q.category;
  qText.textContent      = q.question;

  updateSeg(currentIdx, 'active');

  const letters = ['A', 'B', 'C', 'D'];
  optionsGrid.innerHTML = '';

  const indices = shuffle([0, 1, 2, 3]);

  indices.forEach((origIdx, displayIdx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.orig = origIdx;
    btn.innerHTML = `
      <span class="opt-letter">${letters[displayIdx]}</span>
      <span>${q.options[origIdx]}</span>`;
    btn.addEventListener('click', () => selectOption(btn, origIdx, q.answer));
    optionsGrid.appendChild(btn);
  });

  startTimer();
}

function selectOption(btn, chosen, correct) {
  if (answered) return;
  answered = true;
  stopTimer();

  const allBtns = optionsGrid.querySelectorAll('.option-btn');
  allBtns.forEach(b => b.disabled = true);

  const wasCorrect = chosen === correct;

  allBtns.forEach(b => {
    const orig = parseInt(b.dataset.orig);
    if (orig === correct) b.classList.add('correct');
    else if (orig === chosen && !wasCorrect) b.classList.add('wrong');
  });

  updateSeg(currentIdx, wasCorrect ? 'correct' : 'wrong');

  if (wasCorrect) score++;
  scoreBadge.textContent = `Score: ${score}`;

  showFeedback(wasCorrect ? 'correct' : 'wrong', questions[currentIdx].options[correct]);

  results.push({
    question: questions[currentIdx].question,
    chosen:   questions[currentIdx].options[chosen] ?? '—',
    correct:  questions[currentIdx].options[correct],
    wasCorrect
  });

  show(nextBtn);
  nextBtn.textContent = currentIdx < TOTAL_QUESTIONS - 1 ? 'Next →' : 'See Results →';
}

function handleTimeout() {
  if (answered) return;
  answered = true;

  const allBtns = optionsGrid.querySelectorAll('.option-btn');
  allBtns.forEach(b => b.disabled = true);

  const correct = questions[currentIdx].answer;
  allBtns.forEach(b => {
    if (parseInt(b.dataset.orig) === correct) b.classList.add('correct');
  });

  updateSeg(currentIdx, 'wrong');

  showFeedback('timeout', questions[currentIdx].options[correct]);

  results.push({
    question: questions[currentIdx].question,
    chosen:   'No answer (time up)',
    correct:  questions[currentIdx].options[correct],
    wasCorrect: false
  });

  show(nextBtn);
  nextBtn.textContent = currentIdx < TOTAL_QUESTIONS - 1 ? 'Next →' : 'See Results →';
}

function showFeedback(type, correctAnswer) {
  feedbackMsg.className = 'feedback-msg';
  if (type === 'correct') {
    feedbackMsg.classList.add('correct-fb');
    feedbackIcon.textContent = '✅';
    feedbackText.textContent = 'Correct! Well done.';
  } else if (type === 'wrong') {
    feedbackMsg.classList.add('wrong-fb');
    feedbackIcon.textContent = '❌';
    feedbackText.textContent = `Wrong! The correct answer was: "${correctAnswer}"`;
  } else {
    feedbackMsg.classList.add('timeout-fb');
    feedbackIcon.textContent = '⏰';
    feedbackText.textContent = `Time's up! The correct answer was: "${correctAnswer}"`;
  }
  show(feedbackMsg);
}

nextBtn.addEventListener('click', () => {
  currentIdx++;
  if (currentIdx < TOTAL_QUESTIONS) {
    loadQuestion();
  } else {
    showResults();
  }
});

function showResults() {
  switchScreen(quizScreen, landingScreen, resultsScreen);

  finalScore.textContent = score;
  resultsScore.innerHTML = `You scored <strong id="finalScore">${score}</strong> out of <strong>${TOTAL_QUESTIONS}</strong>`;

  const pct = (score / TOTAL_QUESTIONS) * 100;
  let title, emoji, gradeText, gradeColor;

  if (pct === 100)    { title = 'Perfect Score!';   emoji = '🏆'; gradeText = 'A+'; gradeColor = '#2dcca7'; }
  else if (pct >= 80) { title = 'Excellent Work!';  emoji = '🌟'; gradeText = 'A';  gradeColor = '#5c35d4'; }
  else if (pct >= 60) { title = 'Good Job!';        emoji = '😊'; gradeText = 'B';  gradeColor = '#ffb627'; }
  else if (pct >= 40) { title = 'Keep Practicing!'; emoji = '📚'; gradeText = 'C';  gradeColor = '#ff7043'; }
  else                { title = 'Try Again!';       emoji = '💪'; gradeText = 'D';  gradeColor = '#ff5c5c'; }

  trophyIcon.textContent     = emoji;
  resultsTitle.textContent   = title;
  resultsGrade.textContent   = gradeText;
  resultsGrade.style.cssText = `background: ${gradeColor}22; color: ${gradeColor}; border: 2px solid ${gradeColor};`;

  resultsBreakdown.innerHTML = '';
  results.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = `breakdown-item ${r.wasCorrect ? 'correct-item' : 'wrong-item'}`;
    div.innerHTML = `
      <div class="bi-q">${i + 1}. ${r.question}</div>
      <div class="bi-your">Your answer: ${r.chosen}</div>
      ${!r.wasCorrect ? `<div class="bi-ans">✔ Correct: ${r.correct}</div>` : ''}`;
    resultsBreakdown.appendChild(div);
  });
}

retryBtn.addEventListener('click', () => {
  switchScreen(resultsScreen, quizScreen, quizScreen);
  hide(quizScreen);
  show(landingScreen);
});

startBtn.addEventListener('click', () => {
  switchScreen(landingScreen, resultsScreen, quizScreen);
  initQuiz();
});

downloadBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageW  = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  doc.setFillColor(92, 53, 212);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('QuizArena — Results Report', margin, 18);

  y = 36;
  doc.setTextColor(30, 20, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Quiz: History & General Knowledge', margin, y);
  y += 7;
  doc.text(`Date: ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Final Score: ${score} / ${TOTAL_QUESTIONS}  (${Math.round((score / TOTAL_QUESTIONS) * 100)}%)`, margin, y);

  y += 10;
  doc.setDrawColor(92, 53, 212);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const lineH  = 5.5;
  const indent = margin + 6;
  const textW  = pageW - indent - margin;

  results.forEach((r, i) => {
    const qLines     = doc.splitTextToSize(r.question, textW);
    const yourLines  = doc.splitTextToSize(`Your answer:    ${r.chosen}`, textW);
    const corrLines  = !r.wasCorrect
      ? doc.splitTextToSize(`Correct answer: ${r.correct}`, textW)
      : [];
    const blockH = lineH
      + qLines.length    * lineH
      + yourLines.length * lineH
      + corrLines.length * lineH
      + 10;

    if (y + blockH > 275) { doc.addPage(); y = 20; }

    const isCorrect  = r.wasCorrect;
    const badgeColor = isCorrect ? [45, 204, 167] : [255, 92, 92];

    const badgeW    = 24;
    const badgeH    = 6;
    const badgeX    = margin;
    const badgeY    = y - 4;

    doc.setFillColor(...badgeColor);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(isCorrect ? '✓ Correct' : '✗  Wrong', badgeX + 2, y + 0.3);

    doc.setTextColor(30, 20, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Q${i + 1}.`, badgeX + badgeW + 4, y + 0.3);
    y += lineH + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 20, 60);
    doc.text(qLines, margin, y);
    y += qLines.length * lineH + 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 80, 160);
    doc.text('Your answer:', margin, y);
    doc.setFont('helvetica', 'normal');
    const yourLabelW   = doc.getTextWidth('Your answer:') + 2;
    const yourValLines = doc.splitTextToSize(r.chosen, textW - yourLabelW);
    doc.setTextColor(60, 40, 120);
    doc.text(yourValLines, margin + yourLabelW, y);
    y += Math.max(yourValLines.length, 1) * lineH;

    if (!r.wasCorrect) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 140, 100);
      doc.text('Correct answer:', margin, y);
      const corrLabelW   = doc.getTextWidth('Correct answer:') + 2;
      doc.setFont('helvetica', 'normal');
      const corrValLines = doc.splitTextToSize(r.correct, textW - corrLabelW);
      doc.setTextColor(20, 110, 80);
      doc.text(corrValLines, margin + corrLabelW, y);
      y += Math.max(corrValLines.length, 1) * lineH;
    }

    y += 4;
    doc.setDrawColor(220, 215, 245);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  });

  doc.setTextColor(150, 130, 200);
  doc.setFontSize(8);
  doc.text('Generated by QuizArena | CSC336 Web Technologies Assignment', margin, 287);

  doc.save('QuizArena_Results.pdf');
});
