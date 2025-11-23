import { OracleComponent, DocType, Dependency } from './types';

export const MOCK_COMPONENTS: OracleComponent[] = [
  {
    id: 'AP020',
    name: 'Gestion des Factures Fournisseurs',
    documents: {
      [DocType.SFD]: { type: DocType.SFD, uploaded: true, lastModified: '2024-10-15T10:30:00Z' },
      [DocType.STD]: { type: DocType.STD, uploaded: true, lastModified: '2024-10-20T14:20:00Z' },
      [DocType.SETUP]: { type: DocType.SETUP, uploaded: true, lastModified: '2024-10-25T09:15:00Z' }
    },
    cufParams: [
      { param: 'AP_AUTO_VALIDATE', value: 'Y', description: 'Validation automatique des factures', sourceDocument: 'SETUP' },
      { param: 'AP_TOLERANCE_AMOUNT', value: '100', description: 'Montant de tolérance en EUR', sourceDocument: 'SETUP' }
    ],
    oracleTables: ['AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'AP_SUPPLIERS'],
    oicsIntegrations: ['OICS_AP_INVOICE_IMPORT', 'OICS_AP_SUPPLIER_SYNC'],
    lastIndexed: '2024-11-07T15:30:00Z'
  },
  {
    id: 'GL018',
    name: 'Comptabilisation Automatique',
    documents: {
      [DocType.SFD]: { type: DocType.SFD, uploaded: true, lastModified: '2024-11-01T08:00:00Z' },
      [DocType.STD]: { type: DocType.STD, uploaded: false },
      [DocType.SETUP]: { type: DocType.SETUP, uploaded: true, lastModified: '2024-11-02T09:00:00Z' }
    },
    cufParams: [
      { param: 'GL_AUTO_POST', value: 'N', description: 'Post automatique dans le GL', sourceDocument: 'SETUP' }
    ],
    oracleTables: ['GL_JE_HEADERS', 'GL_JE_LINES', 'GL_LEDGERS'],
    oicsIntegrations: ['OICS_GL_JOURNAL_IMPORT'],
    lastIndexed: '2024-11-08T10:00:00Z'
  },
  {
    id: 'PO015',
    name: 'Création Commandes Achat',
    documents: {
      [DocType.SFD]: { type: DocType.SFD, uploaded: true, lastModified: '2024-09-15T10:30:00Z' },
      [DocType.STD]: { type: DocType.STD, uploaded: true, lastModified: '2024-09-20T14:20:00Z' },
      [DocType.SETUP]: { type: DocType.SETUP, uploaded: false }
    },
    cufParams: [],
    oracleTables: ['PO_HEADERS_ALL', 'PO_LINES_ALL'],
    oicsIntegrations: [],
    lastIndexed: '2024-11-05T11:30:00Z'
  },
  {
    id: 'AR025',
    name: 'Facturation Clients',
    documents: {
      [DocType.SFD]: { type: DocType.SFD, uploaded: false },
      [DocType.STD]: { type: DocType.STD, uploaded: false },
      [DocType.SETUP]: { type: DocType.SETUP, uploaded: true, lastModified: '2024-10-05T11:00:00Z' }
    },
    cufParams: [
      { param: 'AR_ALLOW_OVERAPPLICATION', value: 'Y', description: 'Autoriser sur-application', sourceDocument: 'SETUP' }
    ],
    oracleTables: ['RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL'],
    oicsIntegrations: ['OICS_AR_INVOICE_IMPORT'],
    lastIndexed: '2024-11-01T09:30:00Z'
  },
    {
    id: 'INV001',
    name: 'Gestion des Stocks',
    documents: {
      [DocType.SFD]: { type: DocType.SFD, uploaded: true, lastModified: '2024-10-10T10:00:00Z' },
      [DocType.STD]: { type: DocType.STD, uploaded: true, lastModified: '2024-10-12T14:00:00Z' },
      [DocType.SETUP]: { type: DocType.SETUP, uploaded: true, lastModified: '2024-10-13T09:00:00Z' }
    },
    cufParams: [],
    oracleTables: ['MTL_SYSTEM_ITEMS_B', 'MTL_MATERIAL_TRANSACTIONS'],
    oicsIntegrations: ['OICS_INV_TRANS_IMPORT'],
    lastIndexed: '2024-11-06T14:00:00Z'
  }
];

export const MOCK_DEPENDENCIES: Dependency[] = [
  { sourceComponent: 'PO015', targetComponent: 'AP020', type: 'prerequisite' },
  { sourceComponent: 'AP020', targetComponent: 'GL018', type: 'prerequisite' },
  { sourceComponent: 'AR025', targetComponent: 'GL018', type: 'prerequisite' },
  { sourceComponent: 'INV001', targetComponent: 'GL018', type: 'accounting' },
  { sourceComponent: 'PO015', targetComponent: 'INV001', type: 'flow' },
];
