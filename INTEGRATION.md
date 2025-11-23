# 🔗 Integration Guide - Robot V2 + Interface Web

Ce document explique comment le robot v2 et l'interface web fonctionnent ensemble.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DAHB IA Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐         ┌──────────────────────┐  │
│  │   Robot V2          │         │   React Interface    │  │
│  │   (Node.js)         │         │   (Vite + React)     │  │
│  ├─────────────────────┤         ├──────────────────────┤  │
│  │                     │         │                      │  │
│  │ • Chokidar Watcher  │         │ • Dashboard          │  │
│  │ • Gemini Analyzer   │ ──────> │ • Search             │  │
│  │ • DOCX/PDF Parser   │  JSON   │ • Dependencies       │  │
│  │ • Database Writer   │         │ • AI Chat            │  │
│  │                     │         │ • Auto-refresh       │  │
│  └─────────────────────┘         └──────────────────────┘  │
│            │                              ▲                │
│            │                              │                │
│            ▼                              │                │
│      ┌─────────────────────────────────────────┐          │
│      │        metadata.json (shared)           │          │
│      │  • Component definitions                │          │
│      │  • Documents metadata                   │          │
│      │  • Extracted CUF params, tables, etc.   │          │
│      └─────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Flux de données

### 1. Indexation (Robot → JSON)

```javascript
// 1. Utilisateur dépose un fichier dans robot/documents/
//    Exemple: AP020_SETUP.docx

// 2. Chokidar détecte le fichier
watcher.on('add', processFile);

// 3. Parser extrait le texte
const { text, hash } = await parseDocument(filePath);

// 4. Gemini analyse le contenu
const analysis = await analyzeContent(text, filename);
// Résultat: {
//   component_id: "AP020",
//   doc_type: "SETUP",
//   domain: "Oracle ERP Cloud",
//   cufParams: [...],
//   ...
// }

// 5. Sauvegarde dans metadata.json
await upsertDocument(filePath, analysis, hash);
```

### 2. Affichage (JSON → Interface)

```typescript
// 1. Au chargement de l'interface
useEffect(() => {
  // Charge les données initiales
  loadComponents().then(setComponents);

  // Polling toutes les 5 secondes
  const cleanup = watchForUpdates(setComponents, 5000);
  return cleanup;
}, []);

// 2. dataLoader.ts récupère metadata.json
const response = await fetch('/metadata.json');
const data = await response.json();

// 3. Les composants React affichent les données
<DashboardStats components={components} />
<ComponentDetail component={selectedComponent} />
```

## Format de données partagé

### Structure de `metadata.json`

```json
{
  "components": [
    {
      "id": "AP020",
      "name": "Gestion des factures fournisseurs",
      "summary": "Configuration des workflows d'approbation...",
      "domain": "Oracle ERP Cloud",
      "module": "AP",
      "documents": {
        "SETUP": {
          "type": "SETUP",
          "uploaded": true,
          "lastModified": "2025-01-15T10:30:00Z",
          "filePath": "./documents/AP020_SETUP.docx",
          "fileHash": "abc123..."
        },
        "SFD": { ... }
      },
      "cufParams": [
        {
          "param": "AP_APPROVAL_THRESHOLD",
          "value": "10000",
          "description": "Seuil d'approbation automatique",
          "sourceDocument": "SETUP"
        }
      ],
      "oracleTables": ["AP_INVOICES", "AP_SUPPLIERS"],
      "oicsIntegrations": ["FBDI_AP_INVOICES"],
      "keywords": ["workflow", "approval", "invoice"],
      "lastIndexed": "2025-01-15T10:35:00Z",
      "aiModel": "gemini-1.5-flash"
    }
  ],
  "lastUpdated": "2025-01-15T10:35:00Z",
  "version": "2.0"
}
```

## Scénarios d'utilisation

### Scénario 1 : Premier démarrage

```bash
# Terminal 1 - Robot
cd robot
npm install
npm run init       # Crée metadata.json vide
# Ajoutez GOOGLE_API_KEY dans .env
npm start          # Démarre la surveillance

# Terminal 2 - Interface
npm install
npm run dev        # Démarre sur http://localhost:5173

# Résultat : Interface affiche les données mock car metadata.json est vide
```

