import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFilenameWithPatterns, loadPatterns, addPattern } from './pattern-matcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PATTERNS_API_PORT || 3001;

app.use(cors());
app.use(express.json());

const PATTERNS_FILE = path.join(__dirname, 'naming-patterns.json');

/**
 * GET /api/patterns - Liste tous les patterns
 */
app.get('/api/patterns', async (req, res) => {
  try {
    const config = await loadPatterns();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/patterns - Ajoute un nouveau pattern
 */
app.post('/api/patterns', async (req, res) => {
  try {
    const newPattern = req.body;
    await addPattern(newPattern);
    const config = await loadPatterns();
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/patterns/:index - Met à jour un pattern existant
 */
app.put('/api/patterns/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const updatedPattern = req.body;

    const config = await loadPatterns();

    if (index < 0 || index >= config.patterns.length) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    config.patterns[index] = { ...config.patterns[index], ...updatedPattern };

    await fs.writeJson(PATTERNS_FILE, config, { spaces: 2 });

    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/patterns/:index - Supprime un pattern
 */
app.delete('/api/patterns/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const config = await loadPatterns();

    if (index < 0 || index >= config.patterns.length) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    config.patterns.splice(index, 1);

    await fs.writeJson(PATTERNS_FILE, config, { spaces: 2 });

    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/patterns/test - Teste un pattern avec un nom de fichier
 */
app.post('/api/patterns/test', async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename is required' });
    }

    const result = await parseFilenameWithPatterns(filename);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/patterns/:index/priority - Change la priorité (monte/descend)
 */
app.put('/api/patterns/:index/priority', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const { direction } = req.body; // 'up' ou 'down'

    const config = await loadPatterns();

    if (index < 0 || index >= config.patterns.length) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= config.patterns.length) {
      return res.status(400).json({ error: 'Cannot move pattern beyond bounds' });
    }

    // Swap
    [config.patterns[index], config.patterns[newIndex]] =
    [config.patterns[newIndex], config.patterns[index]];

    await fs.writeJson(PATTERNS_FILE, config, { spaces: 2 });

    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Pattern Manager API running on http://localhost:${PORT}`);
  console.log(`📝 Patterns file: ${PATTERNS_FILE}`);
});
