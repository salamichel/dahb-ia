import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import path from 'path';

// Initialisation de Gemini
const genAI = new GoogleGenerativeAI(config.googleApiKey);

/**
 * Détecte le domaine métier le plus probable en analysant le contenu et le nom du fichier
 */
function detectDomain(text, filename) {
  const combinedText = (text + ' ' + filename).toLowerCase();
  let maxScore = 0;
  let detectedDomain = 'General';

  for (const [domainName, domainConfig] of Object.entries(config.domains)) {
    const score = domainConfig.keywords.filter(kw =>
      combinedText.includes(kw.toLowerCase())
    ).length;

    if (score > maxScore) {
      maxScore = score;
      detectedDomain = domainName;
    }
  }

  return detectedDomain;
}

/**
 * Parse le nom de fichier selon différentes conventions de nommage
 * Supporte :
 * - Format standard : AP020_SETUP.docx, GL018_SFD.pdf
 * - Format EVO : EVO.FINA.001_SET_0549_Interface_Référentiel_Bancaire_CLOUD.docx
 * - Format libre : specification_fonctionnelle_GL018.pdf
 */
function parseFilename(filename) {
  const baseName = path.basename(filename, path.extname(filename));

  // Pattern 1: Format EVO.FINA.XXX_TYPE_XXXX_Description
  // Exemple: EVO.FINA.001_SET_0549_Interface_Référentiel_Bancaire_CLOUD
  const evoPattern = /^(?:EVO\.)?(?:FINA\.)?(?:\d+_)?([A-Z]+)_(\d{3,4})_(.+)$/i;
  const evoMatch = baseName.match(evoPattern);

  if (evoMatch) {
    const docType = evoMatch[1].toUpperCase(); // SET, SFD, STD
    const componentId = evoMatch[2]; // 0549
    const description = evoMatch[3].replace(/_/g, ' '); // Interface Référentiel Bancaire CLOUD

    // Convertir les abréviations de type
    const typeMap = {
      'SET': 'SETUP',
      'SFD': 'SFD',
      'STD': 'STD',
      'FN': 'FN',
      'MOP': 'MOP'
    };

    return {
      componentId,
      componentName: description,
      docType: typeMap[docType] || docType,
      pattern: 'EVO'
    };
  }

  // Pattern 2: Format standard AP020_SETUP, GL018_SFD
  const standardPattern = /^([A-Z]{2,4}\d{2,4})_([A-Z]+)/i;
  const standardMatch = baseName.match(standardPattern);

  if (standardMatch) {
    return {
      componentId: standardMatch[1].toUpperCase(),
      componentName: null, // Sera extrait du contenu par Gemini
      docType: standardMatch[2].toUpperCase(),
      pattern: 'STANDARD'
    };
  }

  // Pattern 3: ID quelque part dans le nom (fallback)
  const idPattern = /(\d{3,4})/;
  const idMatch = baseName.match(idPattern);

  if (idMatch) {
    return {
      componentId: idMatch[1],
      componentName: baseName.replace(/_/g, ' '),
      docType: null, // Sera détecté par mots-clés
      pattern: 'NUMERIC_ID'
    };
  }

  // Pattern 4: Ancien format avec lettres+chiffres
  const legacyPattern = /([A-Z]{2,4}\d{2,4})/i;
  const legacyMatch = baseName.match(legacyPattern);

  if (legacyMatch) {
    return {
      componentId: legacyMatch[1].toUpperCase(),
      componentName: null,
      docType: null,
      pattern: 'LEGACY'
    };
  }

  // Aucun pattern reconnu : génère un ID
  return {
    componentId: baseName.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    componentName: baseName.replace(/_/g, ' '),
    docType: null,
    pattern: 'GENERATED'
  };
}

/**
 * Détecte le type de document (SETUP, SFD, STD, etc.)
 */
function detectDocumentType(text, filename, parsedFilename) {
  // Si déjà détecté depuis le nom de fichier, on le garde
  if (parsedFilename?.docType) {
    return parsedFilename.docType;
  }

  const combinedText = (text + ' ' + filename).toLowerCase();

  for (const [docType, keywords] of Object.entries(config.documentTypes)) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return docType;
      }
    }
  }

  return 'SFD'; // Par défaut
}

