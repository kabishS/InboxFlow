require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'inboxflow_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const gmailRoutes    = require('./routes/gmail');
const groqRoutes     = require('./routes/groq');
const tasksRoutes    = require('./routes/tasks');
const deadlineRoutes = require('./routes/deadlines');
const followupRoutes = require('./routes/followups');
const analyticsRoutes = require('./routes/analytics');
const spamRoutes      = require('./routes/spam');

app.use('/auth',          authRoutes);
app.use('/api/gmail',     gmailRoutes);
app.use('/api/groq',      groqRoutes);
app.use('/api/tasks',     tasksRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/spam',      spamRoutes);

// ─── Auth Check Middleware helper ─────────────────────────────────────────────
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// ─── Serve HTML Pages ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/inbox', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inbox.html'));
});

app.get('/compose', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'compose.html'));
});

app.get('/compress', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'compose.html'));
});


app.get('/thread', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'thread.html'));
});

app.get('/copilot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'copilot.html'));
});

app.get('/spam', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'spam.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/followups', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'followups.html'));
});

app.get('/tasks', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tasks.html'));
});

app.get('/deadlines', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'deadlines.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/copilot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'copilot.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   📥 InboxFlow Server Running        ║
  ║   http://localhost:${PORT}              ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;

