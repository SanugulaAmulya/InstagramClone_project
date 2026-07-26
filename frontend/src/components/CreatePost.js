import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function CreatePost({ onPost }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { setError('Please select an image'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('caption', caption);
      const res = await axios.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onPost(res.data);
      setImage(null);
      setPreview(null);
      setCaption('');
      fileRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-xl">✨</span> Share a moment
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Drop Zone */}
        <div
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 mb-3 cursor-pointer hover:border-pink-300 transition-colors text-center"
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-60 mx-auto rounded-lg object-contain" />
          ) : (
            <div className="py-4 text-gray-400">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm">Click to upload a photo</p>
            </div>
          )}
        </div>
        <input type="file" ref={fileRef} accept="image/*" onChange={handleImageChange} className="hidden" />

        <input
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 border border-gray-100 mb-3"
        />

        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

        <button
          type="submit"
          disabled={loading || !image}
          className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold rounded-xl text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? 'Posting...' : 'Share Post 🚀'}
        </button>
      </form>
    </div>
  );
}
