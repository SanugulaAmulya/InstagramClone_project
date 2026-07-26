import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function MessagesPage() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axios.get('/api/messages/conversations').then(res => setConversations(res.data));
  }, []);

  useEffect(() => {
    if (userId) {
      loadMessages(userId);
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (uid) => {
    setLoadingMsgs(true);
    try {
      const res = await axios.get(`/api/messages/${uid}`);
      setMessages(res.data);
      if (res.data.length > 0) {
        const other = res.data.find(m => m.sender_id !== me.id);
        if (other) setActiveUser({ id: other.sender_id, username: other.username });
      }
    } catch (err) { console.error(err); }
    setLoadingMsgs(false);
  };

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const res = await axios.get(`/api/users?q=${q}`);
    setSearchResults(res.data.filter(u => u.id !== me.id));
  };

  const selectUser = (user) => {
    setActiveUser(user);
    setSearchQ('');
    setSearchResults([]);
    navigate(`/messages/${user.id}`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;
    try {
      const res = await axios.post(`/api/messages/${userId}`, { content: newMessage });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      // Refresh conversations
      const convRes = await axios.get('/api/messages/conversations');
      setConversations(convRes.data);
    } catch (err) { console.error(err); }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pt-14 h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1 max-w-4xl w-full mx-auto overflow-hidden h-full">

        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-lg mb-3">💬 Messages</h2>
            <input
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search users to message..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-300"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">@{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-8 px-4">No conversations yet. Search for someone!</p>
            ) : conversations.map(conv => (
              <button
                key={conv.other_user_id}
                onClick={() => selectUser({ id: conv.other_user_id, username: conv.username })}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${userId === conv.other_user_id ? 'bg-pink-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold shrink-0">
                  {conv.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">@{conv.username}</p>
                  <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {!userId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💌</div>
                <p className="font-semibold text-gray-600">Select a conversation</p>
                <p className="text-sm text-gray-400 mt-1">Or search for someone to message</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold">
                  {(activeUser?.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">@{activeUser?.username || '...'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <p className="text-center text-gray-400 text-sm">Loading...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hi! 👋</p>
                ) : messages.map(msg => {
                  const isMine = msg.sender_id === me.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-3">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-2xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  Send 📤
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
