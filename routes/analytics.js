const express = require('express');
const router = express.Router();
const db = require('../services/supabaseService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

// GET /api/analytics
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data } = await db.getAnalytics(req.session.user.id);
    const { data: tasks } = await db.getTasks(req.session.user.id);
    const { data: deadlines } = await db.getDeadlines(req.session.user.id);
    const { data: followups } = await db.getFollowUps(req.session.user.id);

    res.json({
      analytics: data || {},
      tasks_total: tasks?.length || 0,
      tasks_completed: tasks?.filter(t => t.status === 'completed').length || 0,
      tasks_pending: tasks?.filter(t => t.status === 'pending').length || 0,
      deadlines_total: deadlines?.length || 0,
      followups_active: followups?.filter(f => !f.dismissed).length || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

