const express = require('express');
const router = express.Router();
const gmailService = require('../services/gmailService');
const groqService = require('../services/groqService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated. Please login with Google.' });
  }
  next();
}

// GET /api/gmail/threads — Get inbox threads with AI priority tagging
router.get('/threads', requireAuth, async (req, res) => {
  try {
    const { maxResults = 20, label = 'INBOX', pageToken } = req.query;
    const { threads, nextPageToken } = await gmailService.getThreads(
      req.session.tokens,
      { maxResults: parseInt(maxResults), labelIds: [label], pageToken }
    );

    // Analyze each thread with Groq for priority/category tagging
    const analyzed = await Promise.allSettled(
      threads.map(async (thread) => {
        try {
          // Quick analysis from snippet only (fast, saves tokens)
          const analysis = await groqService.analyzeThread({
            messages: [{
              from: thread.from,
              date: thread.date,
              body: thread.snippet
            }]
          }, thread.id);
          return { ...thread, ai: analysis };
        } catch (e) {
          return { ...thread, ai: { priority: 'MEDIUM', category: 'WORK', intent: 'Info', sentiment: 'NEUTRAL' } };
        }
      })
    );

    res.json({
      threads: analyzed.map(r => r.status === 'fulfilled' ? r.value : r.reason),
      nextPageToken
    });
  } catch (err) {
    console.error('Gmail threads error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gmail/thread/:id — Get full thread with AI analysis
router.get('/thread/:id', requireAuth, async (req, res) => {
  try {
    const thread = await gmailService.getThread(req.session.tokens, req.params.id);
    const analysis = await groqService.analyzeThread(thread, req.params.id);
    res.json({ thread, analysis });
  } catch (err) {
    console.error('Thread fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gmail/send — Send a reply
router.post('/send', requireAuth, async (req, res) => {
  try {
    const result = await gmailService.sendReply(req.session.tokens, req.body);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gmail/sent — Get sent threads for follow-up analysis
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const threads = await gmailService.getSentThreads(req.session.tokens);
    res.json({ threads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

