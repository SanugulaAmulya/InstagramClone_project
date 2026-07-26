import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.trim().length < 1) { setSearchResults([]); return; }
    try {
      const res = await axios.get(`/api/users?q=${q}`);
      setSearchResults(res.data);
      setShowSearch(true);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="font-display text-2xl font-bold gradient-text shrink-0">
          Instagram
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            className="w-full bg-gray-100 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-9 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
              {searchResults.map(u => (
                <Link
                  key={u.id}
                  to={`/profile/${u.username}`}
                  onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white text-sm font-semibold">
                    {u.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">@{u.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-5 text-gray-600">
          <Link to="/" className="nav-link text-sm font-medium hover:text-pink-500">🏠 Feed</Link>
          <Link to="/messages" className="nav-link text-sm font-medium hover:text-pink-500">💬 Chat</Link>
          <Link to={`/profile/${user?.username}`} className="nav-link text-sm font-medium hover:text-pink-500">
            👤 {user?.username}
          </Link>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
