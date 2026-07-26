const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET ALL POSTS (feed)
router.get('/', authMiddleware, (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.username, u.avatar,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(posts);
});

// CREATE POST
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image is required' });
  const { caption } = req.body;
  const id = uuidv4();
  const image_url = `/uploads/${req.file.filename}`;
  db.prepare('INSERT INTO posts (id, user_id, image_url, caption) VALUES (?, ?, ?, ?)').run(id, req.user.id, image_url, caption || '');
  const post = db.prepare('SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?').get(id);
  res.json({ ...post, like_count: 0, comment_count: 0, is_liked: 0 });
});

// LIKE / UNLIKE POST
router.post('/:id/like', authMiddleware, (req, res) => {
  const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(req.user.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(req.user.id, req.params.id);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO likes (id, user_id, post_id) VALUES (?, ?, ?)').run(uuidv4(), req.user.id, req.params.id);
    res.json({ liked: true });
  }
});

// GET COMMENTS
router.get('/:id/comments', authMiddleware, (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);
  res.json(comments);
});

// ADD COMMENT
router.post('/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty' });
  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, user_id, post_id, content) VALUES (?, ?, ?, ?)').run(id, req.user.id, req.params.id, content);
  const comment = db.prepare('SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(id);
  res.json(comment);
});

// DELETE POST
router.delete('/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!post) return res.status(403).json({ error: 'Not allowed' });
  db.prepare('DELETE FROM likes WHERE post_id = ?').run(req.params.id);
  db.prepare('DELETE FROM comments WHERE post_id = ?').run(req.params.id);
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
