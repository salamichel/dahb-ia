/**
 * Service pour communiquer avec l'API Pattern Manager
 */

const API_BASE_URL = 'http://localhost:3001/api';

export interface Pattern {
  name: string;
  enabled: boolean;
  regex: string;
  groups: {
    componentId?: number;
    componentName?: number;
    docType?: number;
  };
  typeMapping?: Record<string, string>;
  examples?: string[];
  priority?: number;
  notes?: string;
}

export interface PatternsConfig {
  patterns: Pattern[];
  relationships?: any;
  docTypeKeywords?: Record<string, string[]>;
  globalSettings?: any;
}

export interface TestResult {
  pattern: string;
  matched: boolean;
  componentId?: string;
  componentName?: string;
  docType?: string;
  linkedTo?: any;
}

/**
 * Récupère tous les patterns
 */
export async function fetchPatterns(): Promise<PatternsConfig> {
  const response = await fetch(`${API_BASE_URL}/patterns`);
  if (!response.ok) {
    throw new Error('Failed to fetch patterns');
  }
  return response.json();
}

/**
 * Ajoute un nouveau pattern
 */
export async function createPattern(pattern: Pattern): Promise<PatternsConfig> {
  const response = await fetch(`${API_BASE_URL}/patterns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pattern)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create pattern');
  }
  return response.json();
}

/**
 * Met à jour un pattern existant
 */
export async function updatePattern(index: number, pattern: Partial<Pattern>): Promise<PatternsConfig> {
  const response = await fetch(`${API_BASE_URL}/patterns/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pattern)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update pattern');
  }
  return response.json();
}

/**
 * Supprime un pattern
 */
export async function deletePattern(index: number): Promise<PatternsConfig> {
  const response = await fetch(`${API_BASE_URL}/patterns/${index}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete pattern');
  }
  return response.json();
}

/**
 * Change la priorité d'un pattern (monte ou descend)
 */
export async function changePriority(index: number, direction: 'up' | 'down'): Promise<PatternsConfig> {
  const response = await fetch(`${API_BASE_URL}/patterns/${index}/priority`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change priority');
  }
  return response.json();
}

/**
 * Teste un nom de fichier avec les patterns configurés
 */
export async function testFilename(filename: string): Promise<TestResult> {
  const response = await fetch(`${API_BASE_URL}/patterns/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to test filename');
  }
  return response.json();
}
