#!/usr/bin/env node

/**
 * Test complet du système de patterns configurables
 * Permet de valider que tous les formats de noms de fichiers sont correctement reconnus
 */

import { parseFilenameWithPatterns, listPatterns } from './pattern-matcher.js';

console.log('🧪 Test du système de patterns configurables\n');

// Liste tous les patterns configurés
const patterns = await listPatterns();
console.log('📋 Patterns configurés :\n');
patterns.forEach((p, i) => {
  console.log(`${i + 1}. ${p.name} ${p.enabled ? '✅' : '❌'}`);
  if (p.examples && p.examples.length > 0) {
    p.examples.forEach(ex => console.log(`   Exemple: ${ex}`));
  }
  console.log('');
});

// Fichiers de test
const testFiles = [
  // Format EVO.FINA
  'EVO.FINA.001_SET_0549_Interface_Référentiel_Bancaire_CLOUD.docx',
  'EVO.FINA.001_SFD_0549_Interface_Référentiel_Bancaire_CLOUD.docx',
  'FINA.001_STD_0549_Interface_Bancaire.docx',

  // Format INI.FIN.FDJ
  'INI.FIN.FDJ.001_SFD_0586_Calcul_Points_Controle_NRM.docx',
  'FIN.FDJ.001_STD_0586_Calcul_Points.pdf',

  // Format Type-first (MOP, FN)
  'MOP_Installation_OIC_FDJ_AP015.docx',
  'FN_Fiche_Technique_GL018.pdf',
  'INSTALL_Config_Oracle_AP020.docx',

  // Format Standard Oracle
  'AP020_SETUP.docx',
  'GL018_SFD.pdf',
  'AR025_STD.docx',

  // Cas limites
  'specification_fonctionnelle_0549.pdf',
  'document_technique_1234.docx',
  'note_setup.txt',
];

console.log('\n📄 Test des fichiers :\n');
console.log('─'.repeat(80) + '\n');

for (const filename of testFiles) {
  const result = await parseFilenameWithPatterns(filename);

  console.log(`📄 ${filename}`);
  console.log(`   ├─ Pattern: ${result.pattern}`);
  console.log(`   ├─ Matched: ${result.matched ? '✅' : '❌'}`);
  console.log(`   ├─ ID: ${result.componentId}`);
  console.log(`   ├─ Type: ${result.docType || '(auto-detect)'}`);
  console.log(`   ├─ Nom: ${result.componentName || '(à extraire du contenu)'}`);

  if (result.linkedTo) {
    console.log(`   └─ 🔗 Lié à: ${result.linkedTo.mainComponentId} (${result.linkedTo.linkType})`);
  } else {
    console.log(`   └─ 🔗 Standalone`);
  }

  console.log('');
}

console.log('─'.repeat(80));
console.log('✅ Tests terminés\n');

// Statistiques
const matched = testFiles.filter(async f => {
  const r = await parseFilenameWithPatterns(f);
  return r.matched;
}).length;

console.log(`📊 Statistiques:`);
console.log(`   Total: ${testFiles.length} fichiers`);
console.log(`   Matched: ${matched}/${testFiles.length}`);
console.log('');
