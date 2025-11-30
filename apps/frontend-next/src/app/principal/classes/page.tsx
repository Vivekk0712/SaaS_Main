"use client"
import React, { useState, useEffect } from 'react';

const STUDY_API_URL = process.env.NEXT_PUBLIC_STUDY_API_URL || 'http://localhost:3002';

export default function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${STUDY_API_URL}/v1/classes`);
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${STUDY_API_URL}/v1/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grade, section }),
      });
      if (!response.ok) {
        throw new Error('Failed to create class');
      }
      setGrade('');
      setSection('');
      fetchClasses();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 className="title">Manage Classes</h1>
        
        <div className="section">
          <h2>Create New Class</h2>
          <form onSubmit={handleCreateClass} className="grid">
            <div className="field">
              <label className="label" htmlFor="grade">Grade</label>
              <input
                id="grade"
                className="input"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g., 1, 2, LKG"
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="section">Section</label>
              <input
                id="section"
                className="input"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g., A, B, C"
                required
              />
            </div>
            <div className="actions">
              <button type="submit" className="btn">Create Class</button>
            </div>
          </form>
          {error && <p className="error">{error}</p>}
        </div>

        <div className="section">
          <h2>Existing Classes</h2>
          {loading ? (
            <p>Loading classes...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th align="left">Grade</th>
                  <th align="left">Section</th>
                  <th align="left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c._id}>
                    <td>{c.grade}</td>
                    <td>{c.section}</td>
                    <td>{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
