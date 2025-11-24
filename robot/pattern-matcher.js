import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Moteur de patterns configurables pour le parsing de noms de fichiers
 */

let patternsConfig = null;

/**
 * Charge la configuration des patterns depuis naming-patterns.json
 */
export async function loadPatterns() {
  if (patternsConfig) return patternsConfig;

  const configPath = path.join(__dirname, 'naming-patterns.json');

  try {
    patternsConfig = await fs.readJson(configPath);
    console.log(`✅ ${patternsConfig.patterns.filter(p => p.enabled).length} patterns chargés depuis naming-patterns.json`);
    return patternsConfig;
  } catch (error) {
    console.error('❌ Impossible de charger naming-patterns.json:', error.message);
    // Fallback sur configuration minimale
    patternsConfig = {
      patterns: [],
      globalSettings: {
        caseInsensitive: true,
        cleanUnderscores: true
      }
    };
    return patternsConfig;
  }
}

/**
 * Parse un nom de fichier en testant tous les patterns configurés
 */
export async function parseFilenameWithPatterns(filename) {
  const config = await loadPatterns();
  const baseName = path.basename(filename, path.extname(filename));

  // Tri par priorité (les patterns avec priority sont traités en dernier)
  const sortedPatterns = [...config.patterns]
    .filter(p => p.enabled !== false)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const pattern of sortedPatterns) {
    const flags = config.globalSettings.caseInsensitive ? 'i' : '';
    const regex = new RegExp(pattern.regex, flags);
    const match = baseName.match(regex);

    if (match) {
      const result = {
        pattern: pattern.name,
        matched: true
      };

      // Extraction des groupes selon la configuration
      if (pattern.groups) {
        if (pattern.groups.componentId !== undefined) {
          result.componentId = match[pattern.groups.componentId];
        }
        if (pattern.groups.componentName !== undefined) {
          let name = match[pattern.groups.componentName];
          if (config.globalSettings.cleanUnderscores) {
            name = name.replace(/_/g, ' ');
          }
          result.componentName = name;
        }
        if (pattern.groups.docType !== undefined) {
          const rawType = match[pattern.groups.docType].toUpperCase();
          // Mapping du type si défini
          result.docType = pattern.typeMapping?.[rawType] || rawType;
        }
      }

      // Détection de relations (fichiers liés)
      result.linkedTo = detectRelationships(baseName, config.relationships);

      console.log(`✅ Pattern "${pattern.name}" matched`);
      return result;
    }
  }

  // Aucun pattern ne correspond : fallback
  console.warn(`⚠️  Aucun pattern ne correspond à "${baseName}"`);
  return {
    pattern: 'NO_MATCH',
    matched: false,
    componentId: baseName.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    componentName: baseName.replace(/_/g, ' '),
    docType: null,
    linkedTo: null
  };
}

/**
 * Détecte si un fichier doit être lié à un autre composant
 */
function detectRelationships(baseName, relationshipsConfig) {
  if (!relationshipsConfig?.rules) return null;

  for (const rule of relationshipsConfig.rules) {
    const regex = new RegExp(rule.pattern, 'i');
    const match = baseName.match(regex);

    if (match && rule.action === 'link_to_component') {
      const mainId = match[rule.extractMainId];
      console.log(`🔗 Fichier lié détecté: ${baseName} → Composant ${mainId}`);
      return {
        type: 'linked_document',
        mainComponentId: mainId,
        linkType: rule.name
      };
    }
  }

  return null;
}

/**
 * Détecte le type de document à partir de mots-clés si non trouvé par pattern
 */
export async function detectDocTypeFromKeywords(text, filename) {
  const config = await loadPatterns();
  const combinedText = (text + ' ' + filename).toLowerCase();

  for (const [docType, keywords] of Object.entries(config.docTypeKeywords || {})) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return docType;
      }
    }
  }

  return 'SFD'; // Par défaut
}

/**
 * Ajoute un nouveau pattern à la configuration (utilisable via API ou CLI)
 */
export async function addPattern(newPattern) {
  const config = await loadPatterns();

  // Validation basique
  if (!newPattern.name || !newPattern.regex) {
    throw new Error('Pattern invalide: name et regex requis');
  }

  config.patterns.push({
    enabled: true,
    ...newPattern
  });

  const configPath = path.join(__dirname, 'naming-patterns.json');
  await fs.writeJson(configPath, config, { spaces: 2 });

  console.log(`✅ Pattern "${newPattern.name}" ajouté`);

  // Recharge la config
  patternsConfig = null;
  return loadPatterns();
}

/**
 * Liste tous les patterns configurés
 */
export async function listPatterns() {
  const config = await loadPatterns();
  return config.patterns.map(p => ({
    name: p.name,
    enabled: p.enabled !== false,
    examples: p.examples || []
  }));
}
