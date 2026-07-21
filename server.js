require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ijebu_forum_abuja_secret_2026';

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_')),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    const m = db.members.find(m => m.id === req.user.id);
    if (!m || !m.isAdmin) return res.status(403).json({ error: 'Admin only' });
    next();
  });
};
const financeAuth = (req, res, next) => {
  auth(req, res, () => {
    const m = db.members.find(m => m.id === req.user.id);
    if (!m || (!m.isAdmin && !['treasurer','financial-secretary'].includes(m.role))) {
      return res.status(403).json({ error: 'Finance access only' });
    }
    next();
  });
};

// ── HELPER ───────────────────────────────────────────────────────────────────
const safeM = m => { const { password, ...rest } = m; return rest; };
const addNotif = (memberId, title, body) => {
  if (!db.notifications[memberId]) db.notifications[memberId] = [];
  db.notifications[memberId].unshift({ id: uuid(), title, body, unread: true, time: new Date().toLocaleTimeString() });
};

// ── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'Missing credentials' });
  const m = db.members.find(m =>
    m.email === identifier || m.phone === identifier || m.id === identifier
  );
  if (!m) return res.status(401).json({ error: 'Member not found' });
  if (m.status === 'suspended') return res.status(403).json({ error: 'Account suspended. Contact admin.' });
  if (!bcrypt.compareSync(password, m.password)) return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ id: m.id, isAdmin: m.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, member: safeM(m) });
});

app.post('/api/auth/register', upload.single('photo'), (req, res) => {
  const { fn, ln, on, email, phone, addr, town, hAddr, dobDay, dobMonth, dobYear, prof, des, nok, nokP, nokR, method, password } = req.body;
  if (!fn || !ln || !phone) return res.status(400).json({ error: 'Missing required fields' });
  if (db.members.find(m => m.email === email)) return res.status(400).json({ error: 'Email already registered' });
  const id = db.mkId(db.members.length + 1);
  const name = [fn, ln, on].filter(Boolean).join(' ');
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  const newM = {
    id, fn, ln, on, name, email, phone, addr, town, hAddr, dobDay, dobMonth, dobYear, prof, des, nok, nokP, nokR,
    role: 'member', pts: 50, streak: 0, att: [], tdone: 0,
    joined: db.today(), status: 'pending', photo, method: method || 'geo',
    password: bcrypt.hashSync(password || 'member123', 10), isAdmin: false,
  };
  db.members.push(newM);
  // Notify admin
  addNotif('IFA-0001', 'New Registration', name + ' has applied for membership. ID: ' + id);
  res.json({ message: 'Application submitted', id });
});

