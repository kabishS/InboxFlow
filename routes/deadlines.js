const express = require('express');
const router = express.Router();
const db = require('../services/supabaseService');
const gmailService = require('../services/gmailService');
const groqService = require('../services/groqService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

// GET /api/deadlines — Get saved deadlines from Supabase
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await db.getDeadlines(req.session.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deadlines: data });
});

// POST /api/deadlines — Create a new deadline directly
router.post('/', requireAuth, async (req, res) => {
  const deadline = {
    ...req.body,
    user_id: req.session.user.id,
    status: req.body.status || 'pending',
    created_at: new Date().toISOString()
  };
  const { data, error } = await db.createDeadline(deadline);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deadline: data[0] });
});

// PUT /api/deadlines/:id — Update a deadline (e.g. status completed)
router.put('/:id', requireAuth, async (req, res) => {
  const { data, error } = await db.updateDeadline(req.params.id, req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deadline: data[0] });
});

// DELETE /api/deadlines/:id — Delete a deadline
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await db.deleteDeadline(req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/deadlines/sync — Scan inbox and extract deadlines using Groq
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { threads } = await gmailService.getThreads(req.session.tokens, { maxResults: 15 });
    const deadlines = [];

    for (const thread of threads) {
      try {
        const analysis = await groqService.analyzeThread({
          messages: [{ from: thread.from, date: thread.date, body: thread.snippet }]
        }, thread.id);

        if (analysis.deadline) {
          const deadline = {
            user_id: req.session.user.id,
            thread_id: thread.id,
            title: analysis.tasks[0] || thread.subject,
            source_email: thread.subject,
            from_email: thread.from,
            due_date: analysis.deadline,
            due_label: analysis.deadline_label,
            priority: analysis.priority,
            status: 'pending',
            created_at: new Date().toISOString()
          };
          deadlines.push(deadline);
          await db.upsertDeadline(deadline);
        }
      } catch (e) { /* skip failed */ }
    }

    res.json({ deadlines, synced: deadlines.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/deadlines/report — Generate 1:00 PM Daily Briefing & Summary Report
router.post('/report', requireAuth, async (req, res) => {
  try {
    const { data: deadlines } = await db.getDeadlines(req.session.user.id);
    const { data: tasks } = await db.getTasks(req.session.user.id);

    const deadlineSummary = (deadlines || []).map(d =>
      `- [${d.status === 'completed' ? 'DONE' : 'PENDING'}] ${d.title} (Due: ${d.due_label || d.due_date || 'N/A'}, Priority: ${d.priority})`
    ).join('\n');

    const taskSummary = (tasks || []).map(t =>
      `- [${t.status === 'completed' ? 'DONE' : 'PENDING'}] ${t.task_name} (Deadline: ${t.deadline || 'N/A'}, Priority: ${t.priority})`
    ).join('\n');

    const prompt = `You are InboxFlow AI. Generate a professional "1:00 PM Daily Executive Standup & Status Report" for the user.

Current Tasks Status:
${taskSummary || 'No manual tasks.'}

Current Deadlines:
${deadlineSummary || 'No upcoming deadlines.'}

Format the report with:
1. ☀️ Executive Briefing (1-2 sentences)
2. 🎯 Completed Milestones (what has been finished today)
3. ⏰ Action Required by EOD / Approaching Deadlines
4. 💡 Proactive Productivity Recommendation

Keep it crisp, structured, and motivational.`;

    const report = await groqService.copilotQuery(prompt, []);
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
