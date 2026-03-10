import React, { useState } from 'react';
import { getAllProjects, deleteProject, importProjectsFromJSON } from '../utils/storage';

export default function SavedProjects({ onLoadProject, onClose }) {
  const [projects, setProjects] = useState(getAllProjects());

  const handleDelete = (id) => {
    if (window.confirm('Delete this saved project?')) {
      const updated = deleteProject(id);
      setProjects(updated);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const updated = await importProjectsFromJSON(file);
        setProjects(updated);
      } catch (err) {
        alert('Import error: ' + err.message);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Saved Projects</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {projects.length === 0 ? (
          <p className="helper-text" style={{ padding: '20px' }}>No saved projects yet.</p>
        ) : (
          <ul className="saved-project-list">
            {projects.map(p => (
              <li key={p.id} className="saved-project-item">
                <div className="saved-project-info">
                  <span className="saved-project-address">{p.address || 'Untitled'}</span>
                  <span className="saved-project-date">
                    {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                  </span>
                  <span className="saved-project-stats">
                    {p.polygons?.length || 0} sections · {(p.totalArea || 0).toFixed(0)} sq ft
                  </span>
                </div>
                <div className="saved-project-actions">
                  <button className="btn-sm" onClick={() => onLoadProject(p)}>Load</button>
                  <button className="btn-danger-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-footer">
          <label className="btn-secondary import-btn">
            📂 Import JSON
            <input type="file" accept=".json" onChange={handleImport} hidden />
          </label>
        </div>
      </div>
    </div>
  );
}
