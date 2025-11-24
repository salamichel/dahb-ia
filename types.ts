export enum DocType {
  SFD = 'SFD',
  STD = 'STD',
  SETUP = 'SETUP',
  FN = 'FN',
  MOP = 'MOP_INSTALLATION'
}

export enum ComponentStatus {
  COMPLETE = 'Complete',
  PARTIAL = 'Partial',
  MISSING = 'Missing'
}

export interface DocumentMetadata {
  type: DocType;
  uploaded: boolean;
  lastModified?: string;
  filePath?: string;
}

// ============= ASPECTS (Multi-domaine) =============

export interface OracleERPAspect {
  detected: boolean;
  module?: string;
  cufParams?: Array<{
    param: string;
    value: string;
    description: string;
  }>;
  oracleTables?: string[];
  oicsIntegrations?: string[];
  notes?: string;
}

export interface BIPublisherAspect {
  detected: boolean;
  reports?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  dataModels?: Array<{
    name: string;
    query?: string;
    description: string;
  }>;
  parameters?: Array<{
    name: string;
    type: string;
    defaultValue?: string;
  }>;
  notes?: string;
}

export interface ETLAspect {
  detected: boolean;
  tool?: string; // Informatica, ODI, OIC, etc.
  mappings?: Array<{
    name: string;
    source: string;
    target: string;
    description: string;
  }>;
  transformations?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  schedules?: Array<{
    name: string;
    frequency: string;
    description: string;
  }>;
  notes?: string;
}

export interface SaaSAspect {
  detected: boolean;
  platform?: string;
  configurations?: Array<{
    parameter: string;
    value: string;
    description: string;
  }>;
  notes?: string;
}

export interface TradeshiftAspect {
  detected: boolean;
  apiEndpoints?: Array<{
    endpoint: string;
    method: string;
    description: string;
  }>;
  workflows?: Array<{
    name: string;
    steps?: string;
    description: string;
  }>;
  notes?: string;
}

export interface C2FOAspect {
  detected: boolean;
  integrationPoints?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  notes?: string;
}

export interface IBMAspect {
  detected: boolean;
  components?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  notes?: string;
}

export interface RBMAspect {
  detected: boolean;
  businessRules?: Array<{
    rule: string;
    description: string;
  }>;
  dataModels?: Array<{
    name: string;
    description: string;
  }>;
  notes?: string;
}

export interface DelphesAspect {
  detected: boolean;
  migrationNotes?: string;
  technicalSpecs?: Array<{
    spec: string;
    description: string;
  }>;
  notes?: string;
}

export interface ComponentAspects {
  'Oracle ERP Cloud'?: OracleERPAspect;
  'BI Publisher'?: BIPublisherAspect;
  'ETL / Informatica / ODI'?: ETLAspect;
  'SaaS / JDV'?: SaaSAspect;
  'Tradeshift'?: TradeshiftAspect;
  'C2FO'?: C2FOAspect;
  'IBM Cotre / Cognos'?: IBMAspect;
  'RBM-NRM'?: RBMAspect;
  'Delphes-OeBS'?: DelphesAspect;
}

// ============= COMPONENT (Générique, multi-domaine) =============

export interface Component {
  id: string;
  name: string;
  summary?: string;
  documents: Record<string, DocumentMetadata>;
  keywords?: string[];
  lastIndexed: string;

  // Structure multi-aspect
  aspects: ComponentAspects;

  // Legacy fields (pour compatibilité backward avec données existantes)
  cufParams?: Array<{ param: string; value: string; description: string; sourceDocument: string }>;
  oracleTables?: string[];
  oicsIntegrations?: string[];
  domain?: string;
  module?: string;
}

// Alias pour compatibilité backward
export type OracleComponent = Component;

// ============= DEPENDENCY =============

export interface Dependency {
  sourceComponent: string;
  targetComponent: string;
  type: string;
}

// ============= SEARCH =============

export interface SearchFilters {
  query: string;
  cufParam?: string;
  table?: string;
  oics?: string;
}

// ============= CHAT =============

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Legacy CufParam for backward compatibility
export interface CufParam {
  param: string;
  value: string;
  description: string;
  sourceDocument: string;
}
