import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import path from 'path';
import { parseFilenameWithPatterns, detectDocTypeFromKeywords } from './pattern-matcher.js';

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

    if (maxScore < score) {
      maxScore = score;
      detectedDomain = domainName;
    }
  }

  return detectedDomain;
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
- "component_id": Identifiant du composant (cherche dans le texte des patterns comme AP020, GL018, 0549, etc.)
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
 * Utilise le système de patterns configurables (naming-patterns.json)
 */
export async function analyzeContent(text, filename) {
  if (!config.googleApiKey) {
    console.error('❌ GOOGLE_API_KEY manquante dans .env');
    return null;
  }

  // Parse le nom de fichier avec le système de patterns configurables
  const parsed = await parseFilenameWithPatterns(filename);

  console.log(`📋 Fichier parsé: ID=${parsed.componentId}, Type=${parsed.docType || 'auto'}, Pattern=${parsed.pattern}`);
  if (parsed.componentName) {
    console.log(`   Nom extrait: ${parsed.componentName}`);
  }
  if (parsed.linkedTo) {
    console.log(`   🔗 Lié au composant: ${parsed.linkedTo.mainComponentId} (${parsed.linkedTo.linkType})`);
  }

  // Détection automatique du domaine
  const domain = detectDomain(text, filename);

  // Si le type n'est pas trouvé par pattern, on utilise les mots-clés
  let docType = parsed.docType;
  if (!docType) {
    docType = await detectDocTypeFromKeywords(text, filename);
    console.log(`   🔍 Type détecté par mots-clés: ${docType}`);
  }

  const componentId = parsed.componentId;
  const componentName = parsed.componentName;
  const linkedTo = parsed.linkedTo;

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

    // Ajoute les informations de liaison si présentes
    if (linkedTo) {
      analysis.linkedTo = linkedTo;
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
      linkedTo: linkedTo || null,
      error: error.message
    };
  }
}
