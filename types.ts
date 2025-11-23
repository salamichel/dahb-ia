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

export interface CufParam {
  param: string;
  value: string;
  description: string;
  sourceDocument: string;
}

export interface Dependency {
  sourceComponent: string;
  targetComponent: string;
  type: string;
}

export interface OracleComponent {
  id: string;
  name: string;
  summary?: string;
  documents: Record<string, DocumentMetadata>;
  cufParams: CufParam[];
  oracleTables: string[];
  oicsIntegrations: string[];
  lastIndexed: string;
}

export interface SearchFilters {
  query: string;
  cufParam?: string;
  table?: string;
  oics?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}