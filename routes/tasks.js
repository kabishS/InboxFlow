const express = require('express');
const router = express.Router();
const db = require('../services/supabaseService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

// GET /api/tasks
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await db.getTasks(req.session.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tasks: data });
});

// POST /api/tasks
router.post('/', requireAuth, async (req, res) => {
  const task = {
    ...req.body,
    user_id: req.session.user.id,
    status: req.body.status || 'pending',
    created_at: new Date().toISOString()
  };
  const { data, error } = await db.createTask(task);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ task: data[0] });
});

// PUT /api/tasks/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { data, error } = await db.updateTask(req.params.id, req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ task: data[0] });
});

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await db.deleteTask(req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;

