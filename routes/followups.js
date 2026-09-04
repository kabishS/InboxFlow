const express = require('express');
const router = express.Router();
const db = require('../services/supabaseService');
const gmailService = require('../services/gmailService');
const groqService = require('../services/groqService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

// GET /api/followups
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await db.getFollowUps(req.session.user.id);
  if (error) return res.status(500).json({ error: error.message });
  
  const now = new Date();
  const processed = data.map(f => {
    let days_remaining = null;
    let is_overdue = false;
    if (f.due_date) {
      days_remaining = Math.ceil((new Date(f.due_date) - now) / (1000 * 60 * 60 * 24));
      is_overdue = days_remaining < 0;
    }
    return { ...f, days_remaining, is_overdue };
  });
  
  res.json({ followups: processed });
});

// POST /api/followups/sync — Detect follow-ups from sent emails
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const threads = await gmailService.getSentThreads(req.session.tokens);
    const followups = [];

    for (const thread of threads) {
      try {
        const analysis = await groqService.detectFollowUp({
          messages: [{ from: thread.from, date: thread.date, body: thread.snippet }]
        });

        if (analysis.needs_followup) {
          const followup = {
            user_id: req.session.user.id,
            thread_id: thread.id,
            subject: thread.subject,
            to_email: thread.to,
            last_message_date: thread.date,
            urgency: analysis.urgency,
            suggested_action: analysis.suggested_action,
            days_pending: analysis.days_pending,
            dismissed: false,
            created_at: new Date().toISOString()
          };
          followups.push(followup);
          await db.upsertFollowUp(followup);
        }
      } catch (e) { /* skip */ }
    }

    res.json({ followups, synced: followups.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/followups/:id/dismiss
router.put('/:id/dismiss', requireAuth, async (req, res) => {
  const { error } = await db.dismissFollowUp(req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/followups/generate-reply — Generate follow-up reply
router.post('/generate-reply', requireAuth, async (req, res) => {
  try {
    const { threadId, tone = 'Professional' } = req.body;
    const thread = await gmailService.getThread(req.session.tokens, threadId);
    const draft = await groqService.generateReply(thread, tone);
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/followups/schedule — Creates a scheduled follow-up
router.post('/schedule', requireAuth, async (req, res) => {
  try {
    const { thread_id, message_id, subject, to_email, followup_days } = req.body;
    const due_date = new Date(Date.now() + followup_days * 24 * 60 * 60 * 1000).toISOString();
    const sent_at = new Date().toISOString();
    
    const followup = {
      user_id: req.session.user.id,
      thread_id,
      message_id,
      subject,
      to_email,
      followup_days,
      due_date,
      sent_at
    };
    
    const { data, error } = await db.createScheduledFollowUp(followup);
    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ success: true, followup: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/followups/check-reply — Checks if a reply was received
router.post('/check-reply', requireAuth, async (req, res) => {
  try {
    const { thread_id, followup_id } = req.body;
    const thread = await gmailService.getThread(req.session.tokens, thread_id);
    const userEmail = req.session.user.email;
    
    const { data } = await db.getFollowUps(req.session.user.id);
    const followup = data.find(f => f.id === followup_id);
    if (!followup) return res.status(404).json({ error: 'Follow-up not found' });
    
    const sentTime = new Date(followup.sent_at).getTime();
    let replied = false;
    
    if (thread && thread.messages) {
      for (const msg of thread.messages) {
        const msgTime = new Date(msg.date).getTime();
        const fromHeader = msg.headers.find(h => h.name.toLowerCase() === 'from');
        const from = fromHeader ? fromHeader.value : '';
        
        if (msgTime > sentTime && !from.includes(userEmail)) {
          replied = true;
          break;
        }
      }
    }
    
    if (replied) {
      await db.resolveFollowUp(followup_id);
      return res.json({ replied: true });
    }
    
    res.json({ replied: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