app.get('/api/auth/me', auth, (req, res) => {
  const m = db.members.find(m => m.id === req.user.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  res.json(safeM(m));
});

// ── MEMBERS ──────────────────────────────────────────────────────────────────
app.get('/api/members', auth, (req, res) => {
  res.json(db.members.map(safeM));
});

app.get('/api/members/:id', auth, (req, res) => {
  const m = db.members.find(m => m.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  res.json(safeM(m));
});

app.put('/api/members/:id', auth, (req, res) => {
  const idx = db.members.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  const caller = db.members.find(m => m.id === req.user.id);
  // Only admin can edit others; members can edit themselves
  if (!caller.isAdmin && req.params.id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const safe = ['fn','ln','on','name','email','phone','addr','town','hAddr','prof','des','nok','nokP','nokR','method','photo'];
  const adminFields = ['role','status','isAdmin'];
  const allowed = caller.isAdmin ? [...safe, ...adminFields] : safe;
  allowed.forEach(k => { if (req.body[k] !== undefined) db.members[idx][k] = req.body[k]; });
  if (req.body.fn || req.body.ln) {
    db.members[idx].name = [db.members[idx].fn, db.members[idx].ln, db.members[idx].on].filter(Boolean).join(' ');
  }
  res.json(safeM(db.members[idx]));
});

app.post('/api/members/:id/photo', auth, upload.single('photo'), (req, res) => {
  const idx = db.members.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  const caller = db.members.find(m => m.id === req.user.id);
  if (!caller.isAdmin && req.params.id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (!req.file) return res.status(400).json({ error: 'No file' });
  db.members[idx].photo = `/uploads/${req.file.filename}`;
  res.json({ photo: db.members[idx].photo });
});

// Admin: register new member directly
app.post('/api/members', adminAuth, upload.single('photo'), (req, res) => {
  const { fn, ln, on, email, phone, addr, town, hAddr, dobDay, dobMonth, dobYear, prof, des, nok, nokP, nokR, method, role } = req.body;
  if (!fn || !ln || !phone) return res.status(400).json({ error: 'Missing required fields' });
  const id = db.mkId(db.members.filter(m => m.status !== 'pending').length + 1);
  const name = [fn, ln, on].filter(Boolean).join(' ');
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  const newM = {
    id, fn, ln, on, name, email, phone, addr, town, hAddr, dobDay, dobMonth, dobYear, prof, des, nok, nokP, nokR,
    role: role || 'member', pts: 50, streak: 0, att: [], tdone: 0,
    joined: db.today(), status: 'active', photo, method: method || 'geo',
    password: bcrypt.hashSync('member123', 10), isAdmin: false,
  };
  db.members.push(newM);
  addNotif(id, 'Welcome to Ijebu Forum Abuja!', 'Your membership has been approved. Member ID: ' + id + '. Default password: member123');
  res.json({ message: 'Member registered', member: safeM(newM) });
});

// Admin: approve/reject pending
app.post('/api/members/:id/approve', adminAuth, (req, res) => {
  const idx = db.members.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.members[idx].status = 'active';
  addNotif(db.members[idx].id, 'Application Approved!', 'Welcome! Your member ID is ' + db.members[idx].id + '. Default password: member123');
  res.json({ message: 'Approved', member: safeM(db.members[idx]) });
});
app.post('/api/members/:id/reject', adminAuth, (req, res) => {
  const idx = db.members.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.members.splice(idx, 1);
  res.json({ message: 'Rejected and removed' });
});
app.post('/api/members/:id/suspend', adminAuth, (req, res) => {
  const idx = db.members.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.members[idx].status = 'suspended';
  res.json({ message: 'Suspended' });
});
app.post('/api/members/:id/activate', adminAuth, (req, res) => {
  const idx = db.members.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.members[idx].status = 'active';
  res.json({ message: 'Activated' });
});
app.delete('/api/members/:id', adminAuth, (req, res) => {
  const idx = db.members.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.members.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
app.post('/api/attendance/mark', auth, (req, res) => {
  const { memberId, status, method, lat, lng } = req.body;
  const caller = db.members.find(m => m.id === req.user.id);
  if (!caller.isAdmin && memberId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const idx = db.members.findIndex(m => m.id === memberId);
  if (idx < 0) return res.status(404).json({ error: 'Member not found' });
  const m = db.members[idx];
  if (m.status === 'suspended') return res.status(403).json({ error: 'Member suspended' });

  // Geo validation
  if (method === 'geo' && lat && lng) {
    const GEO = { lat: 9.0579, lng: 7.4951, radius: 300 };
    const dlat = (parseFloat(lat) - GEO.lat) * 111000;
    const dlng = (parseFloat(lng) - GEO.lng) * 111000;
    const dist = Math.round(Math.sqrt(dlat * dlat + dlng * dlng));
    if (dist > GEO.radius) {
      return res.status(400).json({ error: `Too far from venue (${dist}m away, max ${GEO.radius}m)`, dist });
    }
  }

  const a = [...m.att];
  const last = a[a.length - 1];
  if (last === 'present' || last === 'absent' || last === 'excuse') a[a.length - 1] = status;
  else a.push(status);

  let pts = m.pts; let streak = m.streak;
  if (status === 'present') {
    pts += 10; streak += 1;
    if (streak === 3) { pts += 25; addNotif(memberId, '🔥 Streak Bonus!', '+25 pts for your 3-meeting streak!'); }
  }
  db.members[idx] = { ...m, att: a, pts, streak };
  res.json({ member: safeM(db.members[idx]), pts, streak });
});

app.get('/api/attendance/report', auth, (req, res) => {
  const report = db.members.map(m => ({
    id: m.id, name: m.name, role: m.role, method: m.method,
    last: m.att[m.att.length - 1] || 'none',
    total: m.att.length,
    present: m.att.filter(a => a === 'present').length,
    absent: m.att.filter(a => a === 'absent').length,
    excuse: m.att.filter(a => a === 'excuse').length,
    pct: m.att.length ? Math.round(m.att.filter(a => a === 'present').length / m.att.length * 100) : 0,
  }));
  res.json(report);
});

// ── TASKS ─────────────────────────────────────────────────────────────────────
app.get('/api/tasks', auth, (req, res) => res.json(db.tasks));
app.post('/api/tasks', adminAuth, (req, res) => {
  const { title, desc, assignee, priority, due } = req.body;
  if (!title || !due) return res.status(400).json({ error: 'Missing fields' });
  const task = { id: uuid(), title, desc, assignee, priority: priority || 'medium', due, status: 'pending', by: req.user.id, created: db.today() };
  db.tasks.unshift(task);
  addNotif(assignee, 'New Task Assigned', title);
  res.json(task);
});
app.put('/api/tasks/:id', auth, (req, res) => {
  const idx = db.tasks.findIndex(t => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  const task = db.tasks[idx];
  const caller = db.members.find(m => m.id === req.user.id);
  if (!caller.isAdmin && task.assignee !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  Object.assign(db.tasks[idx], req.body);
  if (req.body.status === 'done') {
    const mIdx = db.members.findIndex(m => m.id === task.assignee);
    if (mIdx >= 0) { db.members[mIdx].pts += 20; db.members[mIdx].tdone += 1; }
  }
  res.json(db.tasks[idx]);
});
app.delete('/api/tasks/:id', adminAuth, (req, res) => {
  const idx = db.tasks.findIndex(t => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.tasks.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ── FINANCE ───────────────────────────────────────────────────────────────────
app.get('/api/finance/transactions', auth, (req, res) => res.json(db.transactions));
app.post('/api/finance/transactions', financeAuth, (req, res) => {
  const { desc, type, amt, cat } = req.body;
  if (!desc || !type || !amt) return res.status(400).json({ error: 'Missing fields' });
  const txn = { id: uuid(), desc, type, amt: parseFloat(amt), cat: cat || 'other', date: db.today(), by: req.user.id };
  db.transactions.unshift(txn);
  res.json(txn);
});
app.post('/api/finance/dues', auth, (req, res) => {
  const m = db.members.find(m => m.id === req.user.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  // Check if already paid this month
  const thisMonth = db.today().slice(0, 7);
  const alreadyPaid = db.transactions.find(t => t.by === req.user.id && t.cat === 'dues' && t.date.startsWith(thisMonth));
  if (alreadyPaid) return res.status(400).json({ error: 'Already paid dues this month' });
  const txn = { id: uuid(), desc: 'Monthly Dues - ' + m.name, type: 'cr', amt: 2000, cat: 'dues', date: db.today(), by: req.user.id };
  db.transactions.unshift(txn);
  const idx = db.members.findIndex(x => x.id === req.user.id);
  db.members[idx].pts += 5;
  res.json({ txn, pts: db.members[idx].pts });
});
app.post('/api/finance/contribute', auth, (req, res) => {
  const { amt, purpose } = req.body;
  if (!amt || !purpose) return res.status(400).json({ error: 'Missing fields' });
  const m = db.members.find(x => x.id === req.user.id);
  const txn = { id: uuid(), desc: 'Contribution - ' + m.name + ': ' + purpose, type: 'cr', amt: parseFloat(amt), cat: 'contribution', date: db.today(), by: req.user.id };
  db.transactions.unshift(txn);
  res.json(txn);
});
app.get('/api/finance/summary', auth, (req, res) => {
  const income = db.transactions.filter(t => t.type === 'cr').reduce((s, t) => s + t.amt, 0);
  const expense = db.transactions.filter(t => t.type === 'db').reduce((s, t) => s + t.amt, 0);
  const thisMonth = db.today().slice(0, 7);
  const paidDues = db.transactions.filter(t => t.cat === 'dues' && t.date.startsWith(thisMonth)).map(t => t.by);
  res.json({ income, expense, balance: income - expense, paidDues });
});

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
app.get('/api/announcements', auth, (req, res) => res.json(db.announcements));
app.post('/api/announcements', adminAuth, (req, res) => {
  const { title, body, priority } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Missing fields' });
  const ann = { id: uuid(), title, body, priority: priority || 'normal', author: db.members.find(m=>m.id===req.user.id).name, date: db.today() };
  db.announcements.unshift(ann);
  res.json(ann);
});
app.delete('/api/announcements/:id', adminAuth, (req, res) => {
  const idx = db.announcements.findIndex(a => a.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.announcements.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ── EVENTS ────────────────────────────────────────────────────────────────────
app.get('/api/events', auth, (req, res) => res.json(db.events));
app.post('/api/events', adminAuth, (req, res) => {
  const { title, date, time, venue, desc } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Missing fields' });
  const evt = { id: uuid(), title, date, time, venue, desc, upcoming: true, rsvps: [] };
  db.events.unshift(evt);
  res.json(evt);
});
app.post('/api/events/:id/rsvp', auth, (req, res) => {
  const idx = db.events.findIndex(e => e.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  if (db.events[idx].rsvps.includes(req.user.id)) return res.status(400).json({ error: 'Already RSVPd' });
  db.events[idx].rsvps.push(req.user.id);
  const mIdx = db.members.findIndex(m => m.id === req.user.id);
  if (mIdx >= 0) db.members[mIdx].pts += 8;
  res.json({ pts: db.members[mIdx].pts });
});
app.delete('/api/events/:id', adminAuth, (req, res) => {
  const idx = db.events.findIndex(e => e.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.events.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ── POLLS/VOTING ──────────────────────────────────────────────────────────────
app.get('/api/polls', auth, (req, res) => res.json(db.polls));
app.post('/api/polls', adminAuth, (req, res) => {
  const { q, type, end } = req.body;
  if (!q) return res.status(400).json({ error: 'Missing question' });
  const opts = type === 'Yes / No' ? [{t:'Yes',v:0},{t:'No',v:0}] : [{t:'Option 1',v:0},{t:'Option 2',v:0},{t:'Option 3',v:0}];
  const poll = { id: uuid(), q, opts, end, voters: [] };
  db.polls.push(poll);
  res.json(poll);
});
app.post('/api/polls/:id/vote', auth, (req, res) => {
  const { optionIndex } = req.body;
  const idx = db.polls.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  if (db.polls[idx].voters.includes(req.user.id)) return res.status(400).json({ error: 'Already voted' });
  db.polls[idx].opts[optionIndex].v += 1;
  db.polls[idx].voters.push(req.user.id);
  const mIdx = db.members.findIndex(m => m.id === req.user.id);
  if (mIdx >= 0) db.members[mIdx].pts += 5;
  res.json({ poll: db.polls[idx], pts: db.members[mIdx].pts });
});
app.delete('/api/polls/:id', adminAuth, (req, res) => {
  const idx = db.polls.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.polls.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ── CHAT ──────────────────────────────────────────────────────────────────────
app.get('/api/chat/:channel', auth, (req, res) => {
  const ch = req.params.channel;
  res.json(db.chats[ch] || []);
});
app.post('/api/chat/:channel', auth, (req, res) => {
  const { txt } = req.body;
  if (!txt || !txt.trim()) return res.status(400).json({ error: 'Empty message' });
  const m = db.members.find(x => x.id === req.user.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  const ch = req.params.channel;
  if (!db.chats[ch]) db.chats[ch] = [];
  const sn = (m.des ? m.des + ' ' : '') + m.name.split(' ')[0];
  const msg = { id: uuid(), sid: m.id, sn, txt: txt.trim(), t: new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}), date: db.today() };
  db.chats[ch].push(msg);
  // Points for chatting
  const mIdx = db.members.findIndex(x => x.id === req.user.id);
  if (mIdx >= 0) db.members[mIdx].pts += 2;
  res.json({ msg, pts: db.members[mIdx].pts });
});

// ── COMPLAINTS ────────────────────────────────────────────────────────────────
app.get('/api/complaints', auth, (req, res) => {
  const caller = db.members.find(m => m.id === req.user.id);
  if (caller.isAdmin) return res.json(db.complaints);
  res.json(db.complaints.filter(c => c.by === caller.name || c.by === caller.id || c.by === 'Anonymous'));
});
app.post('/api/complaints', auth, (req, res) => {
  const { sub, cat, det, anon } = req.body;
  if (!sub || !det) return res.status(400).json({ error: 'Missing fields' });
  const m = db.members.find(x => x.id === req.user.id);
  const c = { id: uuid(), sub, cat: cat || 'General Complaint', det, by: anon ? 'Anonymous' : m.name, date: db.today(), status: 'open' };
  db.complaints.unshift(c);
  addNotif('IFA-0001', 'New Complaint Filed', sub);
  res.json(c);
});
app.put('/api/complaints/:id', adminAuth, (req, res) => {
  const idx = db.complaints.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  Object.assign(db.complaints[idx], req.body);
  res.json(db.complaints[idx]);
});
app.delete('/api/complaints/:id', adminAuth, (req, res) => {
  const idx = db.complaints.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.complaints.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
app.get('/api/notifications', auth, (req, res) => {
  res.json(db.notifications[req.user.id] || []);
});
app.put('/api/notifications/:id/read', auth, (req, res) => {
  const notifs = db.notifications[req.user.id] || [];
  const idx = notifs.findIndex(n => n.id === req.params.id);
  if (idx >= 0) db.notifications[req.user.id][idx].unread = false;
  res.json({ ok: true });
});
app.post('/api/notifications/birthday-ack', auth, (req, res) => {
  const m = db.members.find(x => x.id === req.user.id);
  addNotif('IFA-0001', 'Birthday Acknowledged', m.name + ' has acknowledged their birthday greeting!');
  res.json({ ok: true });
});

// ── BIRTHDAYS ─────────────────────────────────────────────────────────────────
app.get('/api/birthdays/today', auth, (req, res) => {
  const now = new Date();
  const tm = db.MONTHS[now.getMonth()];
  const td = String(now.getDate());
  const bd = db.members.filter(m => m.dobMonth === tm && String(m.dobDay) === td).map(safeM);
  res.json(bd);
});
app.get('/api/birthdays/upcoming', auth, (req, res) => {
  const now = new Date();
  const upcoming = db.members.filter(m => {
    if (!m.dobMonth || !m.dobDay) return false;
    const mi = db.MONTHS.indexOf(m.dobMonth); if (mi < 0) return false;
    const d = new Date(now.getFullYear(), mi, parseInt(m.dobDay));
    const diff = (d - now) / 86400000;
    return diff > 0 && diff <= 30;
  }).sort((a, b) => {
    const ai = new Date(new Date().getFullYear(), db.MONTHS.indexOf(a.dobMonth), parseInt(a.dobDay));
    const bi = new Date(new Date().getFullYear(), db.MONTHS.indexOf(b.dobMonth), parseInt(b.dobDay));
    return ai - bi;
  }).map(safeM);
  res.json(upcoming);
});

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
app.get('/api/leaderboard', auth, (req, res) => {
  const lb = db.members
    .filter(m => m.status === 'active')
    .sort((a, b) => b.pts - a.pts)
    .map((m, i) => ({ rank: i + 1, id: m.id, name: m.name, des: m.des, role: m.role, pts: m.pts, streak: m.streak, photo: m.photo }));
  res.json(lb);
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), members: db.members.length }));

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Ijebu Forum API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
