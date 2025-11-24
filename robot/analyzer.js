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

RÈGLES STRICTES:
1. Retourne UNIQUEMENT un objet JSON valide
2. PAS de texte avant ou après le JSON
3. PAS de balises markdown (\`\`\`json)
4. PAS de virgules en fin de tableau ou d'objet
5. PAS de commentaires dans le JSON
6. Utilise UNIQUEMENT des guillemets doubles pour les clés et valeurs
7. Assure-toi que TOUTES les accolades et crochets sont correctement fermés

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
 * Cherche un identifiant de module Oracle dans le texte (AP018, AR123, GL001, FND055, etc.)
 * Retourne l'ID le plus probable ou null
 */
function findOracleModuleId(text) {
  // Patterns de modules Oracle courants
  const modulePatterns = [
    /\b(AP|AR|GL|PO|OM|FA|CM|PPM|HCM|PA|INV|BOM|WIP|FND|CE|JE|ZX|XLA|IGC|OKC|OKE|OKL|OKS|CST|GMF|HR|PER|BEN|PAY|TCA|HZ|OE|ONT|WSH|ZXV)\s*[-_]?\s*(\d{3,4})\b/gi,
    /\bcomposant\s+(AP|AR|GL|PO|OM|FA|CM|PPM|HCM|PA|INV|BOM|WIP|FND|CE|JE|ZX|XLA|IGC|OKC|OKE|OKL|OKS|CST|GMF|HR|PER|BEN|PAY|TCA|HZ|OE|ONT|WSH|ZXV)\s*[-_]?\s*(\d{3,4})/gi,
    /\b(AP|AR|GL|PO|OM|FA|CM|PPM|HCM|PA|INV|BOM|WIP|FND|CE|JE|ZX|XLA|IGC|OKC|OKE|OKL|OKS|CST|GMF|HR|PER|BEN|PAY|TCA|HZ|OE|ONT|WSH|ZXV)(\d{3,4})\b/gi
  ];

  const matches = [];
  for (const pattern of modulePatterns) {
    const found = [...text.matchAll(pattern)];
    found.forEach(match => {
      const module = match[1]?.toUpperCase();
      const number = match[2] || match[match.length - 1];
      if (module && number) {
        matches.push({ id: `${module}${number}`, position: match.index });
      }
    });
  }

  // Retourne le premier match trouvé (le plus tôt dans le document)
  if (matches.length > 0) {
    matches.sort((a, b) => a.position - b.position);
    return matches[0].id;
  }

  return null;
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

  // Cherche un ID de module Oracle dans le contenu (AP018, GL123, etc.)
  let componentId = parsed.componentId;
  const oracleModuleId = findOracleModuleId(text);

  if (oracleModuleId) {
    // Si un module Oracle est trouvé ET que l'ID parsé est un simple numéro (007, 0564, etc.)
    // alors on utilise le module Oracle
    if (/^\d+$/.test(componentId)) {
      console.log(`   🎯 Module Oracle détecté dans le contenu: ${oracleModuleId} (remplace ${componentId})`);
      componentId = oracleModuleId;
    } else {
      console.log(`   ℹ️  Module Oracle trouvé: ${oracleModuleId} (ID conservé: ${componentId})`);
    }
  }

  const componentName = parsed.componentName;
  const linkedTo = parsed.linkedTo;

  console.log(`🎯 Type: ${docType} | ID: ${componentId}`);
  console.log(`🔍 Analyse multi-aspect en cours...`);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',  // Force JSON valide
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

    // Nettoie la réponse (enlève les éventuelles balises markdown et texte superflu)
    let cleanedResponse = response.trim();

    // Enlève les balises markdown
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Extrait uniquement le JSON (entre première { et dernière })
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('Pas de JSON valide trouvé dans la réponse Gemini');
    }

    cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);

    // Parse le JSON avec gestion d'erreur améliorée
    let analysis;
    try {
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      // Si le parsing échoue, essaye de nettoyer et réparer le JSON
      console.warn(`⚠️  JSON malformé, tentative de réparation...`);
      console.warn(`   Erreur initiale: ${parseError.message}`);

      // Nettoyage agressif du JSON
      let fixedJson = cleanedResponse
        // Enlève les trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Remplace les guillemets simples par des doubles (sauf dans les valeurs)
        .replace(/'/g, '"')
        // Remplace les retours à la ligne dans les valeurs de chaînes par des espaces
        .replace(/:\s*"([^"]*)\n([^"]*)"/g, (match, p1, p2) => `: "${p1} ${p2}"`)
        // Enlève les retours chariot
        .replace(/\r/g, '')
        // Remplace les multiples espaces par un seul
        .replace(/\s+/g, ' ')
        // Enlève les espaces avant/après les : et ,
        .replace(/\s*:\s*/g, ':')
        .replace(/\s*,\s*/g, ',')
        // Corrige les virgules manquantes entre éléments de tableau
        .replace(/}(\s*){/g, '},{')
        .replace(/](\s*)\[/g, '],[');

      try {
        analysis = JSON.parse(fixedJson);
        console.log(`✅ JSON réparé avec succès`);
      } catch (secondError) {
        console.error(`❌ Impossible de parser le JSON même après nettoyage`);
        console.error(`   Position de l'erreur: ${secondError.message}`);

        // Sauvegarde le JSON malformé pour debug
        const debugPath = '/tmp/gemini-malformed.json';
        try {
          const fs = await import('fs-extra');
          await fs.writeFile(debugPath, fixedJson);
          console.error(`   JSON malformé sauvegardé: ${debugPath}`);
        } catch (e) {
          // Ignore si impossible de sauvegarder
        }

        console.error(`   Extrait du JSON (position ${parseError.message.match(/\d+/)?.[0] || '?'}):`);
        const errorPos = parseInt(parseError.message.match(/\d+/)?.[0] || '0');
        const start = Math.max(0, errorPos - 200);
        const end = Math.min(cleanedResponse.length, errorPos + 200);
        console.error(`   ...${cleanedResponse.substring(start, end)}...`);

        throw secondError;
      }
    }

    // Assure que l'ID et le nom sont présents (utilise ceux extraits du filename)
    if (!analysis.component_id) {
      analysis.component_id = componentId;
    }
    if (!analysis.component_name && componentName) {
      analysis.component_name = componentName;
    }

    // Ajoute le domaine détecté
    analysis.domain = domain;

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

    console.log(`✅ Analyse terminée - Domaine: ${analysis.domain}`);

    return analysis;
  } catch (error) {
    console.error(`❌ Erreur Gemini:`, error.message);

    // Fallback : retourne une structure minimale
    return {
      component_id: componentId,
      component_name: componentName || path.basename(filename, path.extname(filename)),
      doc_type: docType,
      domain: domain || 'General',
      summary: 'Analyse automatique impossible - document indexé avec métadonnées minimales',
      keywords: [],
      aspects: {},
      linkedTo: linkedTo || null,
      error: error.message
    };
  }
}
