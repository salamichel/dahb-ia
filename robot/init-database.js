#!/usr/bin/env node

/**
 * Initialise la base de données avec la structure compatible
 * avec l'interface React existante
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'metadata.json');

const initialData = {
  components: [],
  lastUpdated: new Date().toISOString(),
  version: '2.0',
  robotStatus: {
    initialized: true,
    domainsSupported: [
      'Oracle ERP Cloud',
      'Delphes-OeBS',
      'RBM-NRM',
      'BI Publisher',
      'ETL SI Finance',
      'IBM Cotre',
      'Tradeshift',
      'C2FO',
      'Abacus'
    ],
    formatsSupported: ['.docx', '.pdf', '.txt']
  }
};

async function initDatabase() {
  console.log('🔧 Initialisation de la base de données...\n');

  if (await fs.pathExists(DB_PATH)) {
    console.log('⚠️  Le fichier metadata.json existe déjà.');
    console.log(`   Emplacement: ${DB_PATH}\n`);

    const rl = (await import('readline')).createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Voulez-vous le réinitialiser ? (y/N) ', resolve);
    });
    rl.close();

    if (answer?.toLowerCase() !== 'y') {
      console.log('❌ Opération annulée.');
      return;
    }

    // Backup de l'ancien fichier
    const backupPath = `${DB_PATH}.backup.${Date.now()}`;
    await fs.copy(DB_PATH, backupPath);
    console.log(`💾 Backup créé: ${backupPath}`);
  }

  await fs.writeJson(DB_PATH, initialData, { spaces: 2 });
  console.log('✅ Base de données initialisée avec succès !');
  console.log(`   Emplacement: ${DB_PATH}`);
  console.log('\n🚀 Vous pouvez maintenant démarrer le robot avec: npm start\n');
}

initDatabase().catch(error => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});
