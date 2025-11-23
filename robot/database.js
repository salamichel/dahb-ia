import fs from 'fs-extra';
import path from 'path';
import { config } from './config.js';

/**
 * Charge la base de données JSON
 */
export async function loadDatabase() {
  try {
    if (await fs.pathExists(config.outputDb)) {
      return await fs.readJson(config.outputDb);
    }
  } catch (error) {
    console.error('❌ Erreur chargement DB:', error.message);
  }

  // Retourne la structure par défaut si le fichier n'existe pas
  return {
    components: [],
    lastUpdated: new Date().toISOString(),
    version: '2.0'
  };
}

/**
 * Sauvegarde la base de données JSON
 */
export async function saveDatabase(db) {
  try {
    await fs.writeJson(config.outputDb, db, { spaces: 2 });
    console.log(`💾 Base de données sauvegardée: ${config.outputDb}`);
  } catch (error) {
    console.error('❌ Erreur sauvegarde DB:', error.message);
  }
}

/**
 * Transforme l'analyse Gemini au format compatible avec l'interface React
 */
function transformToComponentFormat(analysis, filePath, hash) {
  const filename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  return {
    id: analysis.component_id,
    name: analysis.component_name || analysis.component_id,
    summary: analysis.summary || '',
    domain: analysis.domain || 'General',
    documents: {
      [analysis.doc_type]: {
        type: analysis.doc_type,
        uploaded: true,
        lastModified: new Date().toISOString(),
        filePath: filePath,
        fileHash: hash
      }
    },
    cufParams: analysis.cufParams || [],
    oracleTables: analysis.oracleTables || [],
    oicsIntegrations: analysis.oicsIntegrations || [],
    keywords: analysis.keywords || [],
    module: analysis.module || analysis.domain,
    lastIndexed: new Date().toISOString(),
    aiModel: 'gemini-1.5-flash',
    _metadata: {
      originalAnalysis: analysis
    }
  };
}

/**
 * Insère ou met à jour un document dans la base de données
 */
export async function upsertDocument(filePath, analysis, hash) {
  const db = await loadDatabase();

  if (!db.components) {
    db.components = [];
  }

  const componentData = transformToComponentFormat(analysis, filePath, hash);
  const existingIndex = db.components.findIndex(c => c.id === componentData.id);

  if (existingIndex > -1) {
    // Composant existe : on merge les documents
    const existing = db.components[existingIndex];

    // Vérifie si le document a changé
    const docType = analysis.doc_type;
    const oldHash = existing.documents[docType]?.fileHash;

    if (oldHash === hash) {
      console.log(`⏭️  Composant ${componentData.id} déjà à jour (hash identique)`);
      return false; // Pas de modification
    }

    console.log(`♻️  Mise à jour du composant: ${componentData.id}`);

    // Merge des documents
    db.components[existingIndex] = {
      ...existing,
      ...componentData,
      documents: {
        ...existing.documents,
        ...componentData.documents
      },
      // Merge des arrays sans doublons
      cufParams: [...new Set([...(existing.cufParams || []), ...(componentData.cufParams || [])])],
      oracleTables: [...new Set([...(existing.oracleTables || []), ...(componentData.oracleTables || [])])],
      oicsIntegrations: [...new Set([...(existing.oicsIntegrations || []), ...(componentData.oicsIntegrations || [])])],
      keywords: [...new Set([...(existing.keywords || []), ...(componentData.keywords || [])])],
      lastIndexed: new Date().toISOString()
    };
  } else {
    console.log(`✨ Nouveau composant indexé: ${componentData.id}`);
    db.components.push(componentData);
  }

  db.lastUpdated = new Date().toISOString();
  await saveDatabase(db);
  return true; // Modification effectuée
}

/**
 * Vérifie si un fichier a déjà été indexé avec le même hash
 */
export async function isFileUnchanged(filePath, hash) {
  const db = await loadDatabase();
  const filename = path.basename(filePath);

  for (const component of (db.components || [])) {
    for (const doc of Object.values(component.documents || {})) {
      if (doc.filePath === filePath && doc.fileHash === hash) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Nettoie la base de données (supprime les entrées orphelines)
 */
export async function cleanDatabase() {
  const db = await loadDatabase();
  let cleaned = 0;

  for (const component of (db.components || [])) {
    for (const [docType, doc] of Object.entries(component.documents || {})) {
      if (doc.filePath && !(await fs.pathExists(doc.filePath))) {
        console.log(`🧹 Nettoyage: ${doc.filePath} n'existe plus`);
        delete component.documents[docType];
        cleaned++;
      }
    }
  }

  if (cleaned > 0) {
    db.lastUpdated = new Date().toISOString();
    await saveDatabase(db);
    console.log(`✅ ${cleaned} document(s) orphelin(s) nettoyé(s)`);
  } else {
    console.log(`✅ Base de données propre`);
  }
}
