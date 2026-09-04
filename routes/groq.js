const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');
const gmailService = require('../services/gmailService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  next();
}

// POST /api/groq/analyze — Analyze a thread
router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.body;
    const thread = await gmailService.getThread(req.session.tokens, threadId);
    const analysis = await groqService.analyzeThread(thread);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groq/reply — Generate a reply draft
router.post('/reply', requireAuth, async (req, res) => {
  try {
    const { threadId, tone = 'Professional' } = req.body;
    const thread = await gmailService.getThread(req.session.tokens, threadId);
    const draft = await groqService.generateReply(thread, tone);
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groq/copilot — Ask the AI Copilot a question
router.post('/copilot', requireAuth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required.' });

    // Get recent inbox for context
    const { threads } = await gmailService.getThreads(req.session.tokens, { maxResults: 15 });
    const answer = await groqService.copilotQuery(question, threads);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groq/compose — Generate new email draft with AI
router.post('/compose', requireAuth, async (req, res) => {
  try {
    const { to, subject, prompt, tone = 'Professional', keyPoints } = req.body;
    const draft = await groqService.composeEmail({ to, subject, prompt, tone, keyPoints });
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groq/compress — Compress email thread / text into high-density digest
router.post('/compress', requireAuth, async (req, res) => {
  try {
    let content = req.body.content;
    const { threadId } = req.body;

    if (!content && threadId) {
      const thread = await gmailService.getThread(req.session.tokens, threadId);
      content = (thread.messages || []).map(m => `From: ${m.from}\nDate: ${m.date}\n\n${m.body}`).join('\n\n---\n\n');
    }

    if (!content) {
      return res.status(400).json({ error: 'Either content or threadId is required for compression.' });
    }

    const digest = await groqService.compressEmail(content);
    res.json({ digest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


