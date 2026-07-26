import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/posts').then(res => {
      setPosts(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleNewPost = (post) => setPosts(prev => [post, ...prev]);
  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id));

  return (
    <div className="pt-20 pb-10 min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4">
        <CreatePost onPost={handleNewPost} />

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-5xl mb-3">📷</div>
            <p className="font-semibold text-gray-700">No posts yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
