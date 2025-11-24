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
 * Construit le prompt Gemini pour extraction multi-aspect
 * Un document peut contenir plusieurs aspects (Oracle ERP + BI Publisher + ETL, etc.)
 */
function buildMultiAspectPrompt(docType, filename) {
  return `
Tu es un expert en analyse de documentation technique multi-domaine.
Analyse le document fourni et retourne UNIQUEMENT un JSON valide (sans balises markdown).

IMPORTANT: Un composant peut avoir PLUSIEURS ASPECTS techniques (Oracle ERP, BI Publisher, ETL, SaaS, etc.)
Tu dois identifier TOUS les aspects présents dans le document.

Structure JSON attendue:
{
  "component_id": "Identifiant du composant (ex: AP015, 0549, GL018)",
  "component_name": "Nom descriptif du composant",
  "doc_type": "${docType}",
  "summary": "Résumé exécutif en 2-3 phrases",
  "keywords": ["liste", "de", "mots-clés", "techniques"],

  "aspects": {
    "Oracle ERP Cloud": {
      "detected": true/false,
      "module": "Nom du module (GL, AP, AR, etc.)",
      "cufParams": [{"param": "nom", "value": "valeur", "description": "desc"}],
      "oracleTables": ["AP_INVOICES", "GL_JE_HEADERS"],
      "oicsIntegrations": ["FBDI_AP_INVOICES", "REST_GL_JOURNALS"],
      "notes": "Notes spécifiques Oracle"
    },

    "BI Publisher": {
      "detected": true/false,
      "reports": [{"name": "Nom rapport", "type": "RTF/PDF", "description": "Description"}],
      "dataModels": [{"name": "Nom", "query": "SQL/Requête", "description": "Description"}],
      "parameters": [{"name": "Nom", "type": "Type", "defaultValue": "Valeur"}],
      "notes": "Notes spécifiques BI Publisher"
    },

    "ETL / Informatica / ODI": {
      "detected": true/false,
      "tool": "Informatica / ODI / OIC / Autre",
      "mappings": [{"name": "Nom mapping", "source": "Source", "target": "Target", "description": "Description"}],
      "transformations": [{"name": "Nom", "type": "Type", "description": "Description"}],
      "schedules": [{"name": "Nom", "frequency": "Fréquence", "description": "Description"}],
      "notes": "Notes spécifiques ETL"
    },

    "SaaS / JDV": {
      "detected": true/false,
      "platform": "Nom plateforme",
      "configurations": [{"parameter": "Nom", "value": "Valeur", "description": "Description"}],
      "notes": "Notes spécifiques SaaS"
    },

    "Tradeshift": {
      "detected": true/false,
      "apiEndpoints": [{"endpoint": "URL", "method": "GET/POST", "description": "Description"}],
      "workflows": [{"name": "Nom", "steps": "Étapes", "description": "Description"}],
      "notes": "Notes spécifiques Tradeshift"
    },

    "C2FO": {
      "detected": true/false,
      "integrationPoints": [{"name": "Nom", "type": "Type", "description": "Description"}],
      "notes": "Notes spécifiques C2FO"
    },

    "IBM Cotre / Cognos": {
      "detected": true/false,
      "components": [{"name": "Nom", "type": "Type", "description": "Description"}],
      "notes": "Notes spécifiques IBM"
    },

    "RBM-NRM": {
      "detected": true/false,
      "businessRules": [{"rule": "Nom", "description": "Description"}],
      "dataModels": [{"name": "Nom", "description": "Description"}],
      "notes": "Notes spécifiques RBM"
    },

    "Delphes-OeBS": {
      "detected": true/false,
      "migrationNotes": "Notes de migration",
      "technicalSpecs": [{"spec": "Nom", "description": "Description"}],
      "notes": "Notes spécifiques Delphes"
    }
  }
}

INSTRUCTIONS:
1. Pour chaque aspect, mets "detected": true UNIQUEMENT si le document mentionne explicitement cet aspect
2. Si "detected": false, tu peux omettre les autres champs de cet aspect
3. Extrait TOUTES les informations techniques pertinentes pour chaque aspect détecté
4. Sois factuel : n'invente rien, extrait uniquement ce qui est explicitement mentionné
5. Un même composant peut avoir plusieurs aspects (ex: AP015 peut avoir Oracle ERP + BI Publisher + ETL)
`;
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

  console.log(`🎯 Type: ${docType} | ID: ${componentId}`);
  console.log(`🔍 Analyse multi-aspect en cours...`);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 8192,
    }
  });

  const prompt = buildMultiAspectPrompt(docType, filename);

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

    // Compte et affiche les aspects détectés
    if (analysis.aspects) {
      const detectedAspects = Object.entries(analysis.aspects)
        .filter(([name, data]) => data.detected)
        .map(([name]) => name);

      if (detectedAspects.length > 0) {
        console.log(`✨ Aspects détectés: ${detectedAspects.join(', ')}`);
      }
    }

    return analysis;
  } catch (error) {
    console.error(`❌ Erreur Gemini:`, error.message);

    // Fallback : retourne une structure minimale
    return {
      component_id: componentId,
      component_name: componentName || path.basename(filename, path.extname(filename)),
      doc_type: docType,
      summary: 'Analyse automatique impossible - document indexé avec métadonnées minimales',
      keywords: [],
      aspects: {},
      linkedTo: linkedTo || null,
      error: error.message
    };
  }
}
