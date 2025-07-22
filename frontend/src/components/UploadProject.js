
import React, { useState } from 'react';
import axios from '../api';

const UploadProject = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Choose a file');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', desc);
    formData.append('image_file', file);

    try {
      const res = await axios.post('/projects/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Uploaded successfully');
      onUploadSuccess(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to upload');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <h3>Create New Project</h3>
      <input
        type="text"
        placeholder="Project Title"
        onChange={(e) => setTitle(e.target.value)}
        required
        style={{ width: '100%', marginBottom: 10 }}
      />
      <textarea
        placeholder="Description"
        onChange={(e) => setDesc(e.target.value)}
        style={{ width: '100%', height: 80, marginBottom: 10 }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        required
        style={{ marginBottom: 10 }}
      />
      <br />
      <button type="submit">Upload</button>
    </form>
  );
};

export default UploadProject;
