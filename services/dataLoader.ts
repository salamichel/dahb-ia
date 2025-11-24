import { OracleComponent } from '../types';
import { MOCK_COMPONENTS } from '../constants';

/**
 * Service de chargement des données
 * Tente de charger les données du robot v2, sinon utilise les données mock
 */

interface RobotDatabase {
  components: OracleComponent[];
  lastUpdated: string;
  version: string;
}

/**
 * Charge les composants depuis le robot v2 (metadata.json)
 * ou retourne les données mock en fallback
 */
export async function loadComponents(): Promise<OracleComponent[]> {
  try {
    // Tente de charger le fichier metadata.json généré par le robot
    const response = await fetch('/metadata.json');

    if (response.ok) {
      const data: RobotDatabase = await response.json();

      if (data.components && Array.isArray(data.components) && data.components.length > 0) {
        console.log(`✅ Données du robot v2 chargées (${data.components.length} composants)`);
        return data.components;
      }
    }
  } catch (error) {
    console.warn('⚠️  Impossible de charger metadata.json, utilisation des données mock');
  }

  // Fallback sur les données mock
  console.log('📦 Utilisation des données mock');
  return MOCK_COMPONENTS;
}

/**
 * Surveille les changements dans metadata.json
 * et appelle le callback quand des mises à jour sont détectées
 */
export function watchForUpdates(
  callback: (components: OracleComponent[]) => void,
  intervalMs: number = 5000
): () => void {
  let lastUpdate = '';

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/metadata.json');
      if (response.ok) {
        const data: RobotDatabase = await response.json();

        if (data.lastUpdated !== lastUpdate) {
          lastUpdate = data.lastUpdated;
          callback(data.components);
          console.log(`🔄 Données mises à jour (${new Date(data.lastUpdated).toLocaleString()})`);
        }
      }
    } catch (error) {
      // Silencieux - le fichier peut ne pas exister
    }
  };

  // Vérification initiale
  checkForUpdates();

  // Polling régulier
  const intervalId = setInterval(checkForUpdates, intervalMs);

  // Retourne une fonction de cleanup
  return () => clearInterval(intervalId);
}