### Scénario 2 : Ajout de documents

```bash
# 1. Robot tourne en fond (Terminal 1)
# 2. Interface ouverte dans le navigateur

# 3. Déposez AP020_SETUP.docx dans robot/documents/
cp mon_fichier.docx robot/documents/AP020_SETUP.docx

# 4. Logs du robot (automatique) :
📄 Détection: AP020_SETUP.docx
📖 Parsing DOCX...
✅ 523 mots extraits
🤖 Envoi à Gemini...
✅ Analyse terminée - Domaine: Oracle ERP Cloud | Module: AP
💚 Indexation réussie pour AP020

# 5. Interface se rafraîchit automatiquement (5s plus tard)
# Le nouveau composant AP020 apparaît dans le dashboard
```

### Scénario 3 : Modification de document

```bash
# 1. Éditez AP020_SETUP.docx et sauvegardez

# 2. Robot détecte le changement :
♻️  Fichier modifié: AP020_SETUP.docx
📖 Parsing DOCX...
♻️  Mise à jour du composant: AP020
💾 Base de données sauvegardée

# 3. Interface se met à jour automatiquement
# Les nouvelles métadonnées apparaissent
```

## Configuration du polling

Par défaut, l'interface vérifie `metadata.json` toutes les 5 secondes.

Pour ajuster, modifiez `App.tsx`:

```typescript
// Polling toutes les 10 secondes au lieu de 5
const cleanup = watchForUpdates(setComponents, 10000);
```

## Mode développement

### Robot en mode watch

```bash
cd robot
npm run dev  # Redémarre automatiquement à chaque modification du code
```

### Interface en mode dev

```bash
npm run dev  # Hot reload automatique
```

## Déploiement en production

### Option 1 : Services séparés

```bash
# Robot en tant que service systemd/PM2
pm2 start robot/index.js --name dahb-robot

# Interface buildée et servie par nginx
npm run build
# Servir ./dist avec nginx
```

### Option 2 : Docker Compose

```yaml
version: '3.8'
services:
  robot:
    build: ./robot
    volumes:
      - ./metadata.json:/app/metadata.json
      - ./documents:/app/documents
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}

  web:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./metadata.json:/usr/share/nginx/html/metadata.json
```

## Synchronisation SharePoint (optionnel)

Pour synchroniser avec SharePoint (comme dans votre capture d'écran) :

```bash
# Créez un script de sync avec @pnp/sp ou API Graph
cd robot
npm install @pnp/sp

# Créez robot/sharepoint-sync.js qui :
# 1. Se connecte à SharePoint
# 2. Télécharge les fichiers des bibliothèques
# 3. Les place dans ./documents/
# 4. Le robot les détecte et les indexe automatiquement
```

## Troubleshooting

### Interface n'affiche pas les nouvelles données

1. Vérifiez que `metadata.json` existe et est valide
2. Ouvrez la console navigateur : cherchez `✅ Données du robot v2 chargées`
3. Vérifiez que Vite sert bien `metadata.json` (http://localhost:5173/metadata.json)

### Robot ne détecte pas les fichiers

1. Vérifiez les logs : `Surveillance active`
2. Vérifiez que les fichiers sont dans le bon dossier
3. Vérifiez l'extension (`.docx`, `.pdf`, `.txt` en minuscules)

### Erreurs Gemini

1. Vérifiez `GOOGLE_API_KEY` dans `.env`
2. Vérifiez les quotas API sur Google AI Studio
3. Le robot a un fallback : il indexe quand même le fichier avec des métadonnées minimales

## Monitoring

Consultez les logs du robot pour suivre l'activité :

```bash
cd robot
npm start 2>&1 | tee robot.log  # Sauvegarde les logs
```

Indicateurs clés :
- `📄 Détection` : Nouveau fichier
- `✅ Analyse terminée` : Traitement réussi
- `💾 Base de données sauvegardée` : Écriture OK
- `⏭️  Déjà à jour` : Fichier non modifié (optimisation)
