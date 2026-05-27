// ===== StudyFlow App =====
const LS = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// --- State ---
let tasks = LS.get('sf_tasks', []);
let subjects = LS.get('sf_subjects', []);
let notes = LS.get('sf_notes', []);
let chat = LS.get('sf_chat', []);
let focusMins = LS.get('sf_focus_mins', 0);
let pomoSessions = LS.get('sf_pomo_sessions', { date: '', count: 0 });
let theme = LS.get('sf_theme', 'dark');

document.documentElement.setAttribute('data-theme', theme);
document.querySelector('.theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';

// --- Greeting ---
(() => {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = `${g}, ready to learn?`;
})();

// --- Navigation ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.view));
});
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.go)));

function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Theme toggle ---
document.getElementById('themeToggle').addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('.theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
  LS.set('sf_theme', theme);
});

// --- Quotes ---
const QUOTES = [
  ["The secret of getting ahead is getting started.", "Mark Twain"],
  ["Don't watch the clock; do what it does. Keep going.", "Sam Levenson"],
  ["Success is the sum of small efforts repeated day in and day out.", "Robert Collier"],
  ["The expert in anything was once a beginner.", "Helen Hayes"],
  ["Believe you can and you're halfway there.", "Theodore Roosevelt"],
  ["Strive for progress, not perfection.", "Unknown"],
  ["A little progress each day adds up to big results.", "Unknown"],
  ["The future depends on what you do today.", "Mahatma Gandhi"],
  ["Push yourself, because no one else is going to do it for you.", "Unknown"],
  ["Dream big. Work hard. Stay focused.", "Unknown"],
];
function renderQuote() {
  const [t, a] = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('quoteText').textContent = `"${t}"`;
  document.getElementById('quoteAuthor').textContent = `— ${a}`;
}
document.getElementById('newQuote').addEventListener('click', renderQuote);
renderQuote();

// --- Tasks ---
const taskList = document.getElementById('taskList');
const todayTasks = document.getElementById('todayTasks');
document.getElementById('taskForm').addEventListener('submit', e => {
  e.preventDefault();
  const inp = document.getElementById('taskInput');
  const text = inp.value.trim();
  if (!text) return;
  tasks.unshift({ id: Date.now(), text, done: false });
  inp.value = '';
  saveTasks();
});
function saveTasks() {
  LS.set('sf_tasks', tasks);
  renderTasks();
  renderStats();
}
function renderTasks() {
  taskList.innerHTML = tasks.length ? '' : '<li class="empty" style="justify-content:center;color:var(--muted)">No tasks yet — add one above.</li>';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="check ${t.done ? 'done' : ''}" data-id="${t.id}"></div>
      <span class="text ${t.done ? 'done' : ''}">${escapeHtml(t.text)}</span>
      <button class="del" data-del="${t.id}">✕</button>`;
    taskList.appendChild(li);
  });
  taskList.querySelectorAll('.check').forEach(c => c.addEventListener('click', () => {
    const t = tasks.find(x => x.id == c.dataset.id);
    t.done = !t.done; saveTasks();
  }));
  taskList.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    tasks = tasks.filter(x => x.id != b.dataset.del); saveTasks();
  }));

  // Today preview
  todayTasks.innerHTML = '';
  const preview = tasks.slice(0, 4);
  if (!preview.length) {
    todayTasks.innerHTML = '<li class="empty">No tasks yet. Tap ＋ Task to add one.</li>';
  } else {
    preview.forEach(t => {
      const li = document.createElement('li');
      li.innerHTML = `<span style="font-size:18px">${t.done ? '✅' : '⭕'}</span><span style="${t.done ? 'opacity:.5;text-decoration:line-through' : ''}">${escapeHtml(t.text)}</span>`;
      todayTasks.appendChild(li);
    });
  }
}

// --- Attendance ---
const subjectList = document.getElementById('subjectList');
document.getElementById('subjectForm').addEventListener('submit', e => {
  e.preventDefault();
  const inp = document.getElementById('subjectInput');
  const name = inp.value.trim();
  if (!name) return;
  subjects.push({ id: Date.now(), name, present: 0, total: 0 });
  inp.value = '';
  saveSubjects();
});
function saveSubjects() { LS.set('sf_subjects', subjects); renderSubjects(); renderStats(); }
function renderSubjects() {
  subjectList.innerHTML = subjects.length ? '' : '<li style="text-align:center;color:var(--muted)">Add a subject to start tracking.</li>';
  subjects.forEach(s => {
    const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="subject-head">
        <strong>${escapeHtml(s.name)}</strong>
        <span class="subject-stats">${s.present}/${s.total} • ${pct}%</span>
      </div>
      <div class="percent-bar"><div class="percent-fill" style="width:${pct}%"></div></div>
      <div class="subject-actions">
        <button class="present" data-act="p" data-id="${s.id}">Present</button>
        <button class="absent" data-act="a" data-id="${s.id}">Absent</button>
        <button data-act="u" data-id="${s.id}">Undo</button>
        <button data-act="d" data-id="${s.id}">Delete</button>
      </div>`;
    subjectList.appendChild(li);
  });
  subjectList.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
    const s = subjects.find(x => x.id == b.dataset.id);
    if (!s) return;
    if (b.dataset.act === 'p') { s.present++; s.total++; }
    else if (b.dataset.act === 'a') { s.total++; }
    else if (b.dataset.act === 'u') { if (s.total > 0) { s.total--; if (s.present > s.total) s.present = s.total; } }
    else if (b.dataset.act === 'd') { subjects = subjects.filter(x => x.id != s.id); }
    saveSubjects();
  }));
}

