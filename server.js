import express from 'express';
import cors from 'cors';
import { search, getAppInfo } from './scraper.js';

const app = express();
app.use(cors());

const API_KEY = process.env.API_KEY || 'change-me';

// simple auth (private API)
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'q required' });
    const results = await search(q);
    res.json({ query: q, results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/app/:id', async (req, res) => {
  try {
    const info = await getAppInfo(req.params.id);
    res.json(info);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/app/:id/download', async (req, res) => {
  try {
    const info = await getAppInfo(req.params.id);
    if (!info.downloadUrl) return res.status(404).json({ error: 'no download link' });
    res.json({ id: req.params.id, downloadUrl: info.downloadUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on ${PORT}`));
