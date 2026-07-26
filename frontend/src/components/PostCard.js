import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(!!post.is_liked);
  const [likeCount, setLikeCount] = useState(parseInt(post.like_count) || 0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(parseInt(post.comment_count) || 0);
  const [deleting, setDeleting] = useState(false);

  const imageUrl = post.image_url.startsWith('/uploads')
    ? `http://localhost:5000${post.image_url}`
    : post.image_url;

  const handleLike = async () => {
    try {
      const res = await axios.post(`/api/posts/${post.id}/like`);
      setLiked(res.data.liked);
      setLikeCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (err) { console.error(err); }
  };

  const loadComments = async () => {
    if (!showComments) {
      const res = await axios.get(`/api/posts/${post.id}/comments`);
      setComments(res.data);
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`/api/posts/${post.id}/comments`, { content: newComment });
      setComments(prev => [...prev, res.data]);
      setCommentCount(prev => prev + 1);
      setNewComment('');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/posts/${post.id}`);
      onDelete(post.id);
    } catch (err) { console.error(err); setDeleting(false); }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="post-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/profile/${post.username}`} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
            {post.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold hover:text-pink-500 transition-colors">@{post.username}</p>
            <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
        {user?.username === post.username && (
          <button onClick={handleDelete} disabled={deleting} className="text-gray-300 hover:text-red-400 transition-colors text-xl p-1">
            🗑️
          </button>
        )}
      </div>

      {/* Image */}
      <div className="relative bg-gray-50 overflow-hidden" style={{maxHeight: '480px'}}>
        <img src={imageUrl} alt="post" className="w-full object-cover" style={{maxHeight: '480px'}} />
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="heart-btn flex items-center gap-1.5 text-sm">
            <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
            <span className={`font-medium ${liked ? 'text-pink-500' : 'text-gray-500'}`}>{likeCount}</span>
          </button>
          <button onClick={loadComments} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition-colors">
            <span className="text-xl">💬</span>
            <span className="font-medium">{commentCount}</span>
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="mt-2 text-sm">
            <Link to={`/profile/${post.username}`} className="font-semibold mr-1.5">@{post.username}</Link>
            {post.caption}
          </p>
        )}

        {/* Comments */}
        {showComments && (
          <div className="mt-3 border-t border-gray-50 pt-3 space-y-2">
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-2 text-sm">
                <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                  {c.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold mr-1.5">@{c.username}</span>
                  <span className="text-gray-700">{c.content}</span>
                </div>
              </div>
            ))}
            <form onSubmit={handleComment} className="flex gap-2 mt-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm bg-gray-50 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-pink-300 border border-gray-100"
              />
              <button type="submit" className="text-sm font-semibold text-pink-500 hover:text-pink-600">Post</button>
            </form>
          </div>
        )}
      </div>
      <div className="h-2" />
    </div>
  );
}
