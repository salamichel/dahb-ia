#!/usr/bin/env node

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.UPLOAD_API_PORT || 3002;

// Configuration CORS
app.use(cors());
app.use(express.json());

// S'assurer que le dossier documents existe
const uploadDir = path.join(__dirname, 'documents');
await fs.ensureDir(uploadDir);

// Configuration multer pour gérer les uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Ignore les fichiers temporaires
    if (file.originalname.startsWith('~$')) {
      return cb(new Error('Fichiers temporaires non autorisés'));
    }

    // Utilise le nom original du fichier
    // Gère les caractères spéciaux en conservant l'encodage UTF-8
    const sanitizedName = file.originalname;
    cb(null, sanitizedName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: (config.maxFileSizeMB || 50) * 1024 * 1024 // MB to bytes
  },
  fileFilter: (req, file, cb) => {
    // Vérifie l'extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.docx', '.pdf', '.txt'];

    // Ignore les fichiers temporaires
    if (file.originalname.startsWith('~$')) {
      return cb(new Error('Fichiers temporaires non autorisés'));
    }

    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`Extension non supportée: ${ext}. Extensions autorisées: ${allowedExtensions.join(', ')}`));
    }

    cb(null, true);
  }
});

/**
 * POST /upload
 * Upload un ou plusieurs fichiers vers le robot
 */
app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier reçu'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      path: file.path,
      mimetype: file.mimetype
    }));

    console.log(`✅ ${uploadedFiles.length} fichier(s) uploadé(s) vers ${uploadDir}`);
    uploadedFiles.forEach(file => {
      console.log(`   📄 ${file.originalName} (${(file.size / 1024).toFixed(2)} KB)`);
    });

    res.json({
      success: true,
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      files: uploadedFiles.map(f => ({
        name: f.originalName,
        size: f.size
      }))
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /status
 * Retourne les stats du dossier documents
 */
app.get('/status', async (req, res) => {
  try {
    const files = await fs.readdir(uploadDir);
    const docFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.docx', '.pdf', '.txt'].includes(ext) && !f.startsWith('~$');
    });

    const stats = await Promise.all(
      docFiles.map(async (file) => {
        const filePath = path.join(uploadDir, file);
        const stat = await fs.stat(filePath);
        return {
          name: file,
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime
        };
      })
    );

    res.json({
      success: true,
      uploadDir,
      totalFiles: docFiles.length,
      files: stats
    });

  } catch (error) {
    console.error('❌ Erreur status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /metadata
 * Retourne le contenu de metadata.json
 */
app.get('/metadata', async (req, res) => {
  try {
    const metadataPath = config.outputDb;

    if (!await fs.pathExists(metadataPath)) {
      return res.json({
        success: true,
        components: [],
        lastUpdated: new Date().toISOString(),
        version: '2.0'
      });
    }

    const metadata = await fs.readJson(metadataPath);
    res.json(metadata);

  } catch (error) {
    console.error('❌ Erreur lecture metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /files/:filename
 * Supprime un fichier du dossier documents
 */
app.delete('/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    // Sécurité: empêche la navigation dans les dossiers parents
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Nom de fichier invalide'
      });
    }

    const filePath = path.join(uploadDir, filename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Fichier non trouvé'
      });
    }

    await fs.remove(filePath);
    console.log(`🗑️  Fichier supprimé: ${filename}`);

    res.json({
      success: true,
      message: `Fichier ${filename} supprimé`
    });

  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          📤 ROBOT V2 - Upload API                          ║
║                 Port ${PORT}                                    ║
╚════════════════════════════════════════════════════════════╝

📂 Dossier de réception: ${uploadDir}
📝 Formats acceptés: .docx, .pdf, .txt
📊 API disponibles:
   POST   /upload       - Upload de fichiers
   GET    /status       - Statut du dossier
   GET    /metadata     - Lecture de metadata.json
   DELETE /files/:name  - Suppression d'un fichier

✅ API prête à recevoir les documents...
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Arrêt de l\'API...');
  process.exit(0);
});