// --- Pomodoro ---
let pomoDuration = 25 * 60;
let pomoRemaining = pomoDuration;
let pomoTimer = null;
let pomoRunning = false;
const timerText = document.getElementById('timerText');
const ringFg = document.getElementById('ringFg');
const CIRC = 2 * Math.PI * 90;
ringFg.style.strokeDasharray = CIRC;
// Create gradient
(() => {
  const svg = document.querySelector('.timer-ring svg');
  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(ns, 'defs');
  defs.innerHTML = `<linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#60a5fa"/></linearGradient>`;
  svg.prepend(defs);
})();

function fmt(s) {
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}
function renderTimer() {
  timerText.textContent = fmt(pomoRemaining);
  const pct = pomoRemaining / pomoDuration;
  ringFg.style.strokeDashoffset = CIRC * (1 - pct);
}
document.getElementById('pomoStart').addEventListener('click', e => {
  if (pomoRunning) {
    clearInterval(pomoTimer); pomoRunning = false; e.target.textContent = 'Start';
  } else {
    pomoRunning = true; e.target.textContent = 'Pause';
    pomoTimer = setInterval(() => {
      pomoRemaining--;
      renderTimer();
      if (pomoRemaining <= 0) {
        clearInterval(pomoTimer); pomoRunning = false;
        document.getElementById('pomoStart').textContent = 'Start';
        completeSession();
      }
    }, 1000);
  }
});
document.getElementById('pomoReset').addEventListener('click', () => {
  clearInterval(pomoTimer); pomoRunning = false;
  document.getElementById('pomoStart').textContent = 'Start';
  pomoRemaining = pomoDuration; renderTimer();
});
document.querySelectorAll('[data-mins]').forEach(b => b.addEventListener('click', () => {
  pomoDuration = parseInt(b.dataset.mins) * 60;
  pomoRemaining = pomoDuration;
  clearInterval(pomoTimer); pomoRunning = false;
  document.getElementById('pomoStart').textContent = 'Start';
  renderTimer();
}));
function completeSession() {
  const today = new Date().toDateString();
  if (pomoSessions.date !== today) pomoSessions = { date: today, count: 0 };
  pomoSessions.count++;
  focusMins += Math.round(pomoDuration / 60);
  LS.set('sf_pomo_sessions', pomoSessions);
  LS.set('sf_focus_mins', focusMins);
  renderPomoStats(); renderStats();
  try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play(); } catch {}
  alert('🎉 Session complete! Time for a break.');
  pomoRemaining = pomoDuration; renderTimer();
}
function renderPomoStats() {
  const today = new Date().toDateString();
  const count = pomoSessions.date === today ? pomoSessions.count : 0;
  document.getElementById('pomoSessions').textContent = count;
}
renderTimer(); renderPomoStats();

