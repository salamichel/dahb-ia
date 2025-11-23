import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration centrale du robot v2
 * Gère les différents domaines métier avec leurs spécificités
 */
export const config = {
  // Dossiers à surveiller (relatifs au répertoire robot/)
  watchFolders: process.env.WATCH_FOLDERS?.split(',') || ['./documents'],

  // Base de données de sortie (compatible avec l'interface React)
  outputDb: process.env.OUTPUT_DB || path.join(__dirname, '..', 'metadata.json'),

  // API Gemini
  googleApiKey: process.env.GOOGLE_API_KEY,

  // Options de traitement
  batchDelay: parseInt(process.env.BATCH_DELAY_MS || '500'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),

  // Domaines métier supportés avec leurs mots-clés de détection
  domains: {
    'Oracle ERP Cloud': {
      keywords: ['oracle', 'erp', 'cloud', 'fusion', 'gl', 'ap', 'ar', 'po', 'om', 'hcm', 'ledger'],
      modules: ['GL', 'AP', 'AR', 'PO', 'OM', 'HCM', 'FA', 'CM', 'PPM'],
      extractFields: ['setup_elements', 'integrations', 'value_sets', 'oracle_tables']
    },
    'Delphes-OeBS': {
      keywords: ['delphes', 'oebs', 'e-business suite', 'r12'],
      modules: ['Delphes Core', 'Legacy Integration'],
      extractFields: ['technical_specs', 'migration_notes']
    },
    'RBM-NRM': {
      keywords: ['rbm', 'nrm', 'resource', 'natural resource'],
      modules: ['RBM Core', 'NRM Analytics'],
      extractFields: ['business_rules', 'data_models']
    },
    'BI Publisher': {
      keywords: ['bip', 'bi publisher', 'report', 'rtf', 'data model'],
      modules: ['Reports', 'Data Models', 'Templates'],
      extractFields: ['report_structure', 'parameters', 'queries']
    },
    'ETL SI Finance': {
      keywords: ['etl', 'odi', 'oic', 'integration', 'finance'],
      modules: ['ODI', 'OIC', 'FBDI', 'Data Integration'],
      extractFields: ['mappings', 'transformations', 'schedules']
    },
    'IBM Cotre': {
      keywords: ['ibm', 'cotre', 'cognos'],
      modules: ['IBM Core', 'Cognos'],
      extractFields: ['technical_components']
    },
    'Tradeshift': {
      keywords: ['tradeshift', 'procurement', 'supplier'],
      modules: ['Supplier Network', 'Integration'],
      extractFields: ['api_endpoints', 'workflows']
    },
    'C2FO': {
      keywords: ['c2fo', 'working capital', 'financing'],
      modules: ['C2FO Core'],
      extractFields: ['integration_points']
    },
    'Abacus': {
      keywords: ['abacus', 'abajus'],
      modules: ['Abacus Core'],
      extractFields: ['specifications']
    }
  },

  // Types de documents reconnus (mappés vers les types existants de l'interface)
  documentTypes: {
    'SETUP': ['setup', 'config', 'configuration', 'paramétrage', 'param'],
    'SFD': ['sfd', 'spec fonctionnelle', 'fonctionnelle', 'functional spec'],
    'STD': ['std', 'spec technique', 'technique', 'technical spec'],
    'FN': ['fn', 'fiche', 'note'],
    'MOP': ['mop', 'installation', 'deploy', 'déploiement']
  }
};

export default config;
