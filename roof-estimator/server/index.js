const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow React dev server (port 3000) to call this API
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '20mb' }));

/* ─── Health check ─────────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'trojan-roofing-pdf' });
});

/* ─── Proposals API ───────────────────────────────────────────────── */
const proposalsRouter = require('./routes/proposals');
app.use('/api/proposals', proposalsRouter);

/* ─── Serve React build if it exists (production) ──────────────────── */
const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));

/* ─── Root route — serve React app or redirect to dev server ───────── */
app.get('/', (_req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Development: redirect to React dev server on port 3000
    res.redirect('http://localhost:3000');
  }
});

/* ─── SPA catch-all for React Router (production build) ────────────── */
app.get('*', (_req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.redirect('http://localhost:3000' + _req.originalUrl);
  }
});

/* ─── Start ────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[Precision Roofing] Server running on http://localhost:${PORT}`);
  console.log(`[Precision Roofing] React app: http://localhost:3000`);
  console.log(`[Precision Roofing] Health check: http://localhost:${PORT}/api/health`);
});
