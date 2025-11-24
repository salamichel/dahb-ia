import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import fs from 'fs-extra';
import crypto from 'crypto';
import { config } from './config.js';

/**
 * Génère un hash SHA-256 pour détecter les modifications de fichiers
 */
export function generateFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Parse un document DOCX et extrait le texte brut
 */
export async function parseDocx(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ path: filePath });

    return {
      text: result.value,
      hash: generateFileHash(buffer),
      wordCount: result.value.split(/\s+/).length,
      success: true
    };
  } catch (error) {
    console.error(`❌ Erreur parsing DOCX ${filePath}:`, error.message);
    return { text: '', hash: '', wordCount: 0, success: false, error: error.message };
  }
}

/**
 * Parse un document PDF et extrait le texte
 */
export async function parsePdf(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      hash: generateFileHash(buffer),
      wordCount: data.text.split(/\s+/).length,
      pages: data.numpages,
      success: true
    };
  } catch (error) {
    console.error(`❌ Erreur parsing PDF ${filePath}:`, error.message);
    return { text: '', hash: '', wordCount: 0, pages: 0, success: false, error: error.message };
  }
}

/**
 * Parse un fichier texte brut
 */
export async function parseTxt(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const text = buffer.toString('utf-8');

    return {
      text,
      hash: generateFileHash(buffer),
      wordCount: text.split(/\s+/).length,
      success: true
    };
  } catch (error) {
    console.error(`❌ Erreur parsing TXT ${filePath}:`, error.message);
    return { text: '', hash: '', wordCount: 0, success: false, error: error.message };
  }
}

/**
 * Détecte le type de fichier et applique le parser approprié
 */
export async function parseDocument(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();

  // Vérification de la taille du fichier
  const stats = await fs.stat(filePath);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB > config.maxFileSizeMB) {
    console.warn(`⚠️  Fichier trop volumineux (${sizeMB.toFixed(2)}MB > ${config.maxFileSizeMB}MB): ${filePath}`);
    return { text: '', hash: '', wordCount: 0, success: false, error: 'File too large' };
  }

  switch (ext) {
    case 'docx':
      return parseDocx(filePath);
    case 'pdf':
      return parsePdf(filePath);
    case 'txt':
      return parseTxt(filePath);
    default:
      console.warn(`⚠️  Type de fichier non supporté: ${ext}`);
      return { text: '', hash: '', wordCount: 0, success: false, error: 'Unsupported file type' };
  }
}
