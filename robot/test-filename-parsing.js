#!/usr/bin/env node

/**
 * Test du parsing de noms de fichiers
 * Vérifie que les différents formats sont correctement reconnus
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse le nom de fichier selon différentes conventions de nommage
 */
function parseFilename(filename) {
  const baseName = path.basename(filename, path.extname(filename));

  // Pattern 1: Format EVO.FINA.XXX_TYPE_XXXX_Description
  const evoPattern = /^(?:EVO\.)?(?:FINA\.)?(?:\d+_)?([A-Z]+)_(\d{3,4})_(.+)$/i;
  const evoMatch = baseName.match(evoPattern);

  if (evoMatch) {
    const docType = evoMatch[1].toUpperCase();
    const componentId = evoMatch[2];
    const description = evoMatch[3].replace(/_/g, ' ');

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
      componentName: null,
      docType: standardMatch[2].toUpperCase(),
      pattern: 'STANDARD'
    };
  }

  return {
    componentId: 'UNKNOWN',
    componentName: baseName,
    docType: null,
    pattern: 'UNKNOWN'
  };
}

// Tests
console.log('🧪 Test du parsing de noms de fichiers\n');

const testFiles = [
  'EVO.FINA.001_SET_0549_Interface_Référentiel_Bancaire_CLOUD.docx',
  'EVO.FINA.001_SFD_0549_Interface_Référentiel_Bancaire_CLOUD.docx',
  'EVO.FINA.001_STD_0549_Interface_Référentiel_Bancaire_CLOUD.docx',
  'AP020_SETUP.docx',
  'GL018_SFD.pdf',
  'PO015_STD_Commandes_Achat.docx',
];

testFiles.forEach(filename => {
  const result = parseFilename(filename);
  console.log(`📄 ${filename}`);
  console.log(`   ├─ Pattern: ${result.pattern}`);
  console.log(`   ├─ ID: ${result.componentId}`);
  console.log(`   ├─ Type: ${result.docType || '(auto-detect)'}`);
  console.log(`   └─ Nom: ${result.componentName || '(à extraire du contenu)'}`);
  console.log('');
});

console.log('✅ Tests terminés\n');
