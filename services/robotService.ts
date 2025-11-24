/**
 * Service pour interagir avec le Robot V2
 * Gère l'upload de fichiers et la récupération des métadonnées
 */

const UPLOAD_API_BASE = 'http://localhost:3002';

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  files?: Array<{
    name: string;
    size: number;
  }>;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface RobotStatus {
  success: boolean;
  uploadDir?: string;
  totalFiles?: number;
  files?: Array<{
    name: string;
    size: number;
    created: string;
    modified: string;
  }>;
  error?: string;
}

/**
 * Upload un ou plusieurs fichiers vers le robot
 */
export async function uploadFilesToRobot(
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
  try {
    const formData = new FormData();

    // Filtrer les fichiers temporaires
    const validFiles = files.filter(file => {
      if (file.name.startsWith('~$')) {
        console.warn(`Fichier temporaire ignoré: ${file.name}`);
        if (onProgress) {
          onProgress({
            fileName: file.name,
            progress: 100,
            status: 'error',
            error: 'Fichier temporaire ignoré'
          });
        }
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return {
        success: false,
        error: 'Aucun fichier valide à uploader (fichiers temporaires filtrés)'
      };
    }

    // Ajouter tous les fichiers au FormData
    validFiles.forEach(file => {
      formData.append('files', file);
    });

    // Simuler la progression (XMLHttpRequest pour avoir onProgress)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Suivi de la progression
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          validFiles.forEach(file => {
            onProgress({
              fileName: file.name,
              progress,
              status: 'uploading'
            });
          });
        }
      });

      // Succès
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response: UploadResponse = JSON.parse(xhr.responseText);

          if (onProgress) {
            validFiles.forEach(file => {
              onProgress({
                fileName: file.name,
                progress: 100,
                status: 'success'
              });
            });
          }

          resolve(response);
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        }
      });

      // Erreur
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      // Envoi
      xhr.open('POST', `${UPLOAD_API_BASE}/upload`);
      xhr.send(formData);
    });

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Récupère le statut du dossier documents du robot
 */
export async function getRobotStatus(): Promise<RobotStatus> {
  try {
    const response = await fetch(`${UPLOAD_API_BASE}/status`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Status fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch status'
    };
  }
}

/**
 * Récupère les métadonnées depuis metadata.json
 */
export async function getRobotMetadata() {
  try {
    const response = await fetch(`${UPLOAD_API_BASE}/metadata`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return {
      components: [],
      lastUpdated: new Date().toISOString(),
      version: '2.0'
    };
  }
}

/**
 * Supprime un fichier du dossier documents
 */
export async function deleteFileFromRobot(filename: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${UPLOAD_API_BASE}/files/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Vérifie si l'API du robot est accessible
 */
export async function checkRobotAPI(): Promise<boolean> {
  try {
    const response = await fetch(`${UPLOAD_API_BASE}/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
    });
    return response.ok;
  } catch (error) {
    console.error('Robot API check failed:', error);
    return false;
  }
}