// --- Chat ---
const chatLog = document.getElementById('chatLog');
function renderChat() {
  chatLog.innerHTML = '';
  if (!chat.length) {
    chat.push({ role: 'ai', text: "Hi! I'm your StudyFlow assistant. Ask me for study tips, explanations, or how to plan your day." });
  }
  chat.forEach(m => {
    const div = document.createElement('div');
    div.className = 'bubble ' + m.role;
    div.textContent = m.text;
    chatLog.appendChild(div);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}
document.getElementById('chatForm').addEventListener('submit', e => {
  e.preventDefault();
  const inp = document.getElementById('chatInput');
  const text = inp.value.trim();
  if (!text) return;
  chat.push({ role: 'user', text });
  inp.value = '';
  renderChat();
  setTimeout(() => {
    chat.push({ role: 'ai', text: aiReply(text) });
    LS.set('sf_chat', chat);
    renderChat();
  }, 500);
});
function aiReply(q) {
  const s = q.toLowerCase();
  if (/pomodoro|focus|concentrat/.test(s)) return "Try the Pomodoro: 25 min focused work, 5 min break. After 4 rounds, take a 15–20 min break. Use the Focus tab to start!";
  if (/exam|test|prepare/.test(s)) return "Break your prep into small daily chunks, use active recall (quiz yourself), and space your reviews over multiple days.";
  if (/math/.test(s)) return "Math gets easier with practice. Try the Feynman technique — explain a concept aloud as if teaching it.";
  if (/note|notes/.test(s)) return "Use the Cornell method: split your page into cues, notes, and a summary. Save them in the Notes tab!";
  if (/motivat|tired|lazy/.test(s)) return "Start with just 5 minutes. Momentum is the secret. You've got this 💪";
  if (/plan|schedule|today/.test(s)) return "Pick 3 main tasks for today, time-block them, and tackle the hardest one first. Add them in the Tasks tab.";
  if (/sleep|rest/.test(s)) return "Aim for 7–9 hours. Sleep consolidates memory — it's part of studying!";
  if (/hi|hello|hey/.test(s)) return "Hey! What are you working on today?";
  return "Great question! Try breaking it into smaller parts, look up examples, and write a short summary in your Notes. Want help making a study plan?";
}
renderChat();

// --- Notes ---
const notesGrid = document.getElementById('notesGrid');
document.getElementById('noteForm').addEventListener('submit', e => {
  e.preventDefault();
  const t = document.getElementById('noteTitle');
  const b = document.getElementById('noteBody');
  notes.unshift({ id: Date.now(), title: t.value.trim(), body: b.value.trim(), date: new Date().toLocaleString() });
  t.value = ''; b.value = '';
  saveNotes();
});
function saveNotes() { LS.set('sf_notes', notes); renderNotes(); renderStats(); }
function renderNotes() {
  notesGrid.innerHTML = notes.length ? '' : '<p style="color:var(--muted);text-align:center;padding:20px">No notes yet.</p>';
  notes.forEach(n => {
    const d = document.createElement('div');
    d.className = 'note-item glass';
    d.innerHTML = `
      <button class="note-del" data-id="${n.id}">✕</button>
      <h3>${escapeHtml(n.title)}</h3>
      <p>${escapeHtml(n.body)}</p>
      <span class="note-date">${n.date}</span>`;
    notesGrid.appendChild(d);
  });
  notesGrid.querySelectorAll('.note-del').forEach(b => b.addEventListener('click', () => {
    notes = notes.filter(x => x.id != b.dataset.id); saveNotes();
  }));
}

// --- Stats ---
function renderStats() {
  const done = tasks.filter(t => t.done).length;
  document.getElementById('statTasks').textContent = `${done}/${tasks.length}`;
  document.getElementById('statFocus').textContent = `${focusMins} min`;
  const totals = subjects.reduce((a, s) => { a.p += s.present; a.t += s.total; return a; }, { p:0, t:0 });
  document.getElementById('statAttendance').textContent = totals.t ? Math.round(totals.p / totals.t * 100) + '%' : '—';
  document.getElementById('statNotes').textContent = notes.length;
}

// --- Utils ---
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// --- Initial render ---
renderTasks(); renderSubjects(); renderNotes(); renderStats();