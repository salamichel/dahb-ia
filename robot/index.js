#!/usr/bin/env node

import chokidar from 'chokidar';
import path from 'path';
import { config } from './config.js';
import { parseDocument } from './parsers.js';
import { analyzeContent } from './analyzer.js';
import { upsertDocument, isFileUnchanged, cleanDatabase } from './database.js';

/**
 * ROBOT V2 - Système d'indexation intelligente multi-domaine
 *
 * Surveille des dossiers, parse les documents (DOCX, PDF, TXT),
 * analyse le contenu avec Gemini et indexe dans une base JSON.
 */

const SUPPORTED_EXTENSIONS = ['.docx', '.pdf', '.txt'];

/**
 * Traite un fichier détecté
 */
async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  // Ignore les fichiers temporaires (Word, Excel, etc.)
  if (filename.startsWith('~$')) {
    console.log(`⏭️  Fichier temporaire ignoré: ${filename}`);
    return;
  }

  // Ignore les fichiers non supportés
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return;
  }

  // Petite pause pour s'assurer que l'écriture du fichier est terminée (Windows lock)
  await new Promise(resolve => setTimeout(resolve, config.batchDelay));

  console.log(`\n📄 Détection: ${filename}`);

  try {
    // 1. PARSING
    console.log(`📖 Parsing ${ext.toUpperCase().substring(1)}...`);
    const parseResult = await parseDocument(filePath);

    if (!parseResult.success) {
      console.error(`❌ Échec du parsing: ${parseResult.error}`);
      return;
    }

    console.log(`✅ ${parseResult.wordCount} mots extraits`);

    // 2. VÉRIFICATION DU HASH (évite de retraiter les fichiers non modifiés)
    const unchanged = await isFileUnchanged(filePath, parseResult.hash);
    if (unchanged) {
      console.log(`⏭️  Fichier déjà indexé (inchangé)`);
      return;
    }

    // 3. ANALYSE GEMINI
    const analysis = await analyzeContent(parseResult.text, filename);

    if (!analysis) {
      console.error(`❌ Analyse IA échouée`);
      return;
    }

    console.log(`✅ Analyse terminée - Domaine: ${analysis.domain} | Module: ${analysis.module}`);

    // 4. STOCKAGE
    const modified = await upsertDocument(filePath, analysis, parseResult.hash);

    if (modified) {
      console.log(`💚 Indexation réussie pour ${analysis.component_id}`);
    }

  } catch (error) {
    console.error(`💥 Erreur critique sur ${filePath}:`, error.message);
    console.error(error.stack);
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          🤖 ROBOT V2 - Indexation Intelligente            ║
║                 Powered by Gemini 1.5 Flash                ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Vérification de la clé API
  if (!config.googleApiKey) {
    console.error('❌ GOOGLE_API_KEY non configurée !');
    console.error('   Copiez .env.example vers .env et ajoutez votre clé API.');
    process.exit(1);
  }

  console.log(`📂 Dossiers surveillés:`);
  config.watchFolders.forEach(folder => {
    console.log(`   - ${path.resolve(folder)}`);
  });

  console.log(`\n💾 Base de données: ${config.outputDb}`);
  console.log(`🌍 Domaines supportés: ${Object.keys(config.domains).join(', ')}`);
  console.log(`📝 Formats supportés: ${SUPPORTED_EXTENSIONS.join(', ')}`);

  // Nettoyage initial de la base de données
  console.log(`\n🧹 Nettoyage de la base de données...`);
  await cleanDatabase();

  // Démarrage du watcher
  console.log(`\n🚀 Démarrage de la surveillance...\n`);

  const watcher = chokidar.watch(config.watchFolders, {
    persistent: true,
    ignored: [
      /(^|[\/\\])\../, // Ignore les fichiers cachés
      /^~\$/ // Ignore les fichiers temporaires (Word, Excel, etc.)
    ],
    ignoreInitial: false, // Traite les fichiers existants au démarrage
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', filePath => {
      console.log(`➕ Nouveau fichier: ${path.basename(filePath)}`);
      processFile(filePath);
    })
    .on('change', filePath => {
      console.log(`♻️  Fichier modifié: ${path.basename(filePath)}`);
      processFile(filePath);
    })
    .on('unlink', filePath => {
      console.log(`🗑️  Fichier supprimé: ${path.basename(filePath)} (sera nettoyé au prochain démarrage)`);
    })
    .on('error', error => {
      console.error(`❌ Erreur watcher:`, error);
    })
    .on('ready', () => {
      console.log(`✅ Surveillance active - Le robot attend les documents...\n`);
    });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n\n🛑 Arrêt du robot...`);
    await watcher.close();
    console.log(`👋 Au revoir !\n`);
    process.exit(0);
  });
}

// Lancement
main().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
