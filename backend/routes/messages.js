const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET ALL CONVERSATIONS (list of people you've messaged)
router.get('/conversations', authMiddleware, (req, res) => {
  const conversations = db.prepare(`
    SELECT DISTINCT 
      CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
      u.username, u.avatar,
      (SELECT content FROM messages 
       WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
       ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages 
       WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
       ORDER BY created_at DESC LIMIT 1) as last_time
    FROM messages m
    JOIN users u ON u.id = CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
    WHERE sender_id = ? OR receiver_id = ?
    ORDER BY last_time DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
  res.json(conversations);
});

// GET MESSAGES WITH A SPECIFIC USER
router.get('/:userId', authMiddleware, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.username, u.avatar FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(req.user.id, req.params.userId, req.params.userId, req.user.id);
  res.json(messages);
});

// SEND MESSAGE
router.post('/:userId', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Message cannot be empty' });
  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.userId);
  if (!receiver) return res.status(404).json({ error: 'User not found' });

  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)').run(id, req.user.id, req.params.userId, content);
  const message = db.prepare('SELECT m.*, u.username, u.avatar FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?').get(id);
  res.json(message);
});

module.exports = router;