/**
 * Construit le prompt Gemini adapté au domaine détecté
 */
function buildGeminiPrompt(domain, docType, filename) {
  const domainConfig = config.domains[domain] || config.domains['Oracle ERP Cloud'];

  const basePrompt = `
Tu es un expert en analyse de documentation technique pour le domaine "${domain}".
Analyse le document fourni et retourne UNIQUEMENT un JSON valide (sans balises markdown).

Champs requis :
- "component_id": Identifiant du composant (cherche dans le texte des patterns comme AP020, GL018, etc.)
- "component_name": Nom descriptif du composant
- "doc_type": "${docType}"
- "domain": "${domain}"
- "module": Module principal parmi ${JSON.stringify(domainConfig.modules)}
- "summary": Résumé exécutif en 2-3 phrases
- "keywords": Liste de 10 mots-clés techniques précis
`;

  // Ajout de champs spécifiques selon le domaine
  const specificFields = domainConfig.extractFields.map(field => {
    switch (field) {
      case 'setup_elements':
        return '- "cufParams": Liste d\'objets [{"param": "nom", "value": "valeur", "description": "desc"}]';
      case 'oracle_tables':
        return '- "oracleTables": Liste de noms de tables Oracle (ex: ["AP_INVOICES", "GL_JE_HEADERS"])';
      case 'integrations':
        return '- "oicsIntegrations": Liste d\'intégrations (ex: ["FBDI_AP_INVOICES", "REST_GL_JOURNALS"])';
      case 'technical_specs':
        return '- "technicalSpecs": Détails techniques clés';
      case 'business_rules':
        return '- "businessRules": Règles métier identifiées';
      case 'api_endpoints':
        return '- "apiEndpoints": Liste des endpoints API trouvés';
      default:
        return `- "${field}": Informations pertinentes pour ce champ`;
    }
  }).join('\n');

  return basePrompt + '\n' + specificFields + '\n\nReste factuel et extrait uniquement ce qui est explicitement mentionné dans le document.';
}

/**
 * Analyse le contenu avec Gemini de manière adaptative
 */
export async function analyzeContent(text, filename) {
  if (!config.googleApiKey) {
    console.error('❌ GOOGLE_API_KEY manquante dans .env');
    return null;
  }

  // Parse le nom de fichier selon différentes conventions
  const parsed = parseFilename(filename);
  console.log(`📋 Fichier parsé: ID=${parsed.componentId}, Type=${parsed.docType || 'auto'}, Pattern=${parsed.pattern}`);
  if (parsed.componentName) {
    console.log(`   Nom extrait: ${parsed.componentName}`);
  }

  // Détection automatique du domaine et du type de document
  const domain = detectDomain(text, filename);
  const docType = detectDocumentType(text, filename, parsed);
  const componentId = parsed.componentId;
  const componentName = parsed.componentName;

  console.log(`🎯 Domaine détecté: ${domain} | Type: ${docType} | ID: ${componentId}`);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 8192,
    }
  });

  const prompt = buildGeminiPrompt(domain, docType, filename);

  // Limite le texte à ~500k caractères pour rester dans les limites de Gemini
  const safeText = text.substring(0, 500000);
  const fullPrompt = `${prompt}\n\n--- DÉBUT DOCUMENT (${filename}) ---\n${safeText}\n--- FIN DOCUMENT ---`;

  try {
    console.log(`🤖 Envoi à Gemini (${text.length} caractères)...`);
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    // Nettoie la réponse (enlève les éventuelles balises markdown)
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanedResponse);

    // Assure que l'ID et le nom sont présents (utilise ceux extraits du filename)
    if (!analysis.component_id) {
      analysis.component_id = componentId;
    }
    if (!analysis.component_name && componentName) {
      analysis.component_name = componentName;
    }

    return analysis;
  } catch (error) {
    console.error(`❌ Erreur Gemini:`, error.message);

    // Fallback : retourne une structure minimale
    return {
      component_id: componentId,
      component_name: componentName || path.basename(filename, path.extname(filename)),
      doc_type: docType,
      domain: domain,
      module: domain,
      summary: 'Analyse automatique impossible - document indexé avec métadonnées minimales',
      keywords: [],
      cufParams: [],
      oracleTables: [],
      oicsIntegrations: [],
      error: error.message
    };
  }
}
