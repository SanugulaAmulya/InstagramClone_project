const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET USER PROFILE
router.get('/:username', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, bio, avatar, created_at FROM users WHERE username = ?').get(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const posts = db.prepare(`
    SELECT p.*, 
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM posts p WHERE p.user_id = ? ORDER BY p.created_at DESC
  `).all(user.id);

  const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
  const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;
  const isFollowing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, user.id);

  res.json({ ...user, posts, follower_count: followerCount, following_count: followingCount, is_following: !!isFollowing });
});

// FOLLOW / UNFOLLOW
router.post('/:id/follow', authMiddleware, (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ error: "Can't follow yourself" });
  const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.id, req.params.id);
    res.json({ following: false });
  } else {
    db.prepare('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)').run(uuidv4(), req.user.id, req.params.id);
    res.json({ following: true });
  }
});

// UPDATE PROFILE (bio)
router.put('/me/update', authMiddleware, (req, res) => {
  const { bio } = req.body;
  db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio || '', req.user.id);
  res.json({ success: true });
});

// SEARCH USERS
router.get('/', authMiddleware, (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const users = db.prepare("SELECT id, username, avatar FROM users WHERE username LIKE ? LIMIT 10").all(`%${q}%`);
  res.json(users);
});

module.exports = router;
