const STORAGE_KEY = 'roof-estimator-projects';

/**
 * Save a project to localStorage
 */
export function saveProject(project) {
  const projects = getAllProjects();
  const existing = projects.findIndex(p => p.id === project.id);
  if (existing >= 0) {
    projects[existing] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.push({
      ...project,
      id: project.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return projects;
}

/**
 * Get all saved projects
 */
export function getAllProjects() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get a single project by ID
 */
export function getProject(id) {
  const projects = getAllProjects();
  return projects.find(p => p.id === id) || null;
}

/**
 * Delete a project by ID
 */
export function deleteProject(id) {
  const projects = getAllProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return projects;
}

/**
 * Export all projects as a JSON file download
 */
export function exportProjectsAsJSON() {
  const projects = getAllProjects();
  const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roof-estimator-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import projects from a JSON file
 */
export function importProjectsFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          const existing = getAllProjects();
          const merged = [...existing];
          imported.forEach(proj => {
            if (!merged.find(p => p.id === proj.id)) {
              merged.push(proj);
            }
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          resolve(merged);
        } else {
          reject(new Error('Invalid file format'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
