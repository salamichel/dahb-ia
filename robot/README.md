# 🤖 Robot V2 - Indexation Intelligente Multi-Domaine

Système d'indexation automatique de documents avec analyse IA par Gemini.

## 🎯 Fonctionnalités

- **Surveillance en temps réel** : Détecte automatiquement les nouveaux fichiers et modifications
- **Multi-formats** : Supporte DOCX, PDF et TXT
- **Multi-domaines** : S'adapte à Oracle ERP, Delphes, RBM-NRM, BI Publisher, ETL, IBM Cotre, Tradeshift, C2FO, Abacus
- **Analyse IA** : Extrait automatiquement les métadonnées pertinentes avec Gemini
- **Idempotence** : Ne retraite pas les fichiers non modifiés (utilise un hash SHA-256)
- **Base de données JSON** : Compatible avec l'interface React existante

## 📦 Installation

```bash
cd robot
npm install
```

## ⚙️ Configuration

1. Copiez le fichier d'exemple :
```bash
cp .env.example .env
```

2. Éditez `.env` et ajoutez votre clé API Google :
```env
GOOGLE_API_KEY=votre_clé_api_gemini_ici
WATCH_FOLDERS=./documents_erp,./documents_finance
OUTPUT_DB=../metadata.json
```

3. Créez les dossiers à surveiller :
```bash
mkdir -p documents_erp documents_finance documents_etl
```

## 🚀 Utilisation

### Démarrage standard
```bash
npm start
```

### Mode développement (auto-restart)
```bash
npm run dev
```

Le robot va :
1. Nettoyer la base de données (supprimer les références aux fichiers supprimés)
2. Scanner les dossiers configurés
3. Indexer tous les documents trouvés
4. Surveiller les modifications en temps réel

## 📁 Structure des données

Le robot génère un fichier JSON compatible avec l'interface React :

```json
{
  "components": [
    {
      "id": "AP020",
      "name": "Gestion des factures fournisseurs",
      "domain": "Oracle ERP Cloud",
      "module": "AP",
      "summary": "Configuration des workflows d'approbation...",
      "documents": {
        "SETUP": {
          "type": "SETUP",
          "uploaded": true,
          "lastModified": "2025-01-15T10:30:00Z",
          "filePath": "./documents_erp/AP020_SETUP.docx",
          "fileHash": "abc123..."
        }
      },
      "cufParams": [
        {
          "param": "AP_APPROVAL_THRESHOLD",
          "value": "10000",
          "description": "Seuil d'approbation automatique"
        }
      ],
      "oracleTables": ["AP_INVOICES", "AP_SUPPLIERS"],
      "oicsIntegrations": ["FBDI_AP_INVOICES"],
      "keywords": ["workflow", "approval", "invoice"],
      "lastIndexed": "2025-01-15T10:35:00Z"
    }
  ],
  "lastUpdated": "2025-01-15T10:35:00Z",
  "version": "2.0"
}
```

## 🎨 Domaines supportés

Le robot s'adapte automatiquement aux domaines suivants :

- **Oracle ERP Cloud** : GL, AP, AR, PO, OM, HCM, FA
- **Delphes-OeBS** : Migration depuis E-Business Suite
- **RBM-NRM** : Gestion des ressources naturelles
- **BI Publisher** : Rapports et modèles de données
- **ETL SI Finance** : Intégrations ODI/OIC
- **IBM Cotre** : Solutions IBM Cognos
- **Tradeshift** : Réseau fournisseurs
- **C2FO** : Optimisation du fonds de roulement
- **Abacus** : Système Abajus

## 🔍 Détection automatique

### ID du composant
Le robot extrait automatiquement l'ID depuis le nom du fichier et supporte plusieurs conventions de nommage :

**Format EVO (PTI Finance)** :
- `EVO.FINA.001_SET_0549_Interface_Bancaire.docx` → ID: `0549`, Type: `SETUP`, Nom: `Interface Bancaire`
- `EVO.FINA.001_SFD_0549_Interface_Bancaire.docx` → ID: `0549`, Type: `SFD`

**Format Standard (Oracle ERP)** :
- `AP020_SETUP.docx` → ID: `AP020`, Type: `SETUP`
- `GL018_spec_technique.pdf` → ID: `GL018`, Type: `STD` (auto-détecté)

**Format Libre** :
- `specification_0549.pdf` → ID: `0549`, Type: auto-détecté

📖 **Documentation complète** : Voir `NAMING_CONVENTIONS.md`

### Type de document
Détection basée sur des mots-clés :
- **SETUP** : setup, config, paramétrage, param
- **SFD** : sfd, spec fonctionnelle, fonctionnelle
- **STD** : std, spec technique, technique
- **FN** : fn, fiche, note
- **MOP** : mop, installation, déploiement

### Domaine métier
Détection intelligente basée sur le contenu et le nom du fichier :
- Mots-clés spécifiques à chaque domaine
- Analyse du contenu avec Gemini
- Fallback sur "General" si aucun domaine détecté

## 🛠️ Personnalisation

Éditez `config.js` pour :
- Ajouter de nouveaux domaines métier
- Modifier les mots-clés de détection
- Ajuster les champs extraits par domaine
- Changer les types de documents reconnus

Exemple d'ajout d'un nouveau domaine :

```javascript
'Mon Nouveau Domaine': {
  keywords: ['mot-clé1', 'mot-clé2'],
  modules: ['Module A', 'Module B'],
  extractFields: ['business_rules', 'technical_specs']
}
```

## 📊 Logs et monitoring

Le robot affiche en temps réel :
- 📄 Fichiers détectés
- 📖 Progression du parsing
- 🤖 Appels à l'API Gemini
- 💾 Mises à jour de la base
- ⚠️ Erreurs et avertissements

## ⚡ Performance

- **Cache intelligent** : Ne retraite pas les fichiers non modifiés
- **Limite de taille** : 50 MB par défaut (configurable)
- **Limite de tokens** : 500k caractères envoyés à Gemini
- **Stabilité** : Attend que l'écriture du fichier soit terminée avant de traiter

## 🔒 Sécurité

- Les clés API sont stockées dans `.env` (non versionné)
- Validation de la taille des fichiers
- Gestion des erreurs robuste
- Pas d'exécution de code arbitraire

## 🤝 Intégration avec l'interface React

Le fichier `metadata.json` généré est directement compatible avec l'interface React existante.
L'interface peut lire et afficher les données indexées en temps réel.

## 📝 Licence

MIT
