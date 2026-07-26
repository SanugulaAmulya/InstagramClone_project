import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [editBio, setEditBio] = useState(false);
  const [bio, setBio] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/users/${username}`).then(res => {
      setProfile(res.data);
      setFollowing(res.data.is_following);
      setFollowerCount(res.data.follower_count);
      setBio(res.data.bio || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    try {
      const res = await axios.post(`/api/users/${profile.id}/follow`);
      setFollowing(res.data.following);
      setFollowerCount(prev => res.data.following ? prev + 1 : prev - 1);
    } catch (err) { console.error(err); }
  };

  const handleSaveBio = async () => {
    await axios.put('/api/users/me/update', { bio });
    setProfile(prev => ({ ...prev, bio }));
    setEditBio(false);
  };

  if (loading) return <div className="pt-20 text-center text-gray-400 mt-20">Loading profile...</div>;
  if (!profile) return <div className="pt-20 text-center text-gray-400 mt-20">User not found 😔</div>;

  const isOwnProfile = me?.username === username;
  const imageBase = 'http://localhost:5000';

  return (
    <div className="pt-20 pb-10 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4">

        {/* Profile Header */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-orange-400 to-yellow-400 flex items-center justify-center text-white text-3xl font-bold shadow-md shrink-0">
              {profile.username[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">@{profile.username}</h1>

              {/* Bio */}
              {isOwnProfile ? (
                editBio ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-pink-300"
                      placeholder="Write your bio..."
                    />
                    <button onClick={handleSaveBio} className="text-xs font-semibold text-pink-500 hover:text-pink-600">Save</button>
                    <button onClick={() => setEditBio(false)} className="text-xs text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <p
                    onClick={() => setEditBio(true)}
                    className="text-sm text-gray-500 mt-1 cursor-pointer hover:text-gray-700 transition-colors"
                  >
                    {profile.bio || <span className="italic text-gray-300">+ Add bio</span>}
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-500 mt-1">{profile.bio || ''}</p>
              )}
            </div>

            {!isOwnProfile && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleFollow}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    following
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:opacity-90 shadow-sm'
                  }`}
                >
                  {following ? '✓ Following' : '+ Follow'}
                </button>
                <Link
                  to={`/messages/${profile.id}`}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  💬 Message
                </Link>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-5 pt-5 border-t border-gray-50">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{profile.posts?.length || 0}</div>
              <div className="text-xs text-gray-400 font-medium">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{followerCount}</div>
              <div className="text-xs text-gray-400 font-medium">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{profile.following_count || 0}</div>
              <div className="text-xs text-gray-400 font-medium">Following</div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {profile.posts?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-5xl mb-3">📷</div>
            <p className="font-semibold text-gray-600">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {profile.posts?.map(post => (
              <div key={post.id} className="aspect-square overflow-hidden rounded-xl bg-gray-100 relative group">
                <img
                  src={`${imageBase}${post.image_url}`}
                  alt="post"
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm font-semibold">❤️ {post.like_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
